const Problem = require("../models/Problem");
const Partner = require("../models/Partner");
const cloudinary = require("../config/cloudinary");

const { predictCategory } = require("../services/aiCategoryService");
const {
  generateProblemEmbedding,
  detectDuplicates,
  getClusterSize,
} = require("../services/aiDuplicateService");
const {
  analyzeAndSavePriority,
} = require("../services/aiPriorityService");
const {
  summarizeProblem,
  saveSummary,
} = require("../services/aiSummaryService");
const {
  recommendPartners,
  toSuggestionDTOs,
  saveRoutingAnalysis,
} = require("../services/aiRoutingService");
const {
  notifyAdmins,
  notifyPartnerUser,
  createNotification,
} = require("../services/notificationService");

// ========================================
// CANDIDATE MATCH DTO
// ========================================
// Flattens a stored aiDuplicateCandidates entry into the
// flat shape the Admin UI expects. Used by both the create
// response and the read path so the two cannot drift.
//
// Also keeps the candidate's `embedding` out of API
// responses — a 384-float array per candidate is pure
// payload bloat for the client.

const toCandidateDTO = (candidate) => {
  if (!candidate) return null;

  // `problem` is a raw ObjectId when freshly computed, and a
  // populated document when read back from MongoDB. An ObjectId
  // is also `typeof "object"`, so test for a nested _id instead —
  // only a populated document has one.
  const populated = candidate.problem?._id ? candidate.problem : null;

  const problemId = populated ? populated._id : candidate.problem;

  // The referenced problem was deleted after the analysis ran.
  if (!problemId) return null;

  return {
    _id: problemId,

    title: populated?.title ?? candidate.title ?? "",

    description: populated?.description ?? candidate.description ?? "",

    category: populated?.category ?? candidate.category ?? "",

    status: populated?.status ?? candidate.status ?? "",

    createdAt: populated?.createdAt ?? candidate.createdAt ?? null,

    matchScore: candidate.matchScore ?? 0,

    semanticScore: candidate.semanticScore ?? 0,

    geoScore: candidate.geoScore ?? 0,

    categoryScore: candidate.categoryScore ?? 0,

    distanceKm: candidate.distanceKm ?? 0,

    // A problem solved since the analysis ran is a recurring
    // issue, not a duplicate — recompute from live status.
    matchType:
      (populated?.status ?? candidate.status) === "solved"
        ? "Recurring"
        : candidate.matchType || "Duplicate",
  };
};

// ========================================
// PERSIST DUPLICATE ANALYSIS
// ========================================
// Saves the AI's suggestions onto the problem so the Admin
// review UI can read them later. Returns the DTO list.

const saveDuplicateAnalysis = async (problemId, candidates) => {
  const stored = candidates.map((c) => ({
    problem: c.problem,
    matchScore: c.matchScore,
    semanticScore: c.semanticScore,
    geoScore: c.geoScore,
    categoryScore: c.categoryScore,
    distanceKm: c.distanceKm,
    matchType: c.matchType,
  }));

  await Problem.findByIdAndUpdate(problemId, {
    $set: {
      aiDuplicateCandidates: stored,
      aiDuplicateAnalyzedAt: new Date(),
    },
  });

  return candidates.map(toCandidateDTO).filter(Boolean);
};

// ========================================
// POPULATE CANDIDATES
// ========================================

const CANDIDATE_POPULATE_FIELDS = "title description category status createdAt";

// ========================================
// BUILD PROBLEM RESPONSE
// ========================================
// Re-reads a problem with every populate the Admin UI depends on
// and attaches the flat `candidateMatches` array.
//
// Every path that returns a problem to the Admin UI must go through
// here. Returning a partially-populated document instead leaves
// `parentProblem` as a bare id and drops candidateMatches entirely,
// which blanks out the AI review card — so status updates and
// partner assignment use this too, not just the AI review action.

const buildProblemResponse = async (problemId) => {
  const problem = await Problem.findById(problemId)

    .populate("submittedBy", "name email role")

    .populate(
      "assignedPartner",
      "name type description location email website",
    )

    .populate("parentProblem", "title status category createdAt")

    .populate("aiDuplicateCandidates.problem", CANDIDATE_POPULATE_FIELDS)

    .populate("aiRoutingCandidates.partner", "name type location description email website expertise capabilities districtsServed");

  if (!problem) return null;

  const problemResponse = problem.toObject();

  problemResponse.candidateMatches = (problem.aiDuplicateCandidates || [])
    .map(toCandidateDTO)
    .filter(Boolean);

  problemResponse.suggestedPartners = (problem.aiRoutingCandidates || [])
    .map((candidate) => ({
      partner: candidate.partner,
      matchScore: candidate.matchScore,
      expertiseScore: candidate.expertiseScore,
      geoScore: candidate.geoScore,
      categoryMatched: candidate.categoryMatched,
      reason: candidate.reason,
    }))
    .filter((item) => item.partner);

  // Link active Project (university team & industry collaborators) if constituted
  try {
    const Project = require("../models/Project");
    const project = await Project.findOne({ problem: problemId })
      .populate("partner", "name type location email")
      .populate("collaborators.partner", "name type location email");

    if (project) {
      problemResponse.linkedProject = project;
    }
  } catch (projErr) {
    console.warn("Failed to populate linked project:", projErr.message);
  }

  return problemResponse;
};

// ========================================
// CREATE A NEW PROBLEM
// ========================================

const createProblem = async (req, res) => {
  try {
    // ========================================
    // GET DATA FROM REQUEST
    // ========================================

    const {
      title,
      description,
      category,
      location,
      affectedPeople,
      severity,
      submitterType,
    } = req.body;

    // ========================================
    // PARSE LOCATION DETAILS
    // ========================================

    let locationDetails = req.body.locationDetails;

    if (typeof locationDetails === "string") {
      try {
        locationDetails = JSON.parse(locationDetails);
      } catch (error) {
        return res.status(400).json({
          message: "Invalid location details.",
        });
      }
    }

    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        message: "Please provide title, description, category and location",
      });
    }

    // ========================================
    // VALIDATE LOCATION
    // ========================================

    if (
      !locationDetails ||
      locationDetails.latitude === null ||
      locationDetails.latitude === undefined ||
      locationDetails.longitude === null ||
      locationDetails.longitude === undefined
    ) {
      return res.status(400).json({
        message: "Please provide a valid problem location.",
      });
    }

    // ========================================
    // CONVERT COORDINATES
    // ========================================

    const latitude = Number(locationDetails.latitude);

    const longitude = Number(locationDetails.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({
        message: "Invalid latitude or longitude.",
      });
    }

    // ========================================
    // UPLOAD IMAGES TO CLOUDINARY
    // ========================================
    // With the fields-based media uploader req.files is an
    // object keyed by field name (images / videos / documents).

    const uploadedImages = [];

    if (req.files && req.files.images && req.files.images.length > 0) {
      console.log(`Uploading ${req.files.images.length} image(s) to Cloudinary...`);

      for (const file of req.files.images) {
        console.log("Uploading:", file.originalname);

        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "samasyasetu/problems",

              resource_type: "image",
            },

            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            },
          );

          stream.end(file.buffer);
        });

        console.log("Cloudinary upload successful:", result.secure_url);

        uploadedImages.push({
          url: result.secure_url,

          publicId: result.public_id,
        });
      }
    }

    // ========================================
    // UPLOAD VIDEO TO CLOUDINARY
    // ========================================

    const uploadedVideos = [];

    if (req.files && req.files.videos && req.files.videos.length > 0) {
      const videoFile = req.files.videos[0];

      console.log("Uploading video:", videoFile.originalname);

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "samasyasetu/problems/videos",

            resource_type: "video",
          },

          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        stream.end(videoFile.buffer);
      });

      console.log("Cloudinary video upload successful:", result.secure_url);

      uploadedVideos.push({
        url: result.secure_url,

        publicId: result.public_id,
      });
    }

    // ========================================
    // UPLOAD DOCUMENTS TO CLOUDINARY
    // ========================================
    // PDF / Word / text files are stored as "raw" resources.

    const uploadedDocuments = [];

    if (req.files && req.files.documents && req.files.documents.length > 0) {
      console.log(`Uploading ${req.files.documents.length} document(s) to Cloudinary...`);

      for (const file of req.files.documents) {
        console.log("Uploading:", file.originalname);

        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "samasyasetu/problems/documents",

              resource_type: "raw",
            },

            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            },
          );

          stream.end(file.buffer);
        });

        console.log("Cloudinary document upload successful:", result.secure_url);

        uploadedDocuments.push({
          url: result.secure_url,

          publicId: result.public_id,

          originalName: file.originalname,

          fileType: file.mimetype,
        });
      }
    }

    // ========================================
    // AI CATEGORY PREDICTION
    // ========================================

    let aiCategory = null;

    let aiConfidence = null;

    let aiKeywords = [];

    let aiMargin = null;

    try {
      const aiResult = await predictCategory(title.trim(), description.trim());

      console.log("========================================");

      console.log("AI RESULT FROM SERVICE:");

      console.log(aiResult);

      console.log("========================================");

      // ========================================
      // AI CATEGORY
      // ========================================

      aiCategory = aiResult.category || null;

      // ========================================
      // AI CONFIDENCE
      // ========================================
      // Service returns "score"

      if (aiResult.confidence !== undefined && aiResult.confidence !== null) {
        aiConfidence = Number(aiResult.confidence);
      }

      // ========================================
      // AI MARGIN
      // ========================================

      if (aiResult.margin !== undefined && aiResult.margin !== null) {
        aiMargin = Number(aiResult.margin);
      }

      // ========================================
      // AI TOP CATEGORIES
      // ========================================
      // If service provides scores array,
      // save top 3 categories.

      if (Array.isArray(aiResult.scores)) {
        aiKeywords = aiResult.scores
          .slice(0, 3)
          .map((item) => item.category)
          .filter(Boolean);
      }

      // ========================================
      // FALLBACK
      // ========================================

      if (aiKeywords.length === 0 && aiCategory) {
        aiKeywords = [aiCategory];
      }

      // ========================================
      // DEBUG
      // ========================================

      console.log("AI CATEGORY:", aiCategory);

      console.log("AI CONFIDENCE:", aiConfidence);

      console.log("AI MARGIN:", aiMargin);

      console.log("AI KEYWORDS:", aiKeywords);
    } catch (aiError) {
      // ========================================
      // AI FAILURE SHOULD NOT BLOCK SUBMISSION
      // ========================================

      console.error("AI category prediction failed:", aiError.message);
    }

    // ========================================
    // AI EMBEDDING FOR DUPLICATE DETECTION
    // ========================================

    let embedding = [];

    try {
      embedding = await generateProblemEmbedding(
        title.trim(),
        description.trim(),
      );
    } catch (embeddingError) {
      console.error("Embedding generation failed:", embeddingError.message);
    }

    // ========================================
    // CREATE PROBLEM
    // ========================================

    const problem = await Problem.create({
      // ========================================
      // BASIC INFORMATION
      // ========================================

      title: title.trim(),

      description: description.trim(),

      // Citizen's selected category
      category: category.trim(),

      // ========================================
      // LOCATION
      // ========================================

      location: location.trim(),

      locationDetails: {
        district: locationDetails.district || "",

        state: locationDetails.state || "Jharkhand",

        pincode: locationDetails.pincode || "",

        latitude,

        longitude,
      },

      locationPoint: {
        type: "Point",
        coordinates: [longitude, latitude],
      },

      // ========================================
      // IMAGES
      // ========================================

      images: uploadedImages,

      // ========================================
      // VIDEO EVIDENCE
      // ========================================

      videos: uploadedVideos,

      // ========================================
      // SUPPORTING DOCUMENTS
      // ========================================

      documents: uploadedDocuments,

      // ========================================
      // IMPACT
      // ========================================

      affectedPeople: Number(affectedPeople) || 0,

      severity: severity || "medium",

      // ========================================
      // AI CLASSIFICATION
      // ========================================

      aiCategory: aiCategory || null,

      aiKeywords: Array.isArray(aiKeywords) ? aiKeywords : [],

      aiConfidence:
        aiConfidence !== null &&
        aiConfidence !== undefined &&
        !Number.isNaN(aiConfidence)
          ? Number(aiConfidence)
          : null,

      aiMargin:
        aiMargin !== null && aiMargin !== undefined && !Number.isNaN(aiMargin)
          ? Number(aiMargin)
          : null,

      // ========================================
      // AI EMBEDDING
      // ========================================

      embedding,

      // ========================================
      // USER & SUBMITTER TYPE
      // ========================================

      submittedBy: req.user._id,

      submitterType: submitterType || "individual",
    });

    // ========================================
    // DUPLICATE DETECTION + CLUSTER SIZE
    // ========================================
    // Runs after creation so the problem has an _id to
    // exclude from its own candidate search. Results are
    // persisted onto the problem — the Admin review UI reads
    // them from there, not from this response. The number of
    // candidates (the cluster) also feeds the priority score.

    let candidateMatches = [];

    let clusterSize = 0;

    try {
      const candidates = await detectDuplicates(problem, { embedding });

      candidateMatches = await saveDuplicateAnalysis(problem._id, candidates);

      clusterSize = await getClusterSize(problem);
    } catch (detectionError) {
      // A failure here must never block the citizen's submission.
      console.error("Duplicate detection failed:", detectionError.message);
    }

    // ========================================
    // AI PARTNER ROUTING
    // ========================================
    // Recommends the top 3 universities / industries for this
    // problem. Same contract as duplicate detection: a failure
    // must never block the submission, and the snapshot is
    // persisted for the Admin review UI. The hydrated DTOs are
    // returned so the citizen sees the matches immediately.

    let suggestedPartners = [];

    try {
      const { suggestions, message } = await recommendPartners(problem);

      if (suggestions.length > 0) {
        await saveRoutingAnalysis(problem._id, suggestions);

        suggestedPartners = await toSuggestionDTOs(suggestions);
      } else if (message) {
        console.log(`AI routing: ${message}`);
      }
    } catch (routingError) {
      console.error("AI routing failed:", routingError.message);
    }

    // ========================================
    // AI SUMMARY
    // ========================================
    // Local extractive summary for the admin triage queue.

    let summary = "";

    try {
      summary = summarizeProblem(problem);

      await saveSummary(problem._id, summary);
    } catch (summaryError) {
      console.error("AI summary failed:", summaryError.message);
    }

    // ========================================
    // AI PRIORITY
    // ========================================
    // Composite severity/scale/cluster/age score so the
    // admin queue can be triaged by urgency. Runs last so
    // it can use the cluster size computed above.

    let priority = null;

    try {
      priority = await analyzeAndSavePriority(problem, { clusterSize });
    } catch (priorityError) {
      console.error("AI priority failed:", priorityError.message);
    }

    // ========================================
    // NOTIFY ADMINS
    // ========================================
    // The government portal needs to triage new submissions.

    await notifyAdmins({
      type: "problem_submitted",

      title: "New problem submitted",

      message: `"${problem.title}" was reported in ${problem.location} by ${req.user.name}.`,

      problemId: problem._id,
    });

    // ========================================
    // SUCCESS RESPONSE
    // ========================================
    // The in-memory document still carries the embedding we
    // just wrote (select: false only hides it on queries), so
    // strip it rather than shipping 384 floats to the client.

    const problemResponse = problem.toObject();

    delete problemResponse.embedding;

    return res.status(201).json({
      message: "Problem submitted successfully",

      problem: problemResponse,

      candidateMatches,

      suggestedPartners,

      aiSummary: summary,

      aiPriority: priority,
    });
  } catch (error) {
    // ========================================
    // DETAILED ERROR
    // ========================================

    console.error("========================================");

    console.error("CREATE PROBLEM ERROR");

    console.error(error);

    console.error("ERROR MESSAGE:", error.message);

    console.error("========================================");

    return res.status(500).json({
      message: "Server error while submitting problem",

      error: error.message,
    });
  }
};

// ========================================
// GET ALL PROBLEMS
// ========================================

const getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.find()

      .populate("submittedBy", "name email role")

      .populate(
        "assignedPartner",
        "name type description location email website",
      )

      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      count: problems.length,

      problems,
    });
  } catch (error) {
    console.error("Get problems error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching problems",
    });
  }
};

// ========================================
// GET MY PROBLEMS
// ========================================

const getMyProblems = async (req, res) => {
  try {
    const problems = await Problem.find({
      submittedBy: req.user._id,
    })

      .populate(
        "assignedPartner",
        "name type description location email website",
      )

      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      count: problems.length,

      problems,
    });
  } catch (error) {
    console.error("Get my problems error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching your problems",
    });
  }
};

// ========================================
// DELETE MY PROBLEM
// ========================================

const deleteMyProblem = async (req, res) => {
  try {
    // ========================================
    // FIND ONLY USER'S OWN PROBLEM
    // ========================================

    const problem = await Problem.findOne({
      _id: req.params.id,

      submittedBy: req.user._id,
    });

    // ========================================
    // PROBLEM NOT FOUND
    // ========================================

    if (!problem) {
      return res.status(404).json({
        message:
          "Problem not found or you do not have permission to delete it.",
      });
    }

    // ========================================
    // ONLY SUBMITTED PROBLEMS CAN BE DELETED
    // ========================================

    if (problem.status !== "submitted") {
      return res.status(400).json({
        message: "Only problems with submitted status can be deleted.",
      });
    }

    // ========================================
    // DELETE CLOUDINARY IMAGES
    // ========================================

    if (problem.images && problem.images.length > 0) {
      for (const image of problem.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);

            console.log("Deleted Cloudinary image:", image.publicId);
          } catch (imageError) {
            console.error(
              "Failed to delete Cloudinary image:",
              imageError.message,
            );
          }
        }
      }
    }

    // ========================================
    // DELETE CLOUDINARY VIDEOS
    // ========================================

    if (problem.videos && problem.videos.length > 0) {
      for (const video of problem.videos) {
        if (video.publicId) {
          try {
            await cloudinary.uploader.destroy(video.publicId, {
              resource_type: "video",
            });

            console.log("Deleted Cloudinary video:", video.publicId);
          } catch (videoError) {
            console.error(
              "Failed to delete Cloudinary video:",
              videoError.message,
            );
          }
        }
      }
    }

    // ========================================
    // DELETE CLOUDINARY DOCUMENTS
    // ========================================

    if (problem.documents && problem.documents.length > 0) {
      for (const document of problem.documents) {
        if (document.publicId) {
          try {
            await cloudinary.uploader.destroy(document.publicId, {
              resource_type: "raw",
            });

            console.log("Deleted Cloudinary document:", document.publicId);
          } catch (documentError) {
            console.error(
              "Failed to delete Cloudinary document:",
              documentError.message,
            );
          }
        }
      }
    }

    // ========================================
    // DELETE PROBLEM FROM MONGODB
    // ========================================

    await Problem.findByIdAndDelete(problem._id);

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(200).json({
      message: "Problem deleted successfully.",
    });
  } catch (error) {
    console.error("Delete problem error:", error.message);

    return res.status(500).json({
      message: "Server error while deleting problem.",
    });
  }
};

// ========================================
// GET SINGLE PROBLEM
// ========================================

const getProblemById = async (req, res) => {
  try {
    // The Admin UI reads a flat `candidateMatches` array; the shared
    // builder owns that shape so the read and write paths cannot drift.
    const problemResponse = await buildProblemResponse(req.params.id);

    if (!problemResponse) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    return res.status(200).json({
      problem: problemResponse,
    });
  } catch (error) {
    console.error("Get problem error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching problem",
    });
  }
};

// ========================================
// RE-RUN DUPLICATE ANALYSIS (ADMIN)
// ========================================
// Lets an admin refresh the AI's suggestions on demand.
// Needed for problems submitted before this feature existed,
// and for refreshing stale suggestions once more reports
// have come in nearby.

const reanalyzeDuplicates = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).select("+embedding");

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    // A problem with no usable coordinates can never match
    // anything, so say so instead of returning a silent empty list.
    const coordinates = problem.locationPoint?.coordinates;

    const hasCoordinates =
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      !(coordinates[0] === 0 && coordinates[1] === 0);

    if (!hasCoordinates) {
      return res.status(400).json({
        message:
          "This problem has no map coordinates, so duplicate detection cannot run. Run the backfill script to populate coordinates for older problems.",
      });
    }

    const candidates = await detectDuplicates(problem, {
      embedding: problem.embedding,
    });

    const candidateMatches = await saveDuplicateAnalysis(
      problem._id,
      candidates,
    );

    // Refreshing suggestions must never overwrite an admin's decision.
    // `aiReviewStatus` is deliberately left alone here — the admin
    // reopens the review explicitly if they want to change their mind.
    const reviewWasPreserved = problem.aiReviewStatus !== "pending";

    const message = reviewWasPreserved
      ? `Duplicate analysis complete. ${candidateMatches.length} candidate match(es) found. This problem is already reviewed, so its existing decision was kept — reopen the review to change it.`
      : `Duplicate analysis complete. ${candidateMatches.length} candidate match(es) found.`;

    return res.status(200).json({
      message,

      reviewWasPreserved,

      candidateMatches,
    });
  } catch (error) {
    console.error("Re-analyze duplicates error:", error.message);

    return res.status(500).json({
      message: "Server error while running duplicate analysis",
      error: error.message,
    });
  }
};

// ========================================
// RE-RUN AI PARTNER ROUTING (ADMIN)
// ========================================
// Recomputes the top university/industry suggestions for one
// problem and persists them. Needed for problems submitted
// before the routing engine existed (including seeded demo
// data) and for refreshing suggestions after the partner
// registry or the scoring engine changes.

const rerunRouting = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    const { suggestions, message: routingMessage } = await recommendPartners(
      problem,
    );

    if (suggestions.length === 0) {
      return res.status(200).json({
        message:
          routingMessage ||
          "No suitable partners found. Check that the partner registry has organizations with matching expertise.",
      });
    }

    await saveRoutingAnalysis(problem._id, suggestions);

    return res.status(200).json({
      message: `AI routing complete. ${suggestions.length} partner suggestion(s) saved.`,

      problem: await buildProblemResponse(problem._id),
    });
  } catch (error) {
    console.error("Re-run routing error:", error.message);

    return res.status(500).json({
      message: "Server error while running AI routing",
      error: error.message,
    });
  }
};

// ========================================
// UPDATE PROBLEM STATUS
// ========================================

const updateProblemStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "submitted",

      "under_review",

      "assigned",

      "in_progress",

      "solved",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid problem status",
      });
    }

    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    if (status === "assigned" && !problem.assignedPartner) {
      return res.status(400).json({
        message:
          "Please assign a partner before setting the status to assigned.",
      });
    }

    problem.status = status;

    await problem.save();

    // ========================================
    // NOTIFY CITIZEN + PARTNER
    // ========================================
    // The submitter always wants to know their problem moved.
    // If a partner is attached, its linked user is told too.
    // Awaiting the promise keeps test runs deterministic —
    // these are cheap single-document writes.

    await createNotification({
      recipientId: problem.submittedBy,

      type: "problem_status",

      title: "Problem status updated",

      message: `Your problem "${problem.title}" is now ${status.replace("_", " ")}.`,

      problemId: problem._id,
    });

    if (problem.assignedPartner) {
      await notifyPartnerUser({
        partnerId: problem.assignedPartner,

        type: "problem_status",

        title: "Problem status updated",

        message: `"${problem.title}" assigned to your organization is now ${status.replace("_", " ")}.`,

        problemId: problem._id,
      });
    }

    return res.status(200).json({
      message: "Problem status updated successfully",

      problem: await buildProblemResponse(problem._id),
    });
  } catch (error) {
    console.error("Update problem status error:", error.message);

    return res.status(500).json({
      message: "Server error while updating problem status",
    });
  }
};

// ========================================
// ASSIGN PARTNER TO PROBLEM
// ========================================

const assignPartnerToProblem = async (req, res) => {
  try {
    const { partnerId } = req.body;

    if (!partnerId) {
      return res.status(400).json({
        message: "Please provide a partner ID",
      });
    }

    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    const partner = await Partner.findById(partnerId);

    if (!partner) {
      return res.status(404).json({
        message: "Partner not found",
      });
    }

    problem.assignedPartner = partner._id;

    problem.status = "assigned";

    await problem.save();

    // ========================================
    // NOTIFY PARTNER + CITIZEN
    // ========================================
    // The partner learns it has new work; the citizen learns
    // their problem has found an owner.

    await notifyPartnerUser({
      partnerId: partner._id,

      type: "problem_assigned",

      title: "New problem assigned",

      message: `"${problem.title}" (${problem.location}) has been assigned to your organization.`,

      problemId: problem._id,
    });

    await createNotification({
      recipientId: problem.submittedBy,

      type: "problem_assigned",

      title: "Problem assigned",

      message: `Your problem "${problem.title}" has been assigned to ${partner.name}.`,

      problemId: problem._id,
    });

    return res.status(200).json({
      message: "Partner assigned successfully",

      problem: await buildProblemResponse(problem._id),
    });
  } catch (error) {
    console.error("Assign partner error:", error.message);

    return res.status(500).json({
      message: "Server error while assigning partner",
    });
  }
};

// ========================================
// GET PARTNER DASHBOARD
// ========================================

const getPartnerDashboard = async (req, res) => {
  try {
    if (!req.user.partner) {
      return res.status(400).json({
        message: "This partner user is not linked to any partner organization.",
      });
    }

    const partnerId = req.user.partner;

    const partner = await Partner.findById(partnerId);

    if (!partner) {
      return res.status(404).json({
        message: "Partner organization not found.",
      });
    }

    const totalProblems = await Problem.countDocuments({
      assignedPartner: partnerId,
    });

    const assignedProblems = await Problem.countDocuments({
      assignedPartner: partnerId,

      status: "assigned",
    });

    const inProgressProblems = await Problem.countDocuments({
      assignedPartner: partnerId,

      status: "in_progress",
    });

    const solvedProblems = await Problem.countDocuments({
      assignedPartner: partnerId,

      status: "solved",
    });

    return res.status(200).json({
      partner,

      statistics: {
        totalProblems,

        assignedProblems,

        inProgressProblems,

        solvedProblems,
      },
    });
  } catch (error) {
    console.error("Partner dashboard error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching partner dashboard.",
    });
  }
};

// ========================================
// GET PARTNER ASSIGNED PROBLEMS
// ========================================

const getPartnerProblems = async (req, res) => {
  try {
    if (!req.user.partner) {
      return res.status(400).json({
        message: "This partner user is not linked to any partner organization.",
      });
    }

    const problems = await Problem.find({
      assignedPartner: req.user.partner,
    })

      .populate("submittedBy", "name email")

      .populate("assignedPartner", "name type location")

      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      count: problems.length,

      problems,
    });
  } catch (error) {
    console.error("Get partner problems error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching partner problems.",
    });
  }
};

// ========================================
// PARTNER UPDATE PROBLEM STATUS
// ========================================

const updatePartnerProblemStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!req.user.partner) {
      return res.status(403).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const allowedStatuses = ["in_progress", "solved"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Partners can only update a problem to in_progress or solved.",
      });
    }

    const problem = await Problem.findOne({
      _id: req.params.id,

      assignedPartner: req.user.partner,
    });

    if (!problem) {
      return res.status(404).json({
        message:
          "Problem not found or you do not have permission to update it.",
      });
    }

    problem.status = status;

    await problem.save();

    await problem.populate("submittedBy", "name email");

    await problem.populate("assignedPartner", "name type location");

    // ========================================
    // NOTIFY CITIZEN + ADMINS
    // ========================================
    // The citizen sees progress on their problem; admins track
    // how partners are moving their queue.

    await createNotification({
      recipientId: problem.submittedBy,

      type: "problem_status",

      title: "Problem status updated",

      message: `Your problem "${problem.title}" is now ${status.replace("_", " ")}.`,

      problemId: problem._id,
    });

    await notifyAdmins({
      type: "problem_status",

      title: "Partner updated problem status",

      message: `"${problem.title}" was moved to ${status.replace("_", " ")} by ${req.user.name}.`,

      problemId: problem._id,
    });

    return res.status(200).json({
      message: "Problem status updated successfully.",

      problem,
    });
  } catch (error) {
    console.error("Partner update problem status error:", error.message);

    return res.status(500).json({
      message: "Server error while updating problem status.",
    });
  }
};

// ========================================
// ADMIN AI REVIEW ACTION
// ========================================

const aiReviewProblem = async (req, res) => {
  try {
    const { action, parentProblemId } = req.body;

    const allowedActions = [
      "confirm_duplicate",
      "confirm_recurring",
      "keep_separate",
      "reopen_review",
    ];

    if (!action || !allowedActions.includes(action)) {
      return res.status(400).json({
        message: `Invalid action. Allowed actions: ${allowedActions.join(", ")}`,
      });
    }

    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    // ========================================
    // VALIDATE PARENT PROBLEM
    // ========================================
    // Linking a problem to itself would make the "View Merged
    // Problem" banner point back at the page it is shown on.

    const needsParent =
      action === "confirm_duplicate" || action === "confirm_recurring";

    if (needsParent) {
      if (!parentProblemId) {
        return res.status(400).json({
          message: "A parent problem is required to confirm a duplicate or recurring issue.",
        });
      }

      if (String(parentProblemId) === String(problem._id)) {
        return res.status(400).json({
          message: "A problem cannot be marked as a duplicate of itself.",
        });
      }

      const parentExists = await Problem.exists({ _id: parentProblemId });

      if (!parentExists) {
        return res.status(404).json({
          message: "The selected parent problem no longer exists.",
        });
      }
    }

    // ========================================
    // APPLY THE ADMIN'S DECISION
    // ========================================
    // Every branch sets all three fields so a decision can be
    // changed later without leaving stale flags behind.

    switch (action) {
      case "confirm_duplicate":
        problem.isDuplicate = true;
        problem.isRecurring = false;
        problem.aiReviewStatus = "confirmed_duplicate";
        problem.parentProblem = parentProblemId;
        break;

      case "confirm_recurring":
        problem.isDuplicate = false;
        problem.isRecurring = true;
        problem.aiReviewStatus = "marked_recurring";
        problem.parentProblem = parentProblemId;
        break;

      case "keep_separate":
        problem.isDuplicate = false;
        problem.isRecurring = false;
        problem.aiReviewStatus = "confirmed_separate";
        problem.parentProblem = null;
        break;

      // Returns the problem to the unreviewed state so the admin can
      // pick a different candidate. Without this there is no transition
      // out of a decision, and the candidate list stays hidden forever.
      case "reopen_review":
        problem.isDuplicate = false;
        problem.isRecurring = false;
        problem.aiReviewStatus = "pending";
        problem.parentProblem = null;
        break;
    }

    await problem.save();

    return res.status(200).json({
      message:
        action === "reopen_review"
          ? "Review reopened. The AI suggestions are available again."
          : "AI review updated successfully",

      problem: await buildProblemResponse(problem._id),
    });
  } catch (error) {
    console.error("AI review error:", error.message);

    return res.status(500).json({
      message: "Server error while updating AI review",
    });
  }
};

// ========================================
// EXPORT CONTROLLERS
// ========================================

module.exports = {
  createProblem,

  getAllProblems,

  getMyProblems,

  deleteMyProblem,

  getProblemById,

  updateProblemStatus,

  assignPartnerToProblem,

  getPartnerDashboard,

  getPartnerProblems,

  updatePartnerProblemStatus,

  aiReviewProblem,

  reanalyzeDuplicates,
  rerunRouting,
};

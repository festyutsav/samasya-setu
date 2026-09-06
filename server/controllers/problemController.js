const mongoose = require("mongoose");
const Problem = require("../models/Problem");
const Partner = require("../models/Partner");
const User = require("../models/User");
const Project = require("../models/Project");
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
// BACKGROUND AI ENRICHMENT (FOR ADMIN PORTAL)
// ========================================
// Computes dense vectors, duplicate matches, partner
// routing suggestions, extractive summary, urgency priority score,
// and notifies administrators asynchronously.
// Runs non-blockingly via setImmediate after the citizen's HTTP 201 response.

const runBackgroundAIEnrichment = async (problemId, user) => {
  try {
    const problem = await Problem.findById(problemId);
    if (!problem) return;

    console.log(`[Async AI] Starting background enrichment for problem "${problem.title}" (${problem._id})...`);

    // 1. Generate Problem Embedding
    let embedding = [];
    try {
      embedding = await generateProblemEmbedding(problem.title, problem.description);
      if (embedding && embedding.length > 0) {
        await Problem.findByIdAndUpdate(problemId, { $set: { embedding } });
        problem.embedding = embedding;
      }
    } catch (err) {
      console.error("[Async AI] Embedding generation failed:", err.message);
    }

    // 2. Duplicate Detection & Cluster Size
    let clusterSize = 0;
    try {
      const candidates = await detectDuplicates(problem, { embedding });
      await saveDuplicateAnalysis(problemId, candidates);
      clusterSize = await getClusterSize(problem);
      console.log(`[Async AI] Duplicates analyzed: ${candidates.length} candidates, cluster size ${clusterSize}.`);
    } catch (err) {
      console.error("[Async AI] Duplicate detection failed:", err.message);
    }

    // 3. AI Partner Routing Recommendations
    try {
      const { suggestions, message } = await recommendPartners(problem);
      if (suggestions && suggestions.length > 0) {
        await saveRoutingAnalysis(problemId, suggestions);
        console.log(`[Async AI] Partner routing completed: ${suggestions.length} partners suggested.`);
      } else if (message) {
        console.log(`[Async AI] Partner routing: ${message}`);
      }
    } catch (err) {
      console.error("[Async AI] Partner routing failed:", err.message);
    }

    // 4. AI Extractive Summary
    try {
      const summary = summarizeProblem(problem);
      if (summary) {
        await saveSummary(problemId, summary);
        console.log("[Async AI] Summary generated successfully.");
      }
    } catch (err) {
      console.error("[Async AI] Summary generation failed:", err.message);
    }

    // 5. AI Urgency Priority Score
    try {
      const priority = await analyzeAndSavePriority(problem, { clusterSize });
      console.log(`[Async AI] Priority scored: ${priority?.score} (${priority?.level}).`);
    } catch (err) {
      console.error("[Async AI] Priority scoring failed:", err.message);
    }

    // 6. Notify Government Admins
    try {
      await notifyAdmins({
        type: "problem_submitted",
        title: "New problem submitted",
        message: `"${problem.title}" was reported in ${problem.location} by ${user?.name || "Citizen"}.`,
        problemId: problem._id,
      });
      console.log("[Async AI] Government admins notified.");
    } catch (err) {
      console.error("[Async AI] Admin notification failed:", err.message);
    }

    console.log(`[Async AI] All background enrichment completed for problem "${problem.title}"!`);
  } catch (globalErr) {
    console.error("[Async AI] Critical background enrichment error:", globalErr.message);
  }
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
    // UPLOAD MEDIA TO CLOUDINARY IN PARALLEL
    // ========================================

    const uploadedImages = [];
    const uploadedVideos = [];
    const uploadedDocuments = [];
    const uploadTasks = [];

    // Images
    if (req.files?.images?.length > 0) {
      console.log(`Streaming ${req.files.images.length} image(s) to Cloudinary concurrently...`);
      req.files.images.forEach((file) => {
        uploadTasks.push(
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "samasyasetu/problems",
                resource_type: "image",
                transformation: [{ width: 1400, crop: "limit", quality: "auto" }],
              },
              (error, result) => {
                if (error) {
                  console.error("Cloudinary image upload error:", error);
                  reject(error);
                } else {
                  uploadedImages.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                  });
                  resolve();
                }
              }
            );
            stream.end(file.buffer);
          })
        );
      });
    }

    // Video
    if (req.files?.videos?.length > 0) {
      const videoFile = req.files.videos[0];
      console.log("Streaming video to Cloudinary:", videoFile.originalname);
      uploadTasks.push(
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "samasyasetu/problems/videos",
              resource_type: "video",
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary video upload error:", error);
                reject(error);
              } else {
                uploadedVideos.push({
                  url: result.secure_url,
                  publicId: result.public_id,
                });
                resolve();
              }
            }
          );
          stream.end(videoFile.buffer);
        })
      );
    }

    // Documents
    if (req.files?.documents?.length > 0) {
      console.log(`Streaming ${req.files.documents.length} document(s) to Cloudinary concurrently...`);
      req.files.documents.forEach((file) => {
        uploadTasks.push(
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "samasyasetu/problems/documents",
                resource_type: "raw",
              },
              (error, result) => {
                if (error) {
                  console.error("Cloudinary document upload error:", error);
                  reject(error);
                } else {
                  uploadedDocuments.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                    originalName: file.originalname,
                    fileType: file.mimetype,
                  });
                  resolve();
                }
              }
            );
            stream.end(file.buffer);
          })
        );
      });
    }

    if (uploadTasks.length > 0) {
      await Promise.all(uploadTasks);
    }

    // ========================================
    // AI CATEGORY PREDICTION (SYNCHRONOUS: ~80-100ms)
    // ========================================
    // Synchronously predicts and validates category for the problem record

    let aiCategory = null;
    let aiConfidence = null;
    let aiKeywords = [];
    let aiMargin = null;

    try {
      const aiResult = await predictCategory(title.trim(), description.trim());
      aiCategory = aiResult.category || null;

      if (aiResult.confidence !== undefined && aiResult.confidence !== null) {
        aiConfidence = Number(aiResult.confidence);
      }

      if (aiResult.margin !== undefined && aiResult.margin !== null) {
        aiMargin = Number(aiResult.margin);
      }

      if (Array.isArray(aiResult.scores)) {
        aiKeywords = aiResult.scores
          .slice(0, 3)
          .map((item) => item.category)
          .filter(Boolean);
      }

      if (aiKeywords.length === 0 && aiCategory) {
        aiKeywords = [aiCategory];
      }
    } catch (aiError) {
      console.error("AI category prediction failed:", aiError.message);
    }

    // ========================================
    // CREATE PROBLEM IN MONGODB
    // ========================================

    const problem = await Problem.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
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
      images: uploadedImages,
      videos: uploadedVideos,
      documents: uploadedDocuments,
      affectedPeople: Number(affectedPeople) || 0,
      severity: severity || "medium",
      aiCategory: aiCategory || null,
      aiKeywords: Array.isArray(aiKeywords) ? aiKeywords : [],
      aiConfidence:
        aiConfidence !== null &&
        aiConfidence !== undefined &&
        !Number.isNaN(aiConfidence)
          ? Number(aiConfidence)
          : null,
      aiMargin:
        aiMargin !== null &&
        aiMargin !== undefined &&
        !Number.isNaN(aiMargin)
          ? Number(aiMargin)
          : null,
      submittedBy: req.user._id,
      submitterType: submitterType || "individual",
    });

    // ========================================
    // IMMEDIATE RESPONSE TO CITIZEN (< 1.5s)
    // ========================================

    const problemResponse = problem.toObject();
    delete problemResponse.embedding;

    res.status(201).json({
      message: "Problem submitted successfully",
      problem: problemResponse,
    });

    // ========================================
    // DISPATCH BACKGROUND AI ENRICHMENT (NON-BLOCKING)
    // ========================================
    // Computes duplicate analysis, partner routing, summaries, priority,
    // and dispatches admin notifications in the background so the citizen
    // never waits. Updates the Admin Panel within 2-4 seconds.

    setImmediate(async () => {
      try {
        await runBackgroundAIEnrichment(problem._id, req.user);
      } catch (bgErr) {
        console.error("Async AI task error:", bgErr.message);
      }
    });
  } catch (error) {
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

    if (status === "solved") {
      problem.resolutionApprovedAt = new Date();
    }

    await problem.save();

    // ========================================
    // NOTIFY CITIZEN + PARTNER
    // ========================================

    const citizenMessage =
      status === "solved"
        ? `Great news! Your problem "${problem.title}" has been successfully SOLVED by the assigned team. Official resolution certificate is now ready.`
        : `Your problem "${problem.title}" is now ${status.replace("_", " ")}.`;

    await createNotification({
      recipientId: problem.submittedBy,

      type: "problem_status",

      title: status === "solved" ? "Problem Solved! 🎉" : "Problem status updated",

      message: citizenMessage,

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
// RESOLVE PARTNER FOR USER (SELF-HEALING)
// ========================================
// Resolves canonical partner document and all related partner IDs
// (handling multi-seed duplicates and auto-linking req.user.partner).
const resolvePartnerForUser = async (user) => {
  if (!user) return { partner: null, partnerIds: [] };

  let partner = null;

  if (user.partner) {
    partner = await Partner.findById(user.partner);
  }

  if (!partner && user._id) {
    partner = await Partner.findOne({ user: user._id });
  }

  if (!partner && user.email) {
    partner = await Partner.findOne({ email: user.email.toLowerCase() });
    if (!partner) {
      const emailPrefix = user.email.split("@")[0].replace(/[._-]/g, " ").trim();
      partner = await Partner.findOne({
        name: new RegExp(`^${emailPrefix}$`, "i"),
      });
      if (!partner) {
        partner = await Partner.findOne({
          name: new RegExp(emailPrefix.split(" ")[0], "i"),
        });
      }
    }
  }

  if (!partner) {
    return { partner: null, partnerIds: [] };
  }

  // Auto-heal user.partner reference if missing or pointing to outdated id
  if (String(user.partner || "") !== String(partner._id)) {
    user.partner = partner._id;
    await User.findByIdAndUpdate(user._id, { partner: partner._id }).catch(() => {});
  }

  // Find all partner documents that match this organization name
  const escapedName = partner.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const relatedPartners = await Partner.find({
    $or: [
      { _id: partner._id },
      { name: new RegExp(`^${escapedName}$`, "i") },
      { user: user._id },
    ],
  }).select("_id");

  const partnerIds = Array.from(
    new Set(relatedPartners.map((p) => p._id.toString()))
  ).map((id) => new mongoose.Types.ObjectId(id));

  return { partner, partnerIds };
};

// ========================================
// GET PARTNER DASHBOARD
// ========================================

const getPartnerDashboard = async (req, res) => {
  try {
    const { partner, partnerIds } = await resolvePartnerForUser(req.user);

    if (!partner || partnerIds.length === 0) {
      return res.status(400).json({
        message: "This partner user is not linked to any partner organization.",
      });
    }

    const totalProblems = await Problem.countDocuments({
      assignedPartner: { $in: partnerIds },
    });

    const assignedProblems = await Problem.countDocuments({
      assignedPartner: { $in: partnerIds },
      status: "assigned",
    });

    const inProgressProblems = await Problem.countDocuments({
      assignedPartner: { $in: partnerIds },
      status: "in_progress",
    });

    const solvedProblems = await Problem.countDocuments({
      assignedPartner: { $in: partnerIds },
      status: "solved",
    });

    // Also count collaborative projects where this organization participates
    const collaborativeProjectsCount = await Project.countDocuments({
      $or: [
        { partner: { $in: partnerIds } },
        { "collaborators.partner": { $in: partnerIds } },
      ],
    });

    const activeCollaborationsCount = await Project.countDocuments({
      "collaborators.partner": { $in: partnerIds },
      "collaborators.status": "accepted",
    });

    return res.status(200).json({
      partner,
      statistics: {
        totalProblems,
        assignedProblems,
        inProgressProblems,
        solvedProblems,
        collaborativeProjectsCount,
        activeCollaborationsCount,
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
    const { partner, partnerIds } = await resolvePartnerForUser(req.user);

    if (!partner || partnerIds.length === 0) {
      return res.status(400).json({
        message: "This partner user is not linked to any partner organization.",
      });
    }

    const problems = await Problem.find({
      assignedPartner: { $in: partnerIds },
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
    const { partner, partnerIds } = await resolvePartnerForUser(req.user);

    if (!partner || partnerIds.length === 0) {
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
      assignedPartner: { $in: partnerIds },
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

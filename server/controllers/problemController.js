const Problem = require("../models/Problem");
const Partner = require("../models/Partner");
const cloudinary = require("../config/cloudinary");

const { predictCategory } = require("../services/aiCategoryService");

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
        message:
          "Please provide title, description, category and location",
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

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      return res.status(400).json({
        message: "Invalid latitude or longitude.",
      });
    }

    // ========================================
    // UPLOAD IMAGES TO CLOUDINARY
    // ========================================

    const uploadedImages = [];

    if (req.files && req.files.length > 0) {
      console.log(
        `Uploading ${req.files.length} image(s) to Cloudinary...`
      );

      for (const file of req.files) {
        console.log(
          "Uploading:",
          file.originalname
        );

        const result = await new Promise(
          (resolve, reject) => {
            const stream =
              cloudinary.uploader.upload_stream(
                {
                  folder:
                    "samasyasetu/problems",

                  resource_type:
                    "image",
                },

                (error, result) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              );

            stream.end(file.buffer);
          }
        );

        console.log(
          "Cloudinary upload successful:",
          result.secure_url
        );

        uploadedImages.push({
          url: result.secure_url,

          publicId:
            result.public_id,
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
      const aiResult =
        await predictCategory(
          title.trim(),
          description.trim()
        );

      console.log(
        "========================================"
      );

      console.log(
        "AI RESULT FROM SERVICE:"
      );

      console.log(aiResult);

      console.log(
        "========================================"
      );

      // ========================================
      // AI CATEGORY
      // ========================================

      aiCategory =
        aiResult.category || null;

      // ========================================
      // AI CONFIDENCE
      // ========================================
      // Service returns "score"

      if (
        aiResult.score !== undefined &&
        aiResult.score !== null
      ) {
        aiConfidence =
          Number(aiResult.score);
      }

      // ========================================
      // AI MARGIN
      // ========================================

      if (
        aiResult.margin !== undefined &&
        aiResult.margin !== null
      ) {
        aiMargin =
          Number(aiResult.margin);
      }

      // ========================================
      // AI TOP CATEGORIES
      // ========================================
      // If service provides scores array,
      // save top 3 categories.

      if (
        Array.isArray(aiResult.scores)
      ) {
        aiKeywords =
          aiResult.scores
            .slice(0, 3)
            .map(
              (item) =>
                item.category
            )
            .filter(Boolean);
      }

      // ========================================
      // FALLBACK
      // ========================================

      if (
        aiKeywords.length === 0 &&
        aiCategory
      ) {
        aiKeywords = [
          aiCategory,
        ];
      }

      // ========================================
      // DEBUG
      // ========================================

      console.log(
        "AI CATEGORY:",
        aiCategory
      );

      console.log(
        "AI CONFIDENCE:",
        aiConfidence
      );

      console.log(
        "AI MARGIN:",
        aiMargin
      );

      console.log(
        "AI KEYWORDS:",
        aiKeywords
      );

    } catch (aiError) {

      // ========================================
      // AI FAILURE SHOULD NOT BLOCK SUBMISSION
      // ========================================

      console.error(
        "AI category prediction failed:",
        aiError.message
      );
    }

    // ========================================
    // CREATE PROBLEM
    // ========================================

    const problem =
      await Problem.create({

        // ========================================
        // BASIC INFORMATION
        // ========================================

        title:
          title.trim(),

        description:
          description.trim(),

        // Citizen's selected category
        category:
          category.trim(),

        // ========================================
        // LOCATION
        // ========================================

        location:
          location.trim(),

        locationDetails: {

          district:
            locationDetails.district || "",

          state:
            locationDetails.state ||
            "Jharkhand",

          pincode:
            locationDetails.pincode || "",

          latitude,

          longitude,
        },

        // ========================================
        // IMAGES
        // ========================================

        images:
          uploadedImages,

        // ========================================
        // IMPACT
        // ========================================

        affectedPeople:
          Number(affectedPeople) || 0,

        severity:
          severity || "medium",

        // ========================================
        // AI CLASSIFICATION
        // ========================================

        aiCategory:
          aiCategory || null,

        aiKeywords:
          Array.isArray(aiKeywords)
            ? aiKeywords
            : [],

        aiConfidence:
          aiConfidence !== null &&
          aiConfidence !== undefined &&
          !Number.isNaN(
            aiConfidence
          )
            ? Number(aiConfidence)
            : null,

        aiMargin:
          aiMargin !== null &&
          aiMargin !== undefined &&
          !Number.isNaN(
            aiMargin
          )
            ? Number(aiMargin)
            : null,

        // ========================================
        // USER
        // ========================================

        submittedBy:
          req.user._id,
      });

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(201).json({

      message:
        "Problem submitted successfully",

      problem,
    });

  } catch (error) {

    // ========================================
    // DETAILED ERROR
    // ========================================

    console.error(
      "========================================"
    );

    console.error(
      "CREATE PROBLEM ERROR"
    );

    console.error(error);

    console.error(
      "ERROR MESSAGE:",
      error.message
    );

    console.error(
      "========================================"
    );

    return res.status(500).json({

      message:
        "Server error while submitting problem",

      error:
        error.message,
    });
  }
};


// ========================================
// GET ALL PROBLEMS
// ========================================

const getAllProblems = async (
  req,
  res
) => {
  try {

    const problems =
      await Problem.find()

        .populate(
          "submittedBy",
          "name email role"
        )

        .populate(
          "assignedPartner",
          "name type description location email website"
        )

        .sort({
          createdAt: -1,
        });

    return res.status(200).json({

      count:
        problems.length,

      problems,
    });

  } catch (error) {

    console.error(
      "Get problems error:",
      error.message
    );

    return res.status(500).json({

      message:
        "Server error while fetching problems",
    });
  }
};


// ========================================
// GET MY PROBLEMS
// ========================================

const getMyProblems = async (
  req,
  res
) => {
  try {

    const problems =
      await Problem.find({

        submittedBy:
          req.user._id,
      })

        .populate(
          "assignedPartner",
          "name type description location email website"
        )

        .sort({
          createdAt: -1,
        });

    return res.status(200).json({

      count:
        problems.length,

      problems,
    });

  } catch (error) {

    console.error(
      "Get my problems error:",
      error.message
    );

    return res.status(500).json({

      message:
        "Server error while fetching your problems",
    });
  }
};


// ========================================
// DELETE MY PROBLEM
// ========================================

const deleteMyProblem = async (
  req,
  res
) => {
  try {

    // ========================================
    // FIND ONLY USER'S OWN PROBLEM
    // ========================================

    const problem =
      await Problem.findOne({

        _id:
          req.params.id,

        submittedBy:
          req.user._id,
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

    if (
      problem.status !==
      "submitted"
    ) {

      return res.status(400).json({

        message:
          "Only problems with submitted status can be deleted.",
      });
    }

    // ========================================
    // DELETE CLOUDINARY IMAGES
    // ========================================

    if (
      problem.images &&
      problem.images.length > 0
    ) {

      for (
        const image of problem.images
      ) {

        if (image.publicId) {

          try {

            await cloudinary.uploader.destroy(
              image.publicId
            );

            console.log(
              "Deleted Cloudinary image:",
              image.publicId
            );

          } catch (imageError) {

            console.error(
              "Failed to delete Cloudinary image:",
              imageError.message
            );
          }
        }
      }
    }

    // ========================================
    // DELETE PROBLEM FROM MONGODB
    // ========================================

    await Problem.findByIdAndDelete(
      problem._id
    );

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(200).json({

      message:
        "Problem deleted successfully.",
    });

  } catch (error) {

    console.error(
      "Delete problem error:",
      error.message
    );

    return res.status(500).json({

      message:
        "Server error while deleting problem.",
    });
  }
};


// ========================================
// GET SINGLE PROBLEM
// ========================================

const getProblemById = async (
  req,
  res
) => {
  try {

    const problem =
      await Problem.findById(
        req.params.id
      )

        .populate(
          "submittedBy",
          "name email role"
        )

        .populate(
          "assignedPartner",
          "name type description location email website"
        );

    if (!problem) {

      return res.status(404).json({

        message:
          "Problem not found",
      });
    }

    return res.status(200).json({

      problem,
    });

  } catch (error) {

    console.error(
      "Get problem error:",
      error.message
    );

    return res.status(500).json({

      message:
        "Server error while fetching problem",
    });
  }
};


// ========================================
// UPDATE PROBLEM STATUS
// ========================================

const updateProblemStatus = async (
  req,
  res
) => {
  try {

    const { status } =
      req.body;

    const allowedStatuses = [

      "submitted",

      "under_review",

      "assigned",

      "in_progress",

      "solved",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {

      return res.status(400).json({

        message:
          "Invalid problem status",
      });
    }

    const problem =
      await Problem.findById(
        req.params.id
      );

    if (!problem) {

      return res.status(404).json({

        message:
          "Problem not found",
      });
    }

    if (
      status === "assigned" &&
      !problem.assignedPartner
    ) {

      return res.status(400).json({

        message:
          "Please assign a partner before setting the status to assigned.",
      });
    }

    problem.status =
      status;

    await problem.save();

    await problem.populate(
      "submittedBy",
      "name email role"
    );

    await problem.populate(
      "assignedPartner",
      "name type description location email website"
    );

    return res.status(200).json({

      message:
        "Problem status updated successfully",

      problem,
    });

  } catch (error) {

    console.error(
      "Update problem status error:",
      error.message
    );

    return res.status(500).json({

      message:
        "Server error while updating problem status",
    });
  }
};


// ========================================
// ASSIGN PARTNER TO PROBLEM
// ========================================

const assignPartnerToProblem = async (
  req,
  res
) => {
  try {

    const { partnerId } =
      req.body;

    if (!partnerId) {

      return res.status(400).json({

        message:
          "Please provide a partner ID",
      });
    }

    const problem =
      await Problem.findById(
        req.params.id
      );

    if (!problem) {

      return res.status(404).json({

        message:
          "Problem not found",
      });
    }

    const partner =
      await Partner.findById(
        partnerId
      );

    if (!partner) {

      return res.status(404).json({

        message:
          "Partner not found",
      });
    }

    problem.assignedPartner =
      partner._id;

    problem.status =
      "assigned";

    await problem.save();

    await problem.populate(
      "submittedBy",
      "name email role"
    );

    await problem.populate(
      "assignedPartner",
      "name type description location email website"
    );

    return res.status(200).json({

      message:
        "Partner assigned successfully",

      problem,
    });

  } catch (error) {

    console.error(
      "Assign partner error:",
      error.message
    );

    return res.status(500).json({

      message:
        "Server error while assigning partner",
    });
  }
};


// ========================================
// GET PARTNER DASHBOARD
// ========================================

const getPartnerDashboard = async (
  req,
  res
) => {
  try {

    if (!req.user.partner) {

      return res.status(400).json({

        message:
          "This partner user is not linked to any partner organization.",
      });
    }

    const partnerId =
      req.user.partner;

    const partner =
      await Partner.findById(
        partnerId
      );

    if (!partner) {

      return res.status(404).json({

        message:
          "Partner organization not found.",
      });
    }

    const totalProblems =
      await Problem.countDocuments({

        assignedPartner:
          partnerId,
      });

    const assignedProblems =
      await Problem.countDocuments({

        assignedPartner:
          partnerId,

        status:
          "assigned",
      });

    const inProgressProblems =
      await Problem.countDocuments({

        assignedPartner:
          partnerId,

        status:
          "in_progress",
      });

    const solvedProblems =
      await Problem.countDocuments({

        assignedPartner:
          partnerId,

        status:
          "solved",
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

    console.error(
      "Partner dashboard error:",
      error.message
    );

    return res.status(500).json({

      message:
        "Server error while fetching partner dashboard.",
    });
  }
};


// ========================================
// GET PARTNER ASSIGNED PROBLEMS
// ========================================

const getPartnerProblems = async (
  req,
  res
) => {
  try {

    if (!req.user.partner) {

      return res.status(400).json({

        message:
          "This partner user is not linked to any partner organization.",
      });
    }

    const problems =
      await Problem.find({

        assignedPartner:
          req.user.partner,
      })

        .populate(
          "submittedBy",
          "name email"
        )

        .populate(
          "assignedPartner",
          "name type location"
        )

        .sort({
          createdAt: -1,
        });

    return res.status(200).json({

      count:
        problems.length,

      problems,
    });

  } catch (error) {

    console.error(
      "Get partner problems error:",
      error.message
    );

    return res.status(500).json({

      message:
        "Server error while fetching partner problems.",
    });
  }
};


// ========================================
// PARTNER UPDATE PROBLEM STATUS
// ========================================

const updatePartnerProblemStatus = async (
  req,
  res
) => {
  try {

    const { status } =
      req.body;

    if (!req.user.partner) {

      return res.status(403).json({

        message:
          "You are not linked to a partner organization.",
      });
    }

    const allowedStatuses = [

      "in_progress",

      "solved",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {

      return res.status(400).json({

        message:
          "Partners can only update a problem to in_progress or solved.",
      });
    }

    const problem =
      await Problem.findOne({

        _id:
          req.params.id,

        assignedPartner:
          req.user.partner,
      });

    if (!problem) {

      return res.status(404).json({

        message:
          "Problem not found or you do not have permission to update it.",
      });
    }

    problem.status =
      status;

    await problem.save();

    await problem.populate(
      "submittedBy",
      "name email"
    );

    await problem.populate(
      "assignedPartner",
      "name type location"
    );

    return res.status(200).json({

      message:
        "Problem status updated successfully.",

      problem,
    });

  } catch (error) {

    console.error(
      "Partner update problem status error:",
      error.message
    );

    return res.status(500).json({

      message:
        "Server error while updating problem status.",
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

};
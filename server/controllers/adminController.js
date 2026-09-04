const Problem = require("../models/Problem");
const Partner = require("../models/Partner");
const User = require("../models/User");
const Project = require("../models/Project");
const SolutionProposal = require("../models/SolutionProposal");
const Notification = require("../models/Notification");
const {
  createNotification,
  notifyPartnerUser,
} = require("../services/notificationService");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const fs = require("fs");


// ========================================
// GET DASHBOARD STATISTICS
// ========================================

const getDashboardStats = async (req, res) => {

  try {

    const totalProblems =
      await Problem.countDocuments();


    const submittedProblems =
      await Problem.countDocuments({
        status: "submitted",
      });


    const underReviewProblems =
      await Problem.countDocuments({
        status: "under_review",
      });


    const assignedProblems =
      await Problem.countDocuments({
        status: "assigned",
      });


    const inProgressProblems =
      await Problem.countDocuments({
        status: "in_progress",
      });


    const solvedProblems =
      await Problem.countDocuments({
        status: "solved",
      });


    return res.status(200).json({

      totalProblems,

      submittedProblems,

      underReviewProblems,

      assignedProblems,

      inProgressProblems,

      solvedProblems,

    });

  } catch (error) {

    console.error(
      "Dashboard stats error:",
      error.message
    );


    return res.status(500).json({

      message:
        "Server error while fetching dashboard statistics",

    });

  }

};


// ========================================
// GET GOVERNMENT ANALYTICS
// ========================================
// One aggregation endpoint powering the analytics dashboard.
// Everything is derived from fields the Problem model already
// stores: category (domain), locationDetails.district,
// assignedPartner (participation) and status (completion).

const getAnalytics = async (req, res) => {
  try {
    const solvedCount = {
      $sum: {
        $cond: [{ $eq: ["$status", "solved"] }, 1, 0],
      },
    };

    const [
      totalProblems,
      categoryWise,
      districtWise,
      statusWise,
      partnerWise,
      monthlyTrend,
      severityWise,
      totalPartners,
      projectStatusWise,
      projectMetrics,
      collaboratorRoleWise,
      impactMetrics,
      projectOutcomes,
      districtCategoryWise,
    ] = await Promise.all([
      Problem.countDocuments(),

      // DOMAIN-WISE DISTRIBUTION: problems + solved per category.

      Problem.aggregate([
        {
          $group: {
            _id: "$category",
            total: { $sum: 1 },
            solved: solvedCount,
            affectedPeople: { $sum: "$affectedPeople" },
          },
        },
        { $sort: { total: -1 } },
        {
          $project: {
            _id: 0,
            category: "$_id",
            total: 1,
            solved: 1,
            affectedPeople: 1,
          },
        },
      ]),

      // DISTRICT COVERAGE: problems per district, with empty
      // districts bucketed under "Unknown".

      Problem.aggregate([
        {
          $group: {
            _id: {
              $let: {
                vars: {
                  district: {
                    $trim: {
                      input: {
                        $ifNull: ["$locationDetails.district", ""],
                      },
                    },
                  },
                },
                in: {
                  $cond: [
                    { $eq: ["$$district", ""] },
                    "Unknown",
                    "$$district",
                  ],
                },
              },
            },
            total: { $sum: 1 },
            solved: solvedCount,
            affectedPeople: { $sum: "$affectedPeople" },
          },
        },
        { $sort: { total: -1 } },
        {
          $project: {
            _id: 0,
            district: "$_id",
            total: 1,
            solved: 1,
            affectedPeople: 1,
          },
        },
      ]),

      // STATUS PIPELINE: count per workflow status.

      Problem.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // PARTNER PARTICIPATION: problems assigned per partner,
      // enriched with partner name/type for the chart labels.

      Problem.aggregate([
        { $match: { assignedPartner: { $ne: null } } },
        {
          $group: {
            _id: "$assignedPartner",
            total: { $sum: 1 },
            solved: solvedCount,
          },
        },
        {
          $lookup: {
            from: "partners",
            localField: "_id",
            foreignField: "_id",
            as: "partner",
          },
        },
        { $unwind: "$partner" },
        {
          $project: {
            _id: 0,
            partnerId: "$_id",
            name: "$partner.name",
            type: "$partner.type",
            total: 1,
            solved: 1,
          },
        },
        { $sort: { total: -1 } },
      ]),

      // SUBMISSION TREND: monthly submitted vs solved over the
      // last 6 months.

      Problem.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                new Date().setDate(new Date().getDate() - 180)
              ),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            submitted: { $sum: 1 },
            solved: solvedCount,
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            submitted: 1,
            solved: 1,
          },
        },
      ]),

      // SEVERITY MIX: low / medium / high / critical.

      Problem.aggregate([
        {
          $group: {
            _id: "$severity",
            count: { $sum: 1 },
          },
        },
      ]),

      Partner.countDocuments(),

      // PROJECT LIFECYCLE: count per project status
      // (planning / active / completed).

      Project.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // PROJECT PROGRESS: totals plus milestone completion
      // across all projects — the PS's "project completion
      // rate" is lifecycle progress, not problem status.

      Project.aggregate([
        {
          $project: {
            status: 1,
            totalMilestones: { $size: "$milestones" },
            completedMilestones: {
              $size: {
                $filter: {
                  input: "$milestones",
                  cond: "$$this.completed",
                },
              },
            },
            collaboratorCount: { $size: "$collaborators" },
          },
        },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            completedProjects: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
              },
            },
            totalMilestones: { $sum: "$totalMilestones" },
            completedMilestones: { $sum: "$completedMilestones" },
            totalCollaborators: { $sum: "$collaboratorCount" },
          },
        },
      ]),

      // INDUSTRY ENGAGEMENT: accepted collaborators per role
      // (mentor / funder / co-developer / adopter) — the PS's
      // "industry engagement" signal.

      Project.aggregate([
        { $unwind: "$collaborators" },
        { $match: { "collaborators.status": "accepted" } },
        {
          $group: {
            _id: "$collaborators.role",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            role: "$_id",
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),

      // COMMUNITY IMPACT: total people affected by reported
      // problems across all districts and sectors.

      Problem.aggregate([
        {
          $group: {
            _id: null,
            totalAffected: { $sum: "$affectedPeople" },
          },
        },
      ]),

      // INNOVATION OUTCOMES: total patents, startups,
      // publications and deployments across all projects.

      Project.aggregate([
        {
          $group: {
            _id: null,
            patents: { $sum: "$outcomes.patents" },
            startups: { $sum: "$outcomes.startups" },
            publications: { $sum: "$outcomes.publications" },
            deployments: { $sum: "$outcomes.deployments" },
          },
        },
      ]),

      // SECTOR x DISTRICT CROSS-TAB: problems per district per
      // category — powers the coverage matrix heatmap.

      Problem.aggregate([
        {
          $group: {
            _id: {
              district: {
                $let: {
                  vars: {
                    district: {
                      $trim: {
                        input: {
                          $ifNull: ["$locationDetails.district", ""],
                        },
                      },
                    },
                  },
                  in: {
                    $cond: [
                      { $eq: ["$$district", ""] },
                      "Unknown",
                      "$$district",
                    ],
                  },
                },
              },
              category: "$category",
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            district: "$_id.district",
            category: "$_id.category",
            count: 1,
          },
        },
        { $sort: { district: 1, count: -1 } },
      ]),
    ]);

    const solvedTotal = statusWise.find(
      (entry) => entry._id === "solved"
    )?.count || 0;

    const engagedStatuses = ["assigned", "in_progress", "solved"];

    const engagedTotal = statusWise
      .filter((entry) => engagedStatuses.includes(entry._id))
      .reduce((sum, entry) => sum + entry.count, 0);

    const districtsCovered = districtWise.filter(
      (entry) => entry.district !== "Unknown"
    ).length;

    // ========================================
    // PROJECT METRICS
    // ========================================

    const projects = projectMetrics[0] || {};

    const totalProjects = projects.totalProjects || 0;

    const completedProjects = projects.completedProjects || 0;

    const totalMilestones = projects.totalMilestones || 0;

    const completedMilestones = projects.completedMilestones || 0;

    const activeProjects =
      projectStatusWise.find((entry) => entry._id === "active")
        ?.count || 0;

    const industryEngagements = collaboratorRoleWise.reduce(
      (sum, entry) => sum + entry.count,
      0
    );

    return res.status(200).json({
      summary: {
        totalProblems,

        solvedProblems: solvedTotal,

        completionRate:
          totalProblems > 0
            ? Math.round((solvedTotal / totalProblems) * 100)
            : 0,

        engagementRate:
          totalProblems > 0
            ? Math.round((engagedTotal / totalProblems) * 100)
            : 0,

        districtsCovered,

        totalPartners,

        activePartners: partnerWise.length,

        totalProjects,

        activeProjects,

        completedProjects,

        projectCompletionRate:
          totalProjects > 0
            ? Math.round((completedProjects / totalProjects) * 100)
            : 0,

        milestoneProgress:
          totalMilestones > 0
            ? Math.round((completedMilestones / totalMilestones) * 100)
            : 0,

        industryEngagements,

        peopleAffected: impactMetrics[0]?.totalAffected || 0,
      },

      categoryWise,

      districtWise,

      statusWise,

      partnerWise,

      monthlyTrend,

      severityWise,

      projectStatusWise,

      collaboratorRoleWise,

      projectOutcomes: projectOutcomes[0] || {
        patents: 0,
        startups: 0,
        publications: 0,
        deployments: 0,
      },

      districtCategoryWise,
    });
  } catch (error) {
    console.error("Analytics error:", error.message);

    return res.status(500).json({
      message:
        "Server error while fetching analytics",
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

    const { problemId } =
      req.params;


    const { status } =
      req.body;


    // ========================================
    // ALLOWED STATUSES
    // ========================================

    const allowedStatuses = [

      "submitted",

      "under_review",

      "assigned",

      "in_progress",

      "solved",

    ];


    // ========================================
    // VALIDATE STATUS
    // ========================================

    if (!status) {

      return res.status(400).json({

        message:
          "Problem status is required",

      });

    }


    if (
      !allowedStatuses.includes(status)
    ) {

      return res.status(400).json({

        message:
          "Invalid problem status",

      });

    }


    // ========================================
    // PREPARE UPDATE DATA
    // ========================================

    const updateData = {

      status,

    };


    // ========================================
    // REMOVE ASSIGNED PARTNER
    // ========================================

    /*
      When the admin moves a problem back to:

      - submitted
      - under_review

      the problem should no longer have an
      assigned university/partner.

      We explicitly set assignedPartner to null
      because the schema supports null as the
      default value.
    */

    if (
      status === "submitted" ||
      status === "under_review"
    ) {
      updateData.assignedPartner = null;
    }

    if (status === "solved") {
      updateData.resolutionApprovedAt = new Date();
    }

    // ========================================
    // UPDATE PROBLEM
    // ========================================

    const problem = await Problem.findByIdAndUpdate(
      problemId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // ========================================
    // CHECK PROBLEM
    // ========================================

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    // ========================================
    // POPULATE UPDATED DATA
    // ========================================

    await problem.populate([
      {
        path: "submittedBy",
        select: "name email",
      },
      {
        path: "assignedPartner",
        select: "name type location",
      },
    ]);

    // ========================================
    // NOTIFY CITIZEN + PARTNER
    // ========================================

    if (problem.submittedBy) {
      const citizenMessage =
        status === "solved"
          ? `Great news! Your problem "${problem.title}" has been verified and marked SOLVED by the Government Admin. Official Resolution Certificate is now available.`
          : `Your problem "${problem.title}" status is now ${status.replace("_", " ")}.`;

      await createNotification({
        recipientId: problem.submittedBy._id || problem.submittedBy,
        type: "problem_status",
        title: status === "solved" ? "Problem Solved! 🎉" : "Status Updated",
        message: citizenMessage,
        problemId: problem._id,
      }).catch(() => {});
    }

    if (problem.assignedPartner) {
      await notifyPartnerUser({
        partnerId: problem.assignedPartner._id || problem.assignedPartner,
        type: "problem_status",
        title: status === "solved" ? "Resolution Approved" : "Status Updated",
        message: `Admin marked "${problem.title}" as ${status.replace("_", " ")}.`,
        problemId: problem._id,
      }).catch(() => {});
    }

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(200).json({
      message: "Problem status updated successfully",
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
// DOWNLOAD PARTNER CREDENTIALS
// ========================================
// Streams the admin credentials vault (plaintext passwords)
// and enriches each entry with the partner's full routing
// profile from the DB, so the export doubles as a complete
// partner registry: profile, expertise, districts, login.

const downloadPartnerCredentials = async (
  req,
  res
) => {
  try {
    const credentialsPath = path.join(
      __dirname,
      "..",
      "scripts",
      "partner_credentials.json"
    );

    if (!fs.existsSync(credentialsPath)) {
      return res.status(404).json({
        message:
          "Credentials file not found. Run the seed script first.",
      });
    }

    let credentials;

    try {
      credentials = JSON.parse(
        fs.readFileSync(credentialsPath, "utf8")
      );
    } catch (parseError) {
      console.error(
        "Credentials parse error:",
        parseError.message
      );

      return res.status(500).json({
        message: "Credentials file is corrupted.",
      });
    }

    // ========================================
    // ENRICH FROM DATABASE
    // ========================================
    // Seed-era entries only carry name/type/login. Fill in
    // the partner's live profile so the file is a complete
    // registry, not just a password list.

    const Partner = require("../models/Partner");

    const partners = await Partner.find({}).populate(
      "user",
      "email"
    );

    const partnerByName = new Map(
      partners.map((partner) => [
        String(partner.name || "").toLowerCase(),
        partner,
      ])
    );

    const enriched = credentials.map((entry) => {
      const partner = partnerByName.get(
        String(entry.name || "").toLowerCase()
      );

      if (!partner) {
        return entry;
      }

      return {
        ...entry,

        loginEmail: entry.loginEmail || partner.user?.email || "",

        location: entry.location || partner.location || "",

        description: entry.description || partner.description || "",

        expertise: partner.expertise?.length
          ? partner.expertise
          : entry.expertise || [],

        capabilities: partner.capabilities?.length
          ? partner.capabilities
          : entry.capabilities || [],

        districtsServed: partner.districtsServed?.length
          ? partner.districtsServed
          : entry.districtsServed || [],
      };
    });

    res.setHeader(
      "Content-Type",
      "application/json"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=partner_credentials.json"
    );

    return res.send(
      JSON.stringify(enriched, null, 2)
    );
  } catch (error) {
    console.error(
      "Download credentials error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while downloading credentials",
    });
  }
};


// ========================================
// DELETE PROBLEM BY ADMIN
// ========================================

const deleteProblemByAdmin = async (req, res) => {
  try {
    const problemId = req.params.problemId || req.params.id;

    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found.",
      });
    }

    // 1. Clean up Cloudinary images
    if (problem.images && problem.images.length > 0) {
      for (const image of problem.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (err) {
            console.error("Failed to delete Cloudinary image:", err.message);
          }
        }
      }
    }

    // 2. Clean up Cloudinary videos
    if (problem.videos && problem.videos.length > 0) {
      for (const video of problem.videos) {
        if (video.publicId) {
          try {
            await cloudinary.uploader.destroy(video.publicId, {
              resource_type: "video",
            });
          } catch (err) {
            console.error("Failed to delete Cloudinary video:", err.message);
          }
        }
      }
    }

    // 3. Clean up Cloudinary documents
    if (problem.documents && problem.documents.length > 0) {
      for (const doc of problem.documents) {
        if (doc.publicId) {
          try {
            await cloudinary.uploader.destroy(doc.publicId, {
              resource_type: "raw",
            });
          } catch (err) {
            console.error("Failed to delete Cloudinary document:", err.message);
          }
        }
      }
    }

    // 4. Clean up related records in database
    await Project.deleteMany({ problem: problem._id });
    await SolutionProposal.deleteMany({ problemId: problem._id });
    await Notification.deleteMany({ relatedProblem: problem._id });

    // Clear duplicate / recurring references pointing to this problem
    await Problem.updateMany(
      { duplicateOf: problem._id },
      { $set: { duplicateOf: null, duplicateScore: null } }
    );
    await Problem.updateMany(
      { parentProblem: problem._id },
      { $set: { parentProblem: null, isDuplicate: false, isRecurring: false } }
    );
    await Problem.updateMany(
      { "aiDuplicateCandidates.problem": problem._id },
      { $pull: { aiDuplicateCandidates: { problem: problem._id } } }
    );

    // 5. Delete the problem itself
    await Problem.findByIdAndDelete(problem._id);

    return res.status(200).json({
      success: true,
      message: "Problem and all associated records deleted successfully.",
    });
  } catch (error) {
    console.error("Admin delete problem error:", error);
    return res.status(500).json({
      message: "Server error while deleting problem.",
      error: error.message,
    });
  }
};


// ========================================
// EXPORTS
// ========================================

module.exports = {

  getDashboardStats,

  getAnalytics,

  updateProblemStatus,

  downloadPartnerCredentials,

  deleteProblemByAdmin,

};
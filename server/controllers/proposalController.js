const SolutionProposal = require("../models/SolutionProposal");
const Problem = require("../models/Problem");
const Partner = require("../models/Partner");
const cloudinary = require("../config/cloudinary");
const { notifyAdmins, notifyPartnerUser, createNotification } = require("../services/notificationService");

// ========================================
// CREATE PROPOSAL
// ========================================

const createProposal = async (req, res) => {
  try {
    const {
      problemId,
      title,
      description,
      approach,
      team,
      timeline,
      documents,
    } = req.body;

    if (!problemId || !title || !description || !approach) {
      return res.status(400).json({
        message:
          "problemId, title, description and approach are required.",
      });
    }

    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found.",
      });
    }

    if (!req.user.partner) {
      return res.status(400).json({
        message:
          "You are not linked to a partner organization.",
      });
    }

    const university = await Partner.findById(req.user.partner);

    if (!university || university.type !== "university") {
      return res.status(400).json({
        message:
          "Only university partners can submit proposals.",
      });
    }

    const existing = await SolutionProposal.findOne({
      problem: problemId,
      university: req.user.partner,
    });

    if (existing) {
      return res.status(400).json({
        message:
          "A proposal for this problem already exists.",
      });
    }

    const proposal = await SolutionProposal.create({
      problem: problemId,
      university: req.user.partner,
      submittedBy: req.user._id,
      title: title.trim(),
      description: description.trim(),
      approach: approach.trim(),
      team: team || [],
      timeline: timeline || { startDate: new Date(), endDate: new Date(), milestones: [] },
      documents: documents || [],
      status: "submitted",
    });

    await proposal.populate("university", "name type location email website");

    await proposal.populate("problem", "title description category status");

    await proposal.populate("submittedBy", "name email");

    // ========================================
    // NOTIFY ADMINS
    // ========================================
    // A proposal is waiting for the government's review.

    await notifyAdmins({
      type: "proposal_submitted",

      title: "New solution proposal",

      message: `${university.name} submitted a proposal "${proposal.title}" for "${problem.title}".`,

      problemId: problem._id,
    });

    return res.status(201).json({
      message: "Proposal submitted successfully.",
      proposal,
    });
  } catch (error) {
    console.error("Create proposal error:", error.message);

    return res.status(500).json({
      message: "Server error while creating proposal.",
    });
  }
};

// ========================================
// GET PROPOSALS FOR A PROBLEM
// ========================================

const getProposalsForProblem = async (req, res) => {
  try {
    const { problemId } = req.params;

    const proposals = await SolutionProposal.find({ problem: problemId })
      .populate("university", "name type location email website expertise")
      .populate("submittedBy", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: proposals.length,
      proposals,
    });
  } catch (error) {
    console.error("Get proposals error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching proposals.",
    });
  }
};

// ========================================
// GET MY PROPOSALS (UNIVERSITY)
// ========================================

const getMyProposals = async (req, res) => {
  try {
    if (!req.user.partner) {
      return res.status(400).json({
        message: "You are not linked to a partner organization.",
      });
    }

    const proposals = await SolutionProposal.find({
      university: req.user.partner,
    })
      .populate("problem", "title description category status createdAt")
      .populate("submittedBy", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: proposals.length,
      proposals,
    });
  } catch (error) {
    console.error("Get my proposals error:", error.message);

    return res.status(500).json({
      message: "Server error while fetching proposals.",
    });
  }
};

// ========================================
// REVIEW PROPOSAL (ADMIN)
// ========================================

const reviewProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { status, reviewNotes } = req.body;

    const allowedStatuses = ["approved", "rejected", "under_review"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Allowed: approved, rejected, under_review.",
      });
    }

    const proposal = await SolutionProposal.findById(proposalId);

    if (!proposal) {
      return res.status(404).json({
        message: "Proposal not found.",
      });
    }

    proposal.status = status;
    proposal.reviewNotes = reviewNotes || "";
    proposal.reviewedBy = req.user._id;
    proposal.reviewedAt = new Date();

    await proposal.save();

    await proposal.populate("university", "name type location email website");

    await proposal.populate(
      "problem",
      "title description category status submittedBy",
    );

    await proposal.populate("submittedBy", "name email");

    await proposal.populate("reviewedBy", "name email");

    // ========================================
    // NOTIFY THE UNIVERSITY
    // ========================================
    // The submitting organization needs the review outcome.

    await notifyPartnerUser({
      partnerId: proposal.university._id,

      type: "proposal_reviewed",

      title: `Proposal ${status}`,

      message: `Your proposal "${proposal.title}" for "${proposal.problem.title}" was ${status}.${
        reviewNotes ? ` Note: ${reviewNotes}` : ""
      }`,

      problemId: proposal.problem._id,
    });

    // If the proposal was approved, the citizen also deserves
    // to know a solution is moving forward on their problem.

    if (status === "approved" && proposal.problem.submittedBy) {
      await createNotification({
        recipientId: proposal.problem.submittedBy,

        type: "proposal_reviewed",

        title: "Solution proposal approved",

        message: `A solution proposal for your problem "${proposal.problem.title}" by ${proposal.university.name} was approved.`,

        problemId: proposal.problem._id,
      });
    }

    return res.status(200).json({
      message: `Proposal ${status} successfully.`,
      proposal,
    });
  } catch (error) {
    console.error("Review proposal error:", error.message);

    return res.status(500).json({
      message: "Server error while reviewing proposal.",
    });
  }
};

// ========================================
// UPDATE PROPOSAL (UNIVERSITY)
// ========================================

const updateProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { title, description, approach, team, timeline, documents } = req.body;

    const proposal = await SolutionProposal.findById(proposalId);

    if (!proposal) {
      return res.status(404).json({
        message: "Proposal not found.",
      });
    }

    if (String(proposal.university) !== String(req.user.partner)) {
      return res.status(403).json({
        message:
          "You do not have permission to update this proposal.",
      });
    }

    if (proposal.status === "approved") {
      return res.status(400).json({
        message:
          "Approved proposals cannot be modified.",
      });
    }

    if (title) proposal.title = title.trim();
    if (description) proposal.description = description.trim();
    if (approach) proposal.approach = approach.trim();
    if (team) proposal.team = team;
    if (timeline) proposal.timeline = timeline;
    if (documents) proposal.documents = documents;

    proposal.status = "submitted";

    await proposal.save();

    await proposal.populate("university", "name type location email website");

    await proposal.populate("problem", "title description category status");

    await proposal.populate("submittedBy", "name email");

    return res.status(200).json({
      message: "Proposal updated successfully.",
      proposal,
    });
  } catch (error) {
    console.error("Update proposal error:", error.message);

    return res.status(500).json({
      message: "Server error while updating proposal.",
    });
  }
};

// ========================================
// DELETE PROPOSAL
// ========================================

const deleteProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposal = await SolutionProposal.findById(proposalId);

    if (!proposal) {
      return res.status(404).json({
        message: "Proposal not found.",
      });
    }

    if (String(proposal.university) !== String(req.user.partner)) {
      return res.status(403).json({
        message:
          "You do not have permission to delete this proposal.",
      });
    }

    if (proposal.status === "approved") {
      return res.status(400).json({
        message:
          "Approved proposals cannot be deleted.",
      });
    }

    for (const doc of proposal.documents || []) {
      if (doc.publicId) {
        try {
          await cloudinary.uploader.destroy(doc.publicId);
        } catch (cloudinaryError) {
          console.error(
            "Failed to delete Cloudinary document:",
            cloudinaryError.message
          );
        }
      }
    }

    await SolutionProposal.findByIdAndDelete(proposalId);

    return res.status(200).json({
      message: "Proposal deleted successfully.",
    });
  } catch (error) {
    console.error("Delete proposal error:", error.message);

    return res.status(500).json({
      message: "Server error while deleting proposal.",
    });
  }
};

module.exports = {
  createProposal,
  getProposalsForProblem,
  getMyProposals,
  reviewProposal,
  updateProposal,
  deleteProposal,
};

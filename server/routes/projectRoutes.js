const express = require("express");

const {
  createProject,
  getMyProjects,
  getProjectById,
  updateProjectStatus,
  updateProjectOutcomes,
  toggleMilestone,
  setMilestoneDueDate,
  inviteCollaborator,
  respondToInvite,
  withdrawCollaborator,
  addContribution,
  requestCollaboration,
  postProjectMessage,
  getProjectMessages,
} = require("../controllers/projectController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// All project routes require a partner login.

router.use(protect, authorizeRoles("partner"));

// Create a project (universities only — enforced in the controller)

router.post("/", createProject);

// List my organization's projects

router.get("/mine", getMyProjects);

// Fetch a single project (shared workspace — lead and live
// collaborators only, enforced in the controller)

router.get("/:id", getProjectById);

// Update a project's status

router.patch("/:id/status", updateProjectStatus);

// Toggle a milestone's completion

router.patch("/:id/milestones", toggleMilestone);

// Set a milestone's due date (lead university only)

router.patch("/:id/milestones/due-date", setMilestoneDueDate);

// Record innovation outcomes (lead university only)

router.patch("/:id/outcomes", updateProjectOutcomes);

// ========================================
// INDUSTRY / PARTNER COLLABORATION
// ========================================

// Invite an industry partner into a role (lead university only)

router.post("/:id/collaborators", inviteCollaborator);

// Request to join a project (partner-initiated, lead responds)

router.post("/:id/requests", requestCollaboration);

// Accept or decline an invitation (invited partner only)

router.patch("/:id/collaborators/:collaboratorId", respondToInvite);

// Withdraw an invitation or remove a collaborator (lead only)

router.delete("/:id/collaborators/:collaboratorId", withdrawCollaborator);

// Log a contribution (accepted collaborators only)

router.post(
  "/:id/collaborators/:collaboratorId/contributions",
  addContribution,
);

// Collaboration Discussion / Messages (Lead university & invited/accepted collaborators)

router.post("/:id/messages", postProjectMessage);

router.get("/:id/messages", getProjectMessages);

module.exports = router;

const express = require("express");

const {
  createProject,
  getMyProjects,
  updateProjectStatus,
  toggleMilestone,
  inviteCollaborator,
  respondToInvite,
  withdrawCollaborator,
  addContribution,
} = require("../controllers/projectController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// All project routes require a partner login.

router.use(protect, authorizeRoles("partner"));

// Create a project (universities only — enforced in the controller)

router.post("/", createProject);

// List my organization's projects

router.get("/mine", getMyProjects);

// Update a project's status

router.patch("/:id/status", updateProjectStatus);

// Toggle a milestone's completion

router.patch("/:id/milestones", toggleMilestone);

// ========================================
// INDUSTRY / PARTNER COLLABORATION
// ========================================

// Invite an industry partner into a role (lead university only)

router.post("/:id/collaborators", inviteCollaborator);

// Accept or decline an invitation (invited partner only)

router.patch("/:id/collaborators/:collaboratorId", respondToInvite);

// Withdraw an invitation or remove a collaborator (lead only)

router.delete("/:id/collaborators/:collaboratorId", withdrawCollaborator);

// Log a contribution (accepted collaborators only)

router.post(
  "/:id/collaborators/:collaboratorId/contributions",
  addContribution,
);

module.exports = router;

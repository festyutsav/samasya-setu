const express = require("express");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const proposalController = require(
  "../controllers/proposalController"
);

const router = express.Router();

// ========================================
// UNIVERSITY PROPOSALS
// ========================================

router.post(
  "/",
  protect,
  authorizeRoles("partner"),
  proposalController.createProposal
);

router.get(
  "/my-proposals",
  protect,
  authorizeRoles("partner"),
  proposalController.getMyProposals
);

router.patch(
  "/:proposalId",
  protect,
  authorizeRoles("partner"),
  proposalController.updateProposal
);

router.delete(
  "/:proposalId",
  protect,
  authorizeRoles("partner"),
  proposalController.deleteProposal
);

// ========================================
// ADMIN PROPOSAL REVIEW
// ========================================

router.get(
  "/problem/:problemId",
  protect,
  authorizeRoles("admin"),
  proposalController.getProposalsForProblem
);

router.patch(
  "/:proposalId/review",
  protect,
  authorizeRoles("admin"),
  proposalController.reviewProposal
);

module.exports = router;

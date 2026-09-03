const express = require("express");

const adminController = require(
  "../controllers/adminController"
);

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorizeRoles("admin"),
  adminController.getDashboardStats
);

router.get(
  "/analytics",
  protect,
  authorizeRoles("admin"),
  adminController.getAnalytics
);

router.put(
  "/problems/:problemId/status",
  protect,
  authorizeRoles("admin"),
  adminController.updateProblemStatus
);

router.get(
  "/partners/credentials",
  protect,
  authorizeRoles("admin"),
  adminController.downloadPartnerCredentials
);

router.delete(
  "/problems/:problemId",
  protect,
  authorizeRoles("admin"),
  adminController.deleteProblemByAdmin
);

module.exports = router;
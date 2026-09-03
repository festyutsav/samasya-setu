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

module.exports = router;
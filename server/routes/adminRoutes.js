const express = require("express");

const adminController = require(
  "../controllers/adminController"
);

const router = express.Router();

console.log("ADMIN CONTROLLER:", adminController);

router.get(
  "/dashboard",
  adminController.getDashboardStats
);

router.put(
  "/problems/:problemId/status",
  adminController.updateProblemStatus
);

module.exports = router;
const upload = require("../middleware/uploadMiddleware");
const express = require("express");

const {

  // Citizen controllers

  createProblem,

  getMyProblems,

  deleteMyProblem,


  // General controllers

  getAllProblems,

  getProblemById,


  // Admin controllers

  updateProblemStatus,

  assignPartnerToProblem,


  // Partner controllers

  getPartnerDashboard,

  getPartnerProblems,

  updatePartnerProblemStatus,

} = require("../controllers/problemController");


const {

  protect,

  authorizeRoles,

} = require("../middleware/authMiddleware");


const router = express.Router();


// ========================================
// CITIZEN ROUTES
// ========================================


// Citizen submits a problem

router.post(
  "/",
  protect,
  authorizeRoles("citizen"),
  upload.array("images", 3),
  createProblem
);


// Get problems submitted by logged-in citizen

router.get(

  "/my/problems",

  protect,

  authorizeRoles("citizen"),

  getMyProblems

);


// Delete own problem
// Only allowed while status is "submitted"

router.delete(

  "/my/:id",

  protect,

  authorizeRoles("citizen"),

  deleteMyProblem

);


// ========================================
// PARTNER ROUTES
// ========================================


// Get partner dashboard

router.get(

  "/partner/dashboard",

  protect,

  authorizeRoles("partner"),

  getPartnerDashboard

);


// Get all problems assigned to logged-in partner

router.get(

  "/partner/problems",

  protect,

  authorizeRoles("partner"),

  getPartnerProblems

);


// Partner updates the status of
// their assigned problem

router.patch(

  "/partner/problems/:id/status",

  protect,

  authorizeRoles("partner"),

  updatePartnerProblemStatus

);


// ========================================
// GENERAL PROBLEM ROUTES
// ========================================


// Get all problems
// Accessible to Citizen, Admin, and Partner

router.get(

  "/",

  protect,

  authorizeRoles(

    "citizen",

    "admin",

    "partner"

  ),

  getAllProblems

);


// ========================================
// ADMIN ROUTES
// ========================================


// Admin updates problem status

router.patch(

  "/:id/status",

  protect,

  authorizeRoles("admin"),

  updateProblemStatus

);


// Admin assigns a partner to a problem

router.patch(

  "/:id/assign-partner",

  protect,

  authorizeRoles("admin"),

  assignPartnerToProblem

);


// ========================================
// GET SINGLE PROBLEM
// ========================================


// IMPORTANT:
// Keep this route at the bottom.
// Otherwise ":id" could capture routes
// such as "/partner/dashboard".

router.get(

  "/:id",

  protect,

  getProblemById

);


module.exports = router;
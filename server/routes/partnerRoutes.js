const express = require("express");

const {
  createPartner,
  getAllPartners,
  getPartnerById,
  deletePartner,
  getPartnerDirectory,
} = require("../controllers/partnerController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// ADMIN PARTNER MANAGEMENT
// ========================================


// Create a partner organization
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createPartner
);


// Get all partner organizations
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllPartners
);


// ========================================
// PARTNER DIRECTORY
// ========================================
// Must be declared before "/:id" so "directory" is not
// treated as an id. Universities use this to pick partners
// when inviting collaborators onto a project.

router.get(
  "/directory",
  protect,
  authorizeRoles("partner"),
  getPartnerDirectory
);


// Get a single partner organization
router.get(
  "/:id",
  protect,
  authorizeRoles("admin"),
  getPartnerById
);


// Delete a partner organization
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deletePartner
);


module.exports = router;
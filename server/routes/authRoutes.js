const express = require("express");

const {
  registerUser,
  loginUser,
  getProfile,
} = require("../controllers/authController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();


// Register user
router.post("/register", registerUser);


// Login user
router.post("/login", loginUser);


// Protected route
router.get("/profile", protect, getProfile);


// Temporary admin-only route for testing role authorization



module.exports = router;
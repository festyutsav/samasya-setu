const express = require("express");
const crypto = require("crypto");

const sendOtpEmail = require("../utils/sendOtp");

const router = express.Router();

// Temporary OTP storage
const otpStore = new Map();

// ===============================
// SEND OTP
// ===============================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // Generate 6-digit OTP
    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // Store OTP for 10 minutes
    otpStore.set(email.toLowerCase(), {
      otp: otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Send OTP through Gmail
    await sendOtpEmail(email, otp);

    return res.status(200).json({
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error("OTP sending error:", error);

    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});


// ===============================
// VERIFY OTP
// ===============================
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      message: "Email and OTP are required",
    });
  }

  const key = email.toLowerCase();

  const stored = otpStore.get(key);

  // OTP not found
  if (!stored) {
    return res.status(400).json({
      message: "OTP not found. Please request a new OTP.",
    });
  }

  // OTP expired
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);

    return res.status(400).json({
      message: "OTP has expired. Please request a new OTP.",
    });
  }

  // Wrong OTP
  if (stored.otp !== otp) {
    return res.status(400).json({
      message: "Invalid OTP.",
    });
  }

  // OTP correct
  otpStore.delete(key);

  return res.status(200).json({
    verified: true,
    message: "Email verified successfully",
  });
});


module.exports = router;
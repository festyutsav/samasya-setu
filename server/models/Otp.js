const mongoose = require("mongoose");

// ========================================
// OTP MODEL FOR REGISTRATION & AUTH
// ========================================
// Stores 6-digit numeric OTPs with automatic TTL expiration (10 minutes)
// and brute-force attempt limits.

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otp: {
      type: String,
      required: true,
      trim: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete expired OTP documents after 10 minutes (600 seconds)
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;

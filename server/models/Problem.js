const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    // ========================================
    // BASIC PROBLEM INFORMATION
    // ========================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================
    // LOCATION
    // ========================================

    location: {
      type: String,
      required: true,
      trim: true,
    },

    locationDetails: {
      district: {
        type: String,
        trim: true,
        default: "",
      },

      state: {
        type: String,
        trim: true,
        default: "Jharkhand",
      },

      pincode: {
        type: String,
        trim: true,
        default: "",
      },

      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
    },

    // ========================================
    // IMAGE INFORMATION
    // ========================================

    images: [
      {
        url: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
          required: true,
        },
      },
    ],

    // ========================================
    // IMPACT INFORMATION
    // ========================================

    affectedPeople: {
      type: Number,
      default: 0,
      min: 0,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    // ========================================
    // AI CLASSIFICATION
    // ========================================

    aiCategory: {
      type: String,
      default: null,
    },

    aiKeywords: {
      type: [String],
      default: [],
    },

    aiConfidence: {
      type: Number,
      default: null,
    },

    aiMargin: {
      type: Number,
      default: null,
    },

    // ========================================
    // DUPLICATE DETECTION
    // ========================================

    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      default: null,
    },

    duplicateScore: {
      type: Number,
      default: null,
    },

    // ========================================
    // USER
    // ========================================

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ========================================
    // PARTNER ASSIGNMENT
    // ========================================

    assignedPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      default: null,
    },

    // ========================================
    // STATUS
    // ========================================

    status: {
      type: String,

      enum: ["submitted", "under_review", "assigned", "in_progress", "solved"],

      default: "submitted",
    },
  },

  {
    timestamps: true,
  },
);

const Problem = mongoose.model("Problem", problemSchema);

module.exports = Problem;

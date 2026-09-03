const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    // ========================================
    // RELATIONSHIPS
    // ========================================

    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },

    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ========================================
    // PROPOSAL DETAILS
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

    approach: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================
    // TEAM
    // ========================================

    team: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        role: {
          type: String,
          required: true,
          trim: true,
        },

        email: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
      },
    ],

    // ========================================
    // TIMELINE
    // ========================================

    timeline: {
      startDate: {
        type: Date,
        required: true,
      },

      endDate: {
        type: Date,
        required: true,
      },

      milestones: [
        {
          title: {
            type: String,
            required: true,
            trim: true,
          },

          description: {
            type: String,
            trim: true,
          },

          dueDate: {
            type: Date,
            required: true,
          },

          status: {
            type: String,
            enum: ["pending", "in_progress", "completed", "delayed"],
            default: "pending",
          },
        },
      ],
    },

    // ========================================
    // DOCUMENTS
    // ========================================

    documents: [
      {
        url: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
          required: true,
        },

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ========================================
    // STATUS
    // ========================================

    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "approved", "rejected"],
      default: "draft",
    },

    reviewNotes: {
      type: String,
      trim: true,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

proposalSchema.index({ problem: 1, university: 1 }, { unique: true });
proposalSchema.index({ status: 1 });
proposalSchema.index({ university: 1, status: 1 });

const SolutionProposal = mongoose.model(
  "SolutionProposal",
  proposalSchema
);

module.exports = SolutionProposal;

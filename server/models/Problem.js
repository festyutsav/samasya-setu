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
    // VIDEO EVIDENCE
    // ========================================
    // Optional short clip of the problem, uploaded to
    // Cloudinary with resource_type "video". One video per
    // problem keeps submissions light.

    videos: [
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
    // SUPPORTING DOCUMENTS
    // ========================================
    // PDF / DOC / TXT evidence (FIR copies, survey reports,
    // government letters). Stored on Cloudinary as "raw"
    // resources; originalName keeps the citizen's filename.

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

        originalName: {
          type: String,
          default: "",
        },

        fileType: {
          type: String,
          default: "",
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
    // DUPLICATE DETECTION (LEGACY)
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
    // AI EMBEDDING
    // ========================================
    // Vector embedding generated from title + description.
    // Hidden by default (select: false) so it is never
    // returned in normal API responses. Must be explicitly
    // selected (e.g. .select("+embedding")) when needed for
    // duplicate detection similarity calculations.

    embedding: {
      type: [Number],
      default: [],
      select: false,
    },

    // ========================================
    // GEOJSON LOCATION (FOR GEOSPATIAL QUERIES)
    // ========================================
    // Coordinates MUST be stored as [longitude, latitude].
    // Existing latitude/longitude fields inside
    // locationDetails are kept as-is for backward
    // compatibility with the current application.

    locationPoint: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    // ========================================
    // DUPLICATE / RECURRING RELATIONSHIP
    // ========================================
    // These fields are only ever updated by an Admin
    // via the Admin Review API. The AI system only
    // provides suggestions and must never write to
    // these fields directly.

    isDuplicate: {
      type: Boolean,
      default: false,
    },

    isRecurring: {
      type: Boolean,
      default: false,
    },

    parentProblem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      default: null,
    },

    // ========================================
    // AI DUPLICATE SUGGESTIONS
    // ========================================
    // Snapshot of the candidate matches the AI found for
    // this problem, so the Admin review UI can read them
    // later instead of only seeing them in the submission
    // response. Stored as references plus scores: the
    // candidate's title and status change over time, and a
    // reference keeps them current when populated.
    //
    // These are suggestions only. Confirming one is what
    // sets isDuplicate / isRecurring / parentProblem above.

    aiDuplicateCandidates: [
      {
        problem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Problem",
        },

        matchScore: {
          type: Number,
          default: 0,
        },

        semanticScore: {
          type: Number,
          default: 0,
        },

        geoScore: {
          type: Number,
          default: 0,
        },

        categoryScore: {
          type: Number,
          default: 0,
        },

        distanceKm: {
          type: Number,
          default: 0,
        },

        matchType: {
          type: String,
          enum: ["Duplicate", "Recurring"],
          default: "Duplicate",
        },
      },
    ],

    // When duplicate detection last ran for this problem.
    // null means it has never been analysed (e.g. rows created
    // before this feature shipped).

    aiDuplicateAnalyzedAt: {
      type: Date,
      default: null,
    },

    // ========================================
    // AI ROUTING SUGGESTIONS
    // ========================================
    // Top partner organizations the routing engine matched to
    // this problem at submission time. Suggestions only — the
    // Admin's assignment decision lives in assignedPartner.

    aiRoutingCandidates: [
      {
        partner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Partner",
        },

        matchScore: {
          type: Number,
          default: 0,
        },

        expertiseScore: {
          type: Number,
          default: 0,
        },

        geoScore: {
          type: Number,
          default: 0,
        },

        categoryMatched: {
          type: Boolean,
          default: false,
        },

        reason: {
          type: String,
          default: "",
        },
      },
    ],

    aiRoutingAnalyzedAt: {
      type: Date,
      default: null,
    },

    // ========================================
    // DUPLICATE CLUSTER
    // ========================================
    // How many nearby problems cleared the duplicate
    // threshold when this problem was last analysed —
    // i.e. how many citizens reported essentially the
    // same issue in the same area. Feeds the priority
    // score (recurring issues escalate) and shows the
    // Admin how widespread an issue is.

    clusterSize: {
      type: Number,
      default: 0,
    },

    // ========================================
    // AI PRIORITY
    // ========================================
    // Composite 0-100 score produced by
    // services/aiPriorityService.js from severity,
    // affected people, cluster size and review age.
    // Suggestions only — Admins decide review order.

    aiPriorityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    aiPriorityBand: {
      type: String,
      enum: ["standard", "elevated", "urgent"],
      default: "standard",
    },

    aiPriorityBreakdown: {
      type: String,
      default: "",
    },

    aiPriorityAnalyzedAt: {
      type: Date,
      default: null,
    },

    // ========================================
    // AI SUMMARY
    // ========================================
    // Short extractive summary generated at submission
    // so admins can triage without reading full
    // descriptions.

    aiSummary: {
      type: String,
      default: "",
    },

    aiSummaryGeneratedAt: {
      type: Date,
      default: null,
    },

    // ========================================
    // AI REVIEW STATUS
    // ========================================
    // Tracks whether the Admin has reviewed the AI's
    // duplicate/recurring suggestion for this problem.

    aiReviewStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed_duplicate",
        "confirmed_separate",
        "marked_recurring",
      ],
      default: "pending",
    },

    // ========================================
    // USER & SUBMITTER TYPE
    // ========================================

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    submitterType: {
      type: String,
      enum: [
        "individual",
        "community_group",
        "panchayati_raj",
        "urban_local_body",
        "government_agency",
      ],
      default: "individual",
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

    // ========================================
    // RESOLUTION & COMPLETION WORKFLOW
    // ========================================
    resolutionSubmitted: {
      type: Boolean,
      default: false,
    },

    resolutionDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    resolutionApprovedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  },
);

// ========================================
// INDEXES
// ========================================
// 2dsphere index enables efficient geospatial queries
// (e.g. $nearSphere) against the locationPoint field
// for geo-first duplicate candidate search.

problemSchema.index({ locationPoint: "2dsphere" });

const Problem = mongoose.model("Problem", problemSchema);

module.exports = Problem;

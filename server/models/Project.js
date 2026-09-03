const mongoose = require("mongoose");

// ========================================
// PROJECT MODEL
// ========================================
// A university's response to an assigned problem: professors
// and students forming a team to study, prototype and deploy
// a solution. One problem can have one project per partner —
// enforced by a compound unique index below.

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Professors lead; students execute.

    role: {
      type: String,
      enum: ["professor", "student"],
      required: true,
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    // ========================================
    // BASIC INFORMATION
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

    // ========================================
    // LINKED ENTITIES
    // ========================================

    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },

    // The lead organization (university). Accountable for the
    // project and the only party that can invite collaborators.

    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
    },

    // ========================================
    // INDUSTRY / PARTNER COLLABORATION
    // ========================================
    // University-led hub-and-spoke model: the university owns
    // the project and invites industry partners, startups and
    // CSR organizations into defined roles. Each collaborator
    // manages its own contributions; the lead can withdraw.

    collaborators: [
      {
        partner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Partner",
          required: true,
        },

        // What the collaborator brings to the project.

        role: {
          type: String,
          enum: ["mentor", "funder", "co-developer", "adopter"],
          required: true,
        },

        // Invite lifecycle: the lead can invite a partner
        // ("invited") or a partner can ask to join ("requested").
        // The receiving side accepts or declines; the lead can
        // withdraw an invitation or remove an active collaborator.

        status: {
          type: String,
          enum: [
            "invited",
            "requested",
            "accepted",
            "declined",
            "withdrawn",
          ],
          default: "invited",
        },

        // Note attached when a partner requests to join.

        message: {
          type: String,
          trim: true,
          default: "",
          maxlength: 500,
        },

        contributions: [
          {
            title: {
              type: String,
              required: true,
              trim: true,
            },

            detail: {
              type: String,
              trim: true,
              default: "",
            },

            date: {
              type: Date,
              default: Date.now,
            },
          },
        ],

        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        respondedAt: {
          type: Date,
          default: null,
        },
      },
    ],

    // ========================================
    // TEAM
    // ========================================

    team: {
      type: [teamMemberSchema],
      default: [],
    },

    // ========================================
    // LIFECYCLE
    // ========================================

    status: {
      type: String,
      enum: ["planning", "active", "completed"],
      default: "planning",
    },

    milestones: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },

        completed: {
          type: Boolean,
          default: false,
        },

        // Target date; surfaced as "overdue" on the workspace
        // and the government dashboard when past and incomplete.

        dueDate: {
          type: Date,
          default: null,
        },
      },
    ],

    // ========================================
    // INNOVATION OUTCOMES
    // ========================================
    // Measurable results of the project, updated by the lead
    // university and monitored on the government analytics
    // dashboard (PS: "innovation outcomes, patents, startups
    // created, and community impact").

    outcomes: {
      patents: {
        type: Number,
        default: 0,
        min: 0,
      },

      startups: {
        type: Number,
        default: 0,
        min: 0,
      },

      publications: {
        type: Number,
        default: 0,
        min: 0,
      },

      deployments: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // ========================================
    // AUDIT
    // ========================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// One project per partner per problem.

projectSchema.index({ problem: 1, partner: 1 }, { unique: true });

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;

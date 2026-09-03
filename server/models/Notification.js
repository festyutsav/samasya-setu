const mongoose = require("mongoose");

// ========================================
// NOTIFICATION MODEL
// ========================================
// One row per (recipient, event). Created by
// services/notificationService.js whenever a meaningful
// workflow event happens (assignment, status change,
// proposal review, project update, new submission).
//
// Design notes:
//  - `recipient` is always a User. Partner orgs are reached
//    through the user linked on Partner.user.
//  - `problem` is optional so future non-problem events
//    (announcements, system messages) fit the same model.
//  - `type` lets the UI pick an icon and a deep-link target.

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "problem_submitted",
        "problem_assigned",
        "problem_status",
        "proposal_submitted",
        "proposal_reviewed",
        "project_created",
        "project_updated",
        "collaboration_invited",
        "collaboration_requested",
        "collaboration_responded",
        "collaboration_request_responded",
        "collaboration_contribution",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  },
);

// Common query shapes: "my latest notifications" and
// "my unread count".

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

const Notification = mongoose.model(
  "Notification",
  notificationSchema,
);

module.exports = Notification;

const Notification = require("../models/Notification");
const User = require("../models/User");

// ========================================
// NOTIFICATION SERVICE
// ========================================
// Fire-and-forget notification creation. Callers (problem,
// proposal and project controllers) invoke these helpers
// AFTER their main work succeeds. Nothing in here is ever
// allowed to break the primary API flow — failures are
// logged and swallowed.

const createNotification = async ({
  recipientId,
  type,
  title,
  message = "",
  problemId = null,
}) => {
  try {
    if (!recipientId || !type || !title) {
      return;
    }

    await Notification.create({
      recipient: recipientId,

      type,

      title,

      message,

      problem: problemId,
    });
  } catch (error) {
    console.error(
      "Failed to create notification:",
      error.message
    );
  }
};

// Notify every admin. Used for events the government portal
// must react to (new submissions, partner updates, projects).

const notifyAdmins = async ({
  type,
  title,
  message = "",
  problemId = null,
}) => {
  try {
    const admins = await User.find({ role: "admin" }).select("_id");

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          recipientId: admin._id,

          type,

          title,

          message,

          problemId,
        })
      )
    );
  } catch (error) {
    console.error(
      "Failed to notify admins:",
      error.message
    );
  }
};

// Notify the login account linked to a partner organization.
// Some partners may not have a linked user yet — skip quietly.

const notifyPartnerUser = async ({
  partnerId,
  type,
  title,
  message = "",
  problemId = null,
}) => {
  try {
    if (!partnerId) {
      return;
    }

    const partnerUser = await User.findOne({
      partner: partnerId,
    }).select("_id");

    if (!partnerUser) {
      return;
    }

    await createNotification({
      recipientId: partnerUser._id,

      type,

      title,

      message,

      problemId,
    });
  } catch (error) {
    console.error(
      "Failed to notify partner user:",
      error.message
    );
  }
};

module.exports = {
  createNotification,
  notifyAdmins,
  notifyPartnerUser,
};

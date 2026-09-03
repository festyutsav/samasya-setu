const Notification = require("../models/Notification");

// ========================================
// GET MY NOTIFICATIONS
// ========================================
// Newest first, capped at 20 so the dropdown stays light.
// Populates the problem title for deep-link labels.

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("problem", "title status")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      count: notifications.length,

      notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error while fetching notifications.",
    });
  }
};

// ========================================
// GET UNREAD COUNT
// ========================================
// Polled by the bell icon every 30 seconds.

const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,

      read: false,
    });

    return res.status(200).json({
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Get unread count error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error while fetching unread count.",
    });
  }
};

// ========================================
// MARK ONE AS READ
// ========================================
// Owner-only: a user can never mark someone else's
// notification as read.

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,

      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    if (!notification.read) {
      notification.read = true;

      await notification.save();
    }

    return res.status(200).json({
      message: "Notification marked as read.",

      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error while updating notification.",
    });
  }
};

// ========================================
// MARK ALL AS READ
// ========================================

const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,

        read: false,
      },

      {
        read: true,
      },
    );

    return res.status(200).json({
      message: "All notifications marked as read.",

      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error while updating notifications.",
    });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

const express = require("express");

const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All notification routes require a login. Every role
// (citizen, partner, admin) can receive notifications.

router.use(protect);

// My latest notifications

router.get("/", getMyNotifications);

// Unread count (polled by the bell icon)

router.get("/unread-count", getUnreadCount);

// Mark one as read (owner-only)

router.patch("/:id/read", markAsRead);

// Mark all as read

router.patch("/read-all", markAllAsRead);

module.exports = router;

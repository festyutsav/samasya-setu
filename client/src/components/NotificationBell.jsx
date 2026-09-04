import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../services/notificationService";

// ========================================
// NOTIFICATION BELL
// ========================================
// Shared across all three portals. Renders a bell with an
// unread badge; the dropdown lists the latest notifications
// with relative timestamps and deep-links to the related
// problem using the app's existing hash routing.
//
// Polling (30s) keeps the badge fresh without WebSockets.

const POLL_INTERVAL = 30000;

// Small colored dot per event group so the eye can separate
// assignments (teal), reviews (amber) and progress (green).

const typeDotColor = {
  problem_submitted: "bg-[#a25a1b]",

  problem_assigned: "bg-[#0b6b60]",

  problem_status: "bg-[#31527c]",

  proposal_submitted: "bg-[#a25a1b]",

  proposal_reviewed: "bg-[#b05c2d]",

  project_created: "bg-[#087f70]",

  project_updated: "bg-[#087f70]",

  collaboration_invited: "bg-[#31527c]",

  collaboration_responded: "bg-[#31527c]",

  collaboration_contribution: "bg-[#087f70]",
};

const relativeTime = (dateString) => {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return new Date(dateString).toLocaleDateString();
};

// Deep-link target per role, matching the hash routes
// handled in App.jsx.

const hashFor = (user, notification) => {
  if (!notification.problem) {
    return user.role === "admin"
      ? "#admin-dashboard"
      : user.role === "partner"
        ? "#partner-problems"
        : "#home";
  }

  const problemId =
    typeof notification.problem === "object"
      ? notification.problem?._id
      : notification.problem;

  if (!problemId) {
    return user.role === "admin"
      ? "#admin-dashboard"
      : user.role === "partner"
        ? "#partner-problems"
        : "#home";
  }

  if (user.role === "admin") {
    return `#admin-problem-details?id=${problemId}`;
  }

  if (user.role === "partner") {
    return "#partner-problems";
  }

  return `#problem-details?id=${problemId}`;
};

const NotificationBell = ({ user }) => {
  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);

  const token = localStorage.getItem("token");

  // ---------- Data ----------

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const data = await getMyNotifications(token);

      setNotifications(data.notifications || []);

      setUnreadCount(
        (data.notifications || []).filter((n) => !n.read).length
      );
    } catch (error) {
      console.error("Failed to fetch notifications:", error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Poll the badge while logged in. The async worker is defined
  // inside the effect so React can track (and cancel) it.

  useEffect(() => {
    let cancelled = false;

    const loadUnreadCount = async () => {
      if (!token) return;

      try {
        const data = await getUnreadCount(token);

        if (!cancelled) {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error(
          "Failed to fetch unread count:",
          error.message
        );
      }
    };

    loadUnreadCount();

    const interval = setInterval(loadUnreadCount, POLL_INTERVAL);

    return () => {
      cancelled = true;

      clearInterval(interval);
    };
  }, [token]);

  // Close on outside click / Escape.

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);

      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // ---------- Actions ----------

  const toggleOpen = () => {
    const next = !open;

    setOpen(next);

    if (next) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    setOpen(false);

    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, read: true } : n
        )
      );

      setUnreadCount((count) => Math.max(count - 1, 0));

      try {
        await markAsRead(notification._id, token);
      } catch (error) {
        console.error("Failed to mark as read:", error.message);
      }
    }

    const target = hashFor(user, notification);

    if (window.location.hash !== target) {
      // Hash assignment is the app's navigation mechanism
      // (App.jsx listens for "hashchange"); it must happen in
      // this event handler, not in an effect.

      // eslint-disable-next-line react-hooks/immutability
      window.location.hash = target;
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );

    setUnreadCount(0);

    try {
      await markAllAsRead(token);
    } catch (error) {
      console.error("Failed to mark all as read:", error.message);
    }
  };

  // ---------- Render ----------

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell button */}

      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className={`relative flex h-10 w-10 items-center justify-center rounded-lg border transition ${
          open
            ? "border-[#b9d3c9] bg-[#eef4f1] text-[#0b6b60]"
            : "border-[#e3e9e3] text-[#315d56] hover:bg-[#f7f8f5] hover:text-[#173d3a]"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            d="M12 3a6 6 0 0 0-6 6v3.2l-1.4 2.8a.7.7 0 0 0 .63 1H18.77a.7.7 0 0 0 .63-1L18 12.2V9a6 6 0 0 0-6-6Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M9.8 19a2.3 2.3 0 0 0 4.4 0"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a25a1b] px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}

      {open && (
        <div className="ss-enter absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[#e3e9e3] bg-white shadow-2xl shadow-[#173d3a]/10 sm:w-96">
          {/* Header */}

          <div className="flex items-center justify-between border-b border-[#e3e9e3] bg-[#f7f8f5] px-4 py-3">
            <p className="text-sm font-bold text-[#173d3a]">
              Notifications
            </p>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-[#0b6b60] transition hover:text-[#087f70]"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-[#71827c]">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-2xl">🔔</p>

                <p className="mt-2 text-sm font-medium text-[#5c6f69]">
                  No notifications yet
                </p>

                <p className="mt-1 text-xs text-[#8a9791]">
                  Updates about problems, proposals and projects will
                  appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full items-start gap-3 border-b border-[#f0f3ef] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#f2f7f5] ${
                    notification.read ? "bg-white" : "bg-[#eef4f1]"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      typeDotColor[notification.type] || "bg-[#8a9791]"
                    } ${notification.read ? "opacity-30" : ""}`}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-sm ${
                          notification.read
                            ? "font-medium text-[#315d56]"
                            : "font-bold text-[#173d3a]"
                        }`}
                      >
                        {notification.title}
                      </span>

                      <span className="shrink-0 text-[10px] text-[#8a9791]">
                        {relativeTime(notification.createdAt)}
                      </span>
                    </span>

                    {notification.message && (
                      <span className="mt-0.5 block text-xs leading-5 text-[#5c6f69]">
                        {notification.message}
                      </span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

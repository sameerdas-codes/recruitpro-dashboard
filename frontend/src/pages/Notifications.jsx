
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import {
  FaBell,
  FaCheckCircle,
  FaBriefcase,
  FaCalendarAlt,
  FaClipboardCheck,
  FaInfoCircle,
  FaCheck,
  FaArrowLeft,
} from "react-icons/fa";

import useNotifications from "../hooks/useNotifications";
import api from "../services/api";
import "../styles/Notifications.css";

function Notifications() {
  const navigate = useNavigate();

  const {
    notifications,
    refreshNotifications,
    loading,
    error,
  } = useNotifications();

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read/`);

      await refreshNotifications();

      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Could not update notification");
    }
  };

  const getNotificationIcon = (message = "") => {
    const text = message.toLowerCase();

    if (text.includes("interview")) {
      return <FaCalendarAlt />;
    }

    if (text.includes("application")) {
      return <FaClipboardCheck />;
    }

    if (text.includes("job")) {
      return <FaBriefcase />;
    }

    if (text.includes("welcome")) {
      return <FaCheckCircle />;
    }

    return <FaBell />;
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="notifications-page">
      <div className="notifications-container">

        {/* Page Header */}
        <header className="notifications-header">

          <div className="notifications-heading">

            {/* Back Button */}
            <button
              type="button"
              className="notification-back-button"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft />
              <span>Back</span>
            </button>

            <span className="notifications-label">
              RECRUITPRO UPDATES
            </span>

            <h1>Notifications</h1>

            <p>Stay updated with your latest activity.</p>
          </div>

          <div className="header-bell">
            <FaBell />

            {unreadCount > 0 && (
              <span className="bell-dot" />
            )}
          </div>

        </header>

        {/* Summary Cards */}
        <section className="notification-stats">

          <div className="notification-stat-card">
            <div className="stat-icon total-icon">
              <FaBell />
            </div>

            <div>
              <span>Total Notifications</span>
              <h2>{notifications.length}</h2>
            </div>
          </div>

          <div className="notification-stat-card">
            <div className="stat-icon unread-icon">
              <FaInfoCircle />
            </div>

            <div>
              <span>Unread Notifications</span>
              <h2>{unreadCount}</h2>
            </div>
          </div>

          <div className="notification-stat-card">
            <div className="stat-icon read-icon">
              <FaCheckCircle />
            </div>

            <div>
              <span>Read Notifications</span>
              <h2>{notifications.length - unreadCount}</h2>
            </div>
          </div>

        </section>

        {/* Notification List */}
        <section className="notification-list-section">

          <div className="notification-section-header">

            <div>
              <h2>Recent Activity</h2>
              <p>Your latest notifications and updates</p>
            </div>

            <span className="notification-count">
              {unreadCount} Unread
            </span>

          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="notification-error">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="notification-empty">
              <div className="notification-loader" />
              <p>Loading notifications...</p>
            </div>

          ) : notifications.length === 0 && !error ? (

            /* Empty State */
            <div className="notification-empty">

              <div className="empty-bell">
                <FaBell />
              </div>

              <h3>No notifications yet</h3>

              <p>
                When you receive updates about your applications,
                they will appear here.
              </p>

            </div>

          ) : !error ? (

            /* Notifications */
            <div className="notification-list">

              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`notification-card ${
                    !notification.is_read ? "unread" : "read"
                  }`}
                >

                  <div className="notification-icon">
                    {getNotificationIcon(notification.message)}
                  </div>

                  <div className="notification-content">

                    <div className="notification-title-row">

                      <h3>
                        {notification.message}
                      </h3>

                      {!notification.is_read && (
                        <span className="unread-badge">
                          Unread
                        </span>
                      )}

                    </div>

                    <time>
                      {formatDate(notification.created_at)}
                    </time>

                  </div>

                  <div className="notification-action">

                    {!notification.is_read ? (

                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <FaCheck />
                        <span>Mark as read</span>
                      </button>

                    ) : (

                      <span className="read-status">
                        <FaCheckCircle />
                        Read
                      </span>

                    )}

                  </div>

                </article>
              ))}

            </div>

          ) : null}

        </section>

        {/* Footer */}
        {!loading && notifications.length > 0 && (
          <div className="notification-footer">
            <FaCheckCircle />
            <span>
              You're all caught up with your notifications.
            </span>
          </div>
        )}

      </div>
    </main>
  );
}

export default Notifications;

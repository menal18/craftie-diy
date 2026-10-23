import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getMyNotifications,
  markAllMyNotificationsAsRead,
  markMyNotificationAsRead,
} from "../services/notificationService";

import "./Notifications.css";

const formatNotificationDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyNotificationId, setBusyNotificationId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadNotifications = useCallback(async (isRefresh = false) => {
    const requestId = ++requestIdRef.current;

    try {
      if (mountedRef.current) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError("");
      }

      const response = await getMyNotifications();
      if (!Array.isArray(response?.notifications)) {
        throw new Error("The server returned an unexpected notifications response.");
      }
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setNotifications(response.notifications);
      setUnreadCount(Number(response.unread_count) || 0);
    } catch (loadError) {
      console.error("Failed to load notifications:", loadError);
      if (mountedRef.current && requestId === requestIdRef.current) {
        if (loadError.response?.status === 401) {
          navigate("/login");
          return;
        }
        setError(
          loadError.response?.data?.message ||
            loadError.message ||
            "Unable to load notifications. Please try again.",
        );
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [navigate]);

  useEffect(() => {
    mountedRef.current = true;
    if (!localStorage.getItem("token")) {
      navigate("/login");
    } else {
      void Promise.resolve().then(() => loadNotifications());
    }

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadNotifications, navigate]);

  const handleMarkAsRead = async (notificationId) => {
    if (busyNotificationId !== null || markingAll) return;

    try {
      setBusyNotificationId(notificationId);
      setError("");
      setFeedback("");
      const response = await markMyNotificationAsRead(notificationId);
      const updatedNotification = response?.notification;

      if (
        !updatedNotification ||
        String(updatedNotification.id) !== String(notificationId)
      ) {
        throw new Error("The server returned an unexpected notification response.");
      }

      if (!mountedRef.current) return;
      setNotifications((current) =>
        current.map((notification) =>
          String(notification.id) === String(notificationId)
            ? updatedNotification
            : notification,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      setFeedback("Notification marked as read.");
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (markError) {
      console.error("Failed to mark notification as read:", markError);
      if (mountedRef.current) {
        setError(
          markError.response?.data?.message ||
            markError.message ||
            "Unable to update this notification.",
        );
      }
    } finally {
      if (mountedRef.current) setBusyNotificationId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll || busyNotificationId !== null) return;

    try {
      setMarkingAll(true);
      setError("");
      setFeedback("");
      await markAllMyNotificationsAsRead();
      if (!mountedRef.current) return;

      setNotifications((current) =>
        current.map((notification) => ({ ...notification, is_read: true })),
      );
      setUnreadCount(0);
      setFeedback("All notifications marked as read.");
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (markAllError) {
      console.error("Failed to mark all notifications as read:", markAllError);
      if (mountedRef.current) {
        setError(
          markAllError.response?.data?.message ||
            "Unable to mark all notifications as read.",
        );
      }
    } finally {
      if (mountedRef.current) setMarkingAll(false);
    }
  };

  return (
    <main className="customer-notifications-page">
      <section className="customer-notifications-container">
        <header className="customer-notifications-header">
          <div>
            <p className="customer-notifications-eyebrow">YOUR CRAFTIEDIY UPDATES</p>
            <h1>Notifications</h1>
            <p>Order updates and messages about your custom creations.</p>
          </div>
          <div className="customer-notifications-count">
            <Bell size={19} aria-hidden="true" />
            <span>{unreadCount} unread</span>
          </div>
        </header>

        <div className="customer-notifications-toolbar">
          <span>
            {notifications.length}{" "}
            {notifications.length === 1 ? "notification" : "notifications"}
          </span>
          <div>
            <button
              type="button"
              className="customer-notifications-action"
              onClick={() => void loadNotifications(true)}
              disabled={refreshing || loading}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "customer-notifications-spin" : ""}
              />
              Refresh
            </button>
            <button
              type="button"
              className="customer-notifications-action"
              onClick={() => void handleMarkAllAsRead()}
              disabled={unreadCount === 0 || markingAll || busyNotificationId !== null}
            >
              <CheckCheck size={16} />
              {markingAll ? "Updating..." : "Mark All as Read"}
            </button>
          </div>
        </div>

        {error && (
          <div className="customer-notifications-alert error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void loadNotifications(true)}>
              Try Again
            </button>
          </div>
        )}
        {feedback && !error && (
          <p className="customer-notifications-feedback" role="status">
            {feedback}
          </p>
        )}

        {loading ? (
          <div className="customer-notifications-state" role="status">
            <span className="customer-notifications-spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="customer-notifications-empty">
            <span className="customer-notifications-empty-icon">
              <Bell size={25} />
            </span>
            <h2>You're all caught up</h2>
            <p>New order updates and messages will appear here.</p>
          </div>
        ) : (
          <div className="customer-notifications-list">
            {notifications.map((notification) => (
              <article
                className={`customer-notification${
                  notification.is_read ? "" : " is-unread"
                }`}
                key={notification.id}
              >
                <span
                  className="customer-notification-indicator"
                  aria-label={notification.is_read ? "Read" : "Unread"}
                />
                <div className="customer-notification-content">
                  <div className="customer-notification-title-row">
                    <h2>{notification.title}</h2>
                    {!notification.is_read && (
                      <span className="customer-notification-unread-label">
                        New
                      </span>
                    )}
                  </div>
                  <p>{notification.message}</p>
                  <time dateTime={notification.created_at || undefined}>
                    {formatNotificationDate(notification.created_at)}
                  </time>
                </div>
                {!notification.is_read && (
                  <button
                    type="button"
                    className="customer-notification-read-button"
                    onClick={() => void handleMarkAsRead(notification.id)}
                    disabled={
                      busyNotificationId !== null ||
                      markingAll
                    }
                  >
                    {String(busyNotificationId) === String(notification.id)
                      ? "Saving..."
                      : "Mark as read"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Notifications;

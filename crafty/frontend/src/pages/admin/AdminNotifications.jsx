import { useEffect, useRef, useState } from "react";
import { Bell, Send, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  createAdminNotification,
  broadcastAdminNotification,
  getAdminUsers,
} from "../../services/adminService";

import "./AdminNotifications.css";

const AdminNotifications = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);

  const [recipientType, setRecipientType] =
    useState("single");

  const [userId, setUserId] = useState("");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [notificationType, setNotificationType] =
    useState("general");

  const [referenceId, setReferenceId] = useState("");

  const [loadingUsers, setLoadingUsers] =
    useState(true);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const requestKey = useRef(null);
  const requestFingerprint = useRef(null);

  // =========================================================
  // LOAD USERS
  // =========================================================

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        setError("");

        const response = await getAdminUsers();

        setUsers(response.users || []);
      } catch (err) {
        console.error(
          "Notification users loading error:",
          err
        );

        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Failed to load users"
        );
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [navigate]);

  // =========================================================
  // SEND NOTIFICATION
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setEmailWarning("");

    if (!title.trim()) {
      setError("Notification title is required");
      return;
    }

    if (!message.trim()) {
      setError("Notification message is required");
      return;
    }

    if (
      recipientType === "single" &&
      !userId
    ) {
      setError("Please select a user");
      return;
    }

    try {
      setSending(true);

      const notificationData = {
        title: title.trim(),
        message: message.trim(),
        notification_type: notificationType,
      };

      if (referenceId.trim()) {
        notificationData.reference_id =
          Number(referenceId);
      }

      const fingerprint = JSON.stringify({
        recipientType,
        userId: recipientType === "single" ? userId : null,
        notificationData,
      });
      if (
        !requestKey.current ||
        requestFingerprint.current !== fingerprint
      ) {
        requestKey.current =
          globalThis.crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        requestFingerprint.current = fingerprint;
      }

      if (recipientType === "single") {
        notificationData.user_id = Number(userId);

        const response = await createAdminNotification(
          notificationData,
          requestKey.current
        );
        const delivery = response.email_delivery;
        if (delivery?.status === "sent") {
          setSuccess("In-app notification saved and email accepted by the mail server.");
        } else {
          setSuccess("In-app notification saved.");
          setEmailWarning(
            delivery?.error ||
              "Email delivery was not confirmed by the mail provider."
          );
        }
      } else {
        const response = await broadcastAdminNotification(
          notificationData,
          requestKey.current
        );
        const delivery = response.email_delivery;
        if (response.count === 0) {
          setSuccess("No customer accounts were available for this broadcast.");
        } else if (delivery?.failed === 0) {
          setSuccess(
            `${response.count} customer notification(s) saved and email accepted by the mail server.`
          );
        } else {
          setSuccess(
            `${response.count} customer notification(s) saved. Email accepted for ${delivery?.sent || 0}; failed for ${delivery?.failed ?? response.count}.`
          );
          setEmailWarning(
            "Some messages remain available in-app, but SMTP did not confirm every email delivery."
          );
        }
      }

      requestKey.current = null;
      requestFingerprint.current = null;
      setTitle("");
      setMessage("");
      setReferenceId("");
      setUserId("");
    } catch (err) {
      console.error(
        "Notification sending error:",
        err
      );

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
        return;
      }

      if (err.response) {
        requestKey.current = null;
        requestFingerprint.current = null;
      }
      setError(
        err.response?.data?.message ||
          "Failed to send notification"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-notifications-page">

      {/* HEADER */}

      <div className="notification-page-header">

        <div>
          <h1>Notifications</h1>

          <p>
            Send in-app notifications and email to an individual customer
            or all customer accounts.
          </p>
        </div>

        <div className="notification-header-icon">
          <Bell size={28} />
        </div>

      </div>

      {/* ALERTS */}

      {error && (
        <div className="notification-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="notification-alert success">
          {success}
        </div>
      )}
      {emailWarning && (
        <div className="notification-alert warning" role="status">
          {emailWarning}
        </div>
      )}

      {/* MAIN CARD */}

      <div className="notification-card">

        <div className="notification-card-header">

          <div className="notification-card-icon">
            <Send size={21} />
          </div>

          <div>
            <h2>Send Notification</h2>

            <p>
              Create a notification for your customers.
            </p>
          </div>

        </div>

        <form
          className="notification-form"
          onSubmit={handleSubmit}
        >

          {/* RECIPIENT */}

          <div className="notification-field full">

            <label>
              Recipient
            </label>

            <div className="recipient-options">

              <button
                type="button"
                className={
                  recipientType === "single"
                    ? "recipient-option active"
                    : "recipient-option"
                }
                onClick={() =>
                  setRecipientType("single")
                }
              >
                <Bell size={18} />

                <span>
                  Individual User
                </span>
              </button>

              <button
                type="button"
                className={
                  recipientType === "all"
                    ? "recipient-option active"
                    : "recipient-option"
                }
                onClick={() =>
                  setRecipientType("all")
                }
              >
                <Users size={18} />

                <span>
                  All Customers
                </span>
              </button>

            </div>

          </div>

          {/* USER */}

          {recipientType === "single" && (
            <div className="notification-field full">

              <label>
                Select User
              </label>

              <select
                value={userId}
                onChange={(e) =>
                  setUserId(e.target.value)
                }
                disabled={loadingUsers}
              >
                <option value="">
                  {loadingUsers
                    ? "Loading users..."
                    : "Select a user"}
                </option>

                {users.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>

            </div>
          )}

          {/* TITLE */}

          <div className="notification-field full">

            <label>
              Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Enter notification title"
              maxLength={200}
            />

          </div>

          {/* TYPE */}

          <div className="notification-field">

            <label>
              Notification Type
            </label>

            <select
              value={notificationType}
              onChange={(e) =>
                setNotificationType(
                  e.target.value
                )
              }
            >
              <option value="general">
                General
              </option>

              <option value="order">
                Order
              </option>

              <option value="payment">
                Payment
              </option>

              <option value="custom_order">
                Custom Order
              </option>

              <option value="promotion">
                Promotion
              </option>

              <option value="promo_code">
                Promo Code
              </option>

              <option value="system">
                System
              </option>
            </select>

          </div>

          {/* REFERENCE ID */}

          <div className="notification-field">

            <label>
              Reference ID
            </label>

            <input
              type="number"
              value={referenceId}
              onChange={(e) =>
                setReferenceId(
                  e.target.value
                )
              }
              placeholder="Optional"
              min="1"
            />

          </div>

          {/* MESSAGE */}

          <div className="notification-field full">

            <label>
              Message
            </label>

            <textarea
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder="Enter notification message"
              rows={7}
            />

          </div>

          {/* SUBMIT */}

          <div className="notification-submit">

            <button
              type="submit"
              disabled={sending}
            >
              <Send size={18} />

              {sending
                ? "Sending..."
                : recipientType === "all"
                ? "Send to All Customers"
                : "Send Notification"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AdminNotifications;
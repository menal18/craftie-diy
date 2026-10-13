import React, { useEffect, useMemo, useState } from "react";
import { Search, Mail, Eye, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAdminContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
} from "../../services/adminService";

import "./AdminContactMessages.css";

const AdminContactMessages = () => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedMessage, setSelectedMessage] = useState(null);

  // =========================================================
  // LOAD CONTACT MESSAGES
  // =========================================================

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminContactMessages();

      setMessages(response.messages || []);
    } catch (err) {
      console.error("Contact messages loading error:", err);

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
          "Failed to load contact messages"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        String(message.id)
          .toLowerCase()
          .includes(searchText) ||
        message.name?.toLowerCase().includes(searchText) ||
        message.email?.toLowerCase().includes(searchText) ||
        message.phone?.toLowerCase().includes(searchText) ||
        message.message?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        message.status?.toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [messages, search, statusFilter]);

  // =========================================================
  // STATUS CHANGE
  // =========================================================

  const handleStatusChange = async (messageId, status) => {
    try {
      setError("");
      setSuccess("");

      const response = await updateContactMessageStatus(
        messageId,
        status
      );

      const updatedMessage =
        response.contact_message;

      setMessages((previous) =>
        previous.map((message) =>
          message.id === messageId
            ? updatedMessage
            : message
        )
      );

      if (
        selectedMessage &&
        selectedMessage.id === messageId
      ) {
        setSelectedMessage(updatedMessage);
      }

      setSuccess("Message status updated successfully");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Status update error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update message status"
      );
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (messageId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteContactMessage(messageId);

      setMessages((previous) =>
        previous.filter(
          (message) => message.id !== messageId
        )
      );

      if (
        selectedMessage &&
        selectedMessage.id === messageId
      ) {
        setSelectedMessage(null);
      }

      setSuccess("Contact message deleted successfully");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Delete message error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete contact message"
      );
    }
  };

  // =========================================================
  // COUNTS
  // =========================================================

  const totalMessages = messages.length;

  const newMessages = messages.filter(
    (message) =>
      message.status?.toLowerCase() === "new"
  ).length;

  const readMessages = messages.filter(
    (message) =>
      message.status?.toLowerCase() === "read"
  ).length;

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString();
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    return `message-status ${
      status?.toLowerCase() || "new"
    }`;
  };

  return (
    <div className="admin-contact-page">

      {/* HEADER */}
      <div className="contact-page-header">
        <div>
          <h1>Contact Messages</h1>

          <p>
            Manage customer enquiries and contact messages.
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="contact-alert error">
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="contact-alert success">
          {success}
        </div>
      )}

      {/* SUMMARY */}
      <div className="contact-summary-grid">

        <div className="contact-summary-card">
          <div className="contact-summary-icon">
            <Mail size={22} />
          </div>

          <div>
            <span>Total Messages</span>
            <strong>{totalMessages}</strong>
          </div>
        </div>

        <div className="contact-summary-card">
          <div className="contact-summary-icon">
            <Mail size={22} />
          </div>

          <div>
            <span>New</span>
            <strong>{newMessages}</strong>
          </div>
        </div>

        <div className="contact-summary-card">
          <div className="contact-summary-icon">
            <Eye size={22} />
          </div>

          <div>
            <span>Read</span>
            <strong>{readMessages}</strong>
          </div>
        </div>

      </div>

      {/* FILTERS */}
      <div className="contact-filter-box">

        <div className="contact-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search name, email, phone or message..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          {/* <option value="all">
            All Status
          </option>

          <option value="new">
            New
          </option>

          <option value="read">
            Read
          </option>

          <option value="replied">
            Replied
          </option>

          <option value="resolved">
            Resolved
          </option> */}

          <option value="all">
  All Status
</option>

<option value="new">
  New
</option>

<option value="read">
  Read
</option>

<option value="replied">
  Replied
</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="contact-table-container">

        {loading ? (
          <div className="contact-empty">
            Loading contact messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="contact-empty">

            <Mail size={48} />

            <h3>
              No contact messages found
            </h3>

            <p>
              Customer contact messages will appear here.
            </p>

          </div>
        ) : (
          <table className="contact-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filteredMessages.map((message) => (
                <tr key={message.id}>

                  <td>
                    #{message.id}
                  </td>

                  <td>
                    <div className="customer-name">
                      {message.name}
                    </div>
                  </td>

                  <td>
                    <div className="contact-info">
                      <span>
                        {message.email}
                      </span>

                      {message.phone && (
                        <span>
                          {message.phone}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="message-preview">
                      {message.message}
                    </div>
                  </td>

                  <td>

                    <select
                      className={getStatusClass(
                        message.status
                      )}
                      value={
                        message.status || "new"
                      }
                      onChange={(e) =>
                        handleStatusChange(
                          message.id,
                          e.target.value
                        )
                      }
                    >
                      {/* <option value="new">
                        New
                      </option>

                      <option value="read">
                        Read
                      </option>

                      <option value="replied">
                        Replied
                      </option>

                      <option value="resolved">
                        Resolved
                      </option> */}
                      <option value="new">
  New
</option>

<option value="read">
  Read
</option>

<option value="replied">
  Replied
</option>
                    </select>

                  </td>

                  <td>
                    {formatDate(
                      message.created_at
                    )}
                  </td>

                  <td>

                    <div className="contact-actions">

                      <button
                        className="view-btn"
                        onClick={() =>
                          setSelectedMessage(
                            message
                          )
                        }
                        title="View message"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(
                            message.id
                          )
                        }
                        title="Delete message"
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>
        )}

      </div>

      {/* VIEW MODAL */}
      {selectedMessage && (
        <div className="contact-modal-overlay">

          <div className="contact-modal">

            <div className="contact-modal-header">

              <div>
                <h2>
                  Contact Message #{selectedMessage.id}
                </h2>

                <span>
                  {formatDate(
                    selectedMessage.created_at
                  )}
                </span>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedMessage(null)
                }
              >
                <X size={22} />
              </button>

            </div>

            <div className="contact-modal-body">

              <div className="message-detail">
                <label>Name</label>
                <p>
                  {selectedMessage.name}
                </p>
              </div>

              <div className="message-detail">
                <label>Email</label>
                <p>
                  {selectedMessage.email}
                </p>
              </div>

              <div className="message-detail">
                <label>Phone</label>
                <p>
                  {selectedMessage.phone || "-"}
                </p>
              </div>

              <div className="message-detail">
                <label>Status</label>

                <select
                  value={
                    selectedMessage.status ||
                    "new"
                  }
                  onChange={(e) =>
                    handleStatusChange(
                      selectedMessage.id,
                      e.target.value
                    )
                  }
                >
                  <option value="new">
                    New
                  </option>

                  <option value="read">
                    Read
                  </option>

                  <option value="replied">
                    Replied
                  </option>

                  <option value="resolved">
                    Resolved
                  </option>
                </select>

              </div>

              <div className="message-detail full">
                <label>Message</label>

                <div className="full-message">
                  {selectedMessage.message}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminContactMessages;
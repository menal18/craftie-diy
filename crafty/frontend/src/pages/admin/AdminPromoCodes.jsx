import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Tag,
  Percent,
  IndianRupee,
  CalendarDays,
  Users,
} from "lucide-react";

import {
  getAdminPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} from "../../services/adminService";

import "./AdminPromoCodes.css";

const emptyForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  minimum_order_amount: "",
  maximum_discount_amount: "",
  total_usage_limit: "",
  per_user_limit: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

const AdminPromoCodes = () => {
  const navigate = useNavigate();

  const [promoCodes, setPromoCodes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // ==================== LOAD ====================

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminPromoCodes();

      setPromoCodes(response.promo_codes || []);
    } catch (err) {
      console.error("Promo code loading error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromoCodes();
  }, []);

  // ==================== HELPERS ====================

  const formatDate = (date) => {
    if (!date) return "-";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return date;
    }

    return value.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDiscount = (promo) => {
    if (promo.discount_type === "percentage") {
      return `${promo.discount_value}%`;
    }

    return `₹${Number(promo.discount_value).toFixed(2)}`;
  };

  const getDateTimeValue = (date) => {
    if (!date) return "";

    return date.slice(0, 16);
  };

  // ==================== FILTER ====================

  const filteredPromoCodes = useMemo(() => {
    return promoCodes.filter((promo) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        promo.code?.toLowerCase().includes(searchText) ||
        promo.description?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && promo.is_active) ||
        (statusFilter === "inactive" && !promo.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [promoCodes, search, statusFilter]);

  // ==================== COUNTS ====================

  const totalCount = promoCodes.length;

  const activeCount = promoCodes.filter((promo) => promo.is_active).length;

  const inactiveCount = promoCodes.filter((promo) => !promo.is_active).length;

  // ==================== FORM ====================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingPromoCode(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (promo) => {
    setEditingPromoCode(promo);

    setForm({
      code: promo.code || "",
      description: promo.description || "",
      discount_type: promo.discount_type || "percentage",
      discount_value: promo.discount_value ?? "",
      minimum_order_amount: promo.minimum_order_amount ?? "",
      maximum_discount_amount: promo.maximum_discount_amount ?? "",
      total_usage_limit: promo.total_usage_limit ?? promo.usage_limit ?? "",
      per_user_limit: promo.per_user_limit ?? "",
      start_date: getDateTimeValue(promo.start_date),
      end_date: getDateTimeValue(promo.end_date),
      is_active: Boolean(promo.is_active),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingPromoCode(null);
    setForm(emptyForm);
  };

  // ==================== SAVE ====================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.code.trim()) {
        setError("Promo code is required");
        return;
      }

      if (!form.discount_value) {
        setError("Discount value is required");
        return;
      }

      if (!form.start_date || !form.end_date) {
        setError("Start date and end date are required");
        return;
      }

      if (new Date(form.start_date) >= new Date(form.end_date)) {
        setError("End date must be after start date");
        return;
      }

      const promoData = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,

        discount_type: form.discount_type,

        discount_value: Number(form.discount_value),

        minimum_order_amount:
          form.minimum_order_amount === ""
            ? 0
            : Number(form.minimum_order_amount),

        maximum_discount_amount:
          form.maximum_discount_amount === ""
            ? null
            : Number(form.maximum_discount_amount),

        total_usage_limit:
          form.total_usage_limit === "" ? null : Number(form.total_usage_limit),

        per_user_limit:
          form.per_user_limit === "" ? null : Number(form.per_user_limit),

        start_date: form.start_date,
        end_date: form.end_date,

        is_active: Boolean(form.is_active),
      };

      if (editingPromoCode) {
        await updatePromoCode(editingPromoCode.id, promoData);

        setSuccess("Promo code updated successfully");
      } else {
        await createPromoCode(promoData);

        setSuccess("Promo code created successfully");
      }

      await loadPromoCodes();

      setTimeout(() => {
        setShowModal(false);
        setEditingPromoCode(null);
        setForm(emptyForm);
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error("Promo code save error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Failed to save promo code");
    } finally {
      setSaving(false);
    }
  };

  // ==================== STATUS ====================

  const handleToggleStatus = async (promo, newStatus) => {
    try {
      setError("");
      setSuccess("");

      await updatePromoCode(promo.id, {
        is_active: newStatus,
      });

      setPromoCodes((previous) =>
        previous.map((item) =>
          item.id === promo.id
            ? {
                ...item,
                is_active: newStatus,
              }
            : item,
        ),
      );

      setSuccess(
        `${promo.code} ${newStatus ? "activated" : "deactivated"} successfully`,
      );
    } catch (err) {
      console.error("Promo code status error:", err);

      setError(
        err.response?.data?.message || "Failed to update promo code status",
      );
    }
  };

  // ==================== DELETE ====================

  const handleDelete = async (promo) => {
    const confirmed = window.confirm(`Deactivate promo code "${promo.code}"?`);

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deletePromoCode(promo.id);

      setSuccess("Promo code deactivated successfully");

      await loadPromoCodes();
    } catch (err) {
      console.error("Promo code delete error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message || "Failed to deactivate promo code",
      );
    }
  };

  // ==================== UI ====================

  return (
    <div className="admin-promocodes-page">
      <div className="admin-promocodes-header">
        <div>
          <h1>Promo Codes</h1>

          <p>Create and manage discount codes for customers.</p>
        </div>

        <button className="promocode-add-btn" onClick={openCreateModal}>
          <Plus size={18} />
          Add Promo Code
        </button>
      </div>

      {error && <div className="promocode-alert error">{error}</div>}

      {success && <div className="promocode-alert success">{success}</div>}

      {/* ================= SUMMARY ================= */}

      <div className="promocode-summary-grid">
        <div className="promocode-summary-card">
          <div className="promocode-summary-icon">
            <Tag size={20} />
          </div>

          <div>
            <span>Total Promo Codes</span>
            <strong>{totalCount}</strong>
          </div>
        </div>

        <div className="promocode-summary-card">
          <div className="promocode-summary-icon">
            <Percent size={20} />
          </div>

          <div>
            <span>Active</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="promocode-summary-card">
          <div className="promocode-summary-icon">
            <Users size={20} />
          </div>

          <div>
            <span>Inactive</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>
      </div>

      {/* ================= FILTER ================= */}

      <div className="promocode-filter-bar">
        <div className="promocode-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search promo codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="promocode-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>

          <option value="active">Active</option>

          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* ================= TABLE ================= */}

      <div className="promocode-table-card">
        {loading ? (
          <div className="promocode-loading">Loading promo codes...</div>
        ) : filteredPromoCodes.length === 0 ? (
          <div className="promocode-empty">
            <Tag size={40} />

            <h3>No promo codes found</h3>

            <p>Create a promo code to offer discounts.</p>

            <button className="promocode-empty-btn" onClick={openCreateModal}>
              <Plus size={17} />
              Add Promo Code
            </button>
          </div>
        ) : (
          <div className="promocode-table-wrapper">
            <table className="promocode-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPromoCodes.map((promo) => (
                  <tr key={promo.id}>
                    <td>
                      <div className="promocode-name-cell">
                        <strong>{promo.code}</strong>

                        {promo.description && <span>{promo.description}</span>}
                      </div>
                    </td>

                    <td>
                      <span className="promocode-discount-badge">
                        {promo.discount_type === "percentage" ? (
                          <Percent size={14} />
                        ) : (
                          <IndianRupee size={14} />
                        )}

                        {formatDiscount(promo)}
                      </span>
                    </td>

                    <td>
                      ₹{Number(promo.minimum_order_amount || 0).toFixed(2)}
                    </td>

                    <td>
                      <div className="promocode-usage-cell">
                        <Users size={14} />

                        {promo.usage_count ?? promo.used_count ?? 0}

                        {(promo.total_usage_limit ?? promo.usage_limit)
                          ? ` / ${promo.total_usage_limit ?? promo.usage_limit}`
                          : " / Unlimited"}
                      </div>
                    </td>

                    <td>
                      <div className="promocode-date-cell">
                        <CalendarDays size={14} />

                        {formatDate(promo.start_date)}
                      </div>
                    </td>

                    <td>
                      <div className="promocode-date-cell">
                        <CalendarDays size={14} />

                        {formatDate(promo.end_date)}
                      </div>
                    </td>

                    <td>
                      <select
                        className={`promocode-status-select ${
                          promo.is_active ? "active" : "inactive"
                        }`}
                        value={String(promo.is_active)}
                        onChange={(e) =>
                          handleToggleStatus(promo, e.target.value === "true")
                        }
                      >
                        <option value="true">Active</option>

                        <option value="false">Inactive</option>
                      </select>
                    </td>

                    <td>
                      <div className="promocode-actions">
                        <button
                          className="promocode-edit-btn"
                          onClick={() => openEditModal(promo)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          className="promocode-delete-btn"
                          onClick={() => handleDelete(promo)}
                          title="Deactivate"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}

      {showModal && (
        <div className="promocode-modal-overlay">
          <div className="promocode-modal">
            <div className="promocode-modal-header">
              <div>
                <h2>
                  {editingPromoCode ? "Edit Promo Code" : "Add Promo Code"}
                </h2>

                <p>Configure customer discount rules.</p>
              </div>

              <button className="promocode-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form className="promocode-form" onSubmit={handleSubmit}>
              <div className="promocode-form-group">
                <label>Promo Code</label>

                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="Example: WELCOME20"
                  style={{
                    textTransform: "uppercase",
                  }}
                  required
                />
              </div>

              <div className="promocode-form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe this promo code"
                  rows="3"
                />
              </div>

              <div className="promocode-form-row">
                <div className="promocode-form-group">
                  <label>Discount Type</label>

                  <select
                    name="discount_type"
                    value={form.discount_type}
                    onChange={handleChange}
                  >
                    <option value="percentage">Percentage</option>

                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div className="promocode-form-group">
                  <label>Discount Value</label>

                  <input
                    type="number"
                    name="discount_value"
                    value={form.discount_value}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="promocode-form-row">
                <div className="promocode-form-group">
                  <label>Minimum Order Amount</label>

                  <input
                    type="number"
                    name="minimum_order_amount"
                    value={form.minimum_order_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>

                <div className="promocode-form-group">
                  <label>Maximum Discount Amount</label>

                  <input
                    type="number"
                    name="maximum_discount_amount"
                    value={form.maximum_discount_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="promocode-form-row">
                <div className="promocode-form-group">
                  <label>Total Usage Limit</label>

                  <input
                    type="number"
                    name="total_usage_limit"
                    value={form.total_usage_limit}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    placeholder="Unlimited"
                  />
                </div>

                <div className="promocode-form-group">
                  <label>Per User Limit</label>

                  <input
                    type="number"
                    name="per_user_limit"
                    value={form.per_user_limit}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="promocode-form-row">
                <div className="promocode-form-group">
                  <label>Start Date</label>

                  <input
                    type="datetime-local"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="promocode-form-group">
                  <label>End Date</label>

                  <input
                    type="datetime-local"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="promocode-form-group">
                <label>Status</label>

                <select
                  value={String(form.is_active)}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      is_active: e.target.value === "true",
                    }))
                  }
                >
                  <option value="true">Active</option>

                  <option value="false">Inactive</option>
                </select>
              </div>

              {error && <div className="promocode-form-error">{error}</div>}

              {success && (
                <div className="promocode-form-success">{success}</div>
              )}

              <div className="promocode-modal-actions">
                <button
                  type="button"
                  className="promocode-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="promocode-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingPromoCode
                      ? "Update Promo Code"
                      : "Create Promo Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromoCodes;

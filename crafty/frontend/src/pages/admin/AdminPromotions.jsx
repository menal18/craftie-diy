import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Percent,
  IndianRupee,
  Tag,
  CalendarDays,
} from "lucide-react";

import {
  getAdminPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getAdminProducts,
} from "../../services/adminService";

import "./AdminPromotions.css";

const emptyForm = {
  name: "",
  description: "",
  product_id: "",
  discount_type: "percentage",
  discount_value: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

const AdminPromotions = () => {
  const navigate = useNavigate();

  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // ==================== LOAD DATA ====================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [promotionResponse, productResponse] =
        await Promise.all([
          getAdminPromotions(),
          getAdminProducts(),
        ]);

      setPromotions(promotionResponse.promotions || []);

      setProducts(
        productResponse.products ||
          productResponse.data ||
          []
      );
    } catch (err) {
      console.error("Promotion loading error:", err);

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
          "Failed to load promotions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const formatDiscount = (promotion) => {
    if (promotion.discount_type === "percentage") {
      return `${promotion.discount_value}%`;
    }

    return `₹${Number(
      promotion.discount_value
    ).toFixed(2)}`;
  };

  const getDateTimeValue = (date) => {
    if (!date) return "";

    // Backend returns ISO datetime.
    // Keep the same local datetime without timezone shifting.
    return date.slice(0, 16);
  };

  // ==================== FILTER ====================

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promotion) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        promotion.name
          ?.toLowerCase()
          .includes(searchText) ||
        promotion.product_name
          ?.toLowerCase()
          .includes(searchText) ||
        promotion.description
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          promotion.is_active) ||
        (statusFilter === "inactive" &&
          !promotion.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [promotions, search, statusFilter]);

  // ==================== COUNTS ====================

  const totalCount = promotions.length;

  const activeCount = promotions.filter(
    (promotion) => promotion.is_active
  ).length;

  const inactiveCount = promotions.filter(
    (promotion) => !promotion.is_active
  ).length;

  // ==================== FORM ====================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingPromotion(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (promotion) => {
    setEditingPromotion(promotion);

    setForm({
      name: promotion.name || "",
      description: promotion.description || "",
      product_id: String(promotion.product_id || ""),
      discount_type:
        promotion.discount_type || "percentage",
      discount_value:
        promotion.discount_value ?? "",
      start_date: getDateTimeValue(
        promotion.start_date
      ),
      end_date: getDateTimeValue(
        promotion.end_date
      ),
      is_active: Boolean(promotion.is_active),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingPromotion(null);
    setForm(emptyForm);
  };

  // ==================== SAVE ====================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        setError("Promotion name is required");
        return;
      }

      if (!form.product_id) {
        setError("Please select a product");
        return;
      }

      if (!form.discount_value) {
        setError("Discount value is required");
        return;
      }

      if (!form.start_date || !form.end_date) {
        setError(
          "Start date and end date are required"
        );
        return;
      }

      if (
        new Date(form.start_date) >=
        new Date(form.end_date)
      ) {
        setError(
          "End date must be after start date"
        );
        return;
      }

      const promotionData = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        product_id: Number(form.product_id),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        start_date: form.start_date,
        end_date: form.end_date,
        is_active: Boolean(form.is_active),
      };

      if (editingPromotion) {
        await updatePromotion(
          editingPromotion.id,
          promotionData
        );

        setSuccess(
          "Promotion updated successfully"
        );
      } else {
        await createPromotion(promotionData);

        setSuccess(
          "Promotion created successfully"
        );
      }

      await loadData();

      setTimeout(() => {
        setShowModal(false);
        setEditingPromotion(null);
        setForm(emptyForm);
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error("Promotion save error:", err);

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
          "Failed to save promotion"
      );
    } finally {
      setSaving(false);
    }
  };


  // ==================== STATUS ====================

const handleToggleStatus = async (promotion, newStatus) => {
  try {
    setError("");
    setSuccess("");

    await updatePromotion(promotion.id, {
      is_active: newStatus,
    });

    setPromotions((previous) =>
      previous.map((item) =>
        item.id === promotion.id
          ? {
              ...item,
              is_active: newStatus,
            }
          : item
      )
    );

    setSuccess(
      `${promotion.name} ${
        newStatus ? "activated" : "deactivated"
      } successfully`
    );
  } catch (err) {
    console.error("Promotion status error:", err);

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
        "Failed to update promotion status"
    );
  }
};
  // ==================== DELETE / DEACTIVATE ====================

  const handleDelete = async (promotion) => {
    const confirmed = window.confirm(
      `Deactivate "${promotion.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deletePromotion(promotion.id);

      setSuccess(
        "Promotion deactivated successfully"
      );

      await loadData();
    } catch (err) {
      console.error(
        "Promotion delete error:",
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
          "Failed to deactivate promotion"
      );
    }
  };

  // ==================== UI ====================

  return (
    <div className="admin-promotions-page">

      <div className="admin-promotions-header">
        <div>
          <h1>Promotions</h1>
          <p>
            Manage product discounts and promotional offers.
          </p>
        </div>

        <button
          className="promotion-add-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Add Promotion
        </button>
      </div>

      {error && (
        <div className="promotion-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="promotion-alert success">
          {success}
        </div>
      )}

      {/* ==================== SUMMARY ==================== */}

      <div className="promotion-summary-grid">

        <div className="promotion-summary-card">
          <div className="promotion-summary-icon">
            <Tag size={20} />
          </div>

          <div>
            <span>Total Promotions</span>
            <strong>{totalCount}</strong>
          </div>
        </div>

        <div className="promotion-summary-card">
          <div className="promotion-summary-icon">
            <Percent size={20} />
          </div>

          <div>
            <span>Active</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="promotion-summary-card">
          <div className="promotion-summary-icon">
            <Tag size={20} />
          </div>

          <div>
            <span>Inactive</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>

      </div>

      {/* ==================== FILTERS ==================== */}

      <div className="promotion-filter-bar">

        <div className="promotion-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search promotions..."
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
          className="promotion-status-filter"
        >
          <option value="all">
            All Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>

      </div>

      {/* ==================== TABLE ==================== */}

      <div className="promotion-table-card">

        {loading ? (
          <div className="promotion-loading">
            Loading promotions...
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="promotion-empty">
            <Tag size={40} />

            <h3>No promotions found</h3>

            <p>
              Create a promotion to offer discounts
              on your products.
            </p>

            <button
              onClick={openCreateModal}
              className="promotion-empty-btn"
            >
              <Plus size={17} />
              Add Promotion
            </button>
          </div>
        ) : (
          <div className="promotion-table-wrapper">

            <table className="promotion-table">

              <thead>
                <tr>
                  <th>Promotion</th>
                  <th>Product</th>
                  <th>Discount</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredPromotions.map(
                  (promotion) => (
                    <tr key={promotion.id}>

                      <td>
                        <div className="promotion-name-cell">
                          <strong>
                            {promotion.name}
                          </strong>

                          {promotion.description && (
                            <span>
                              {promotion.description}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        {promotion.product_name ||
                          `Product #${promotion.product_id}`}
                      </td>

                      <td>
                        <span className="discount-badge">
                          {promotion.discount_type ===
                          "percentage" ? (
                            <Percent size={14} />
                          ) : (
                            <IndianRupee size={14} />
                          )}

                          {formatDiscount(
                            promotion
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="date-cell">
                          <CalendarDays
                            size={14}
                          />
                          {formatDate(
                            promotion.start_date
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="date-cell">
                          <CalendarDays
                            size={14}
                          />
                          {formatDate(
                            promotion.end_date
                          )}
                        </div>
                      </td>

                      <td>

                        <select
                          className={`promotion-status-select ${
                            promotion.is_active
                              ? "active"
                              : "inactive"
                          }`}
                          value={String(
                            promotion.is_active
                          )}
                          onChange={(e) =>
                            handleToggleStatus(
                              promotion,
                              e.target.value ===
                                "true"
                            )
                          }
                        >
                          <option value="true">
                            Active
                          </option>

                          <option value="false">
                            Inactive
                          </option>
                        </select>

                      </td>

                      <td>

                        <div className="promotion-actions">

                          <button
                            className="promotion-edit-btn"
                            onClick={() =>
                              openEditModal(
                                promotion
                              )
                            }
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            className="promotion-delete-btn"
                            onClick={() =>
                              handleDelete(
                                promotion
                              )
                            }
                            title="Deactivate"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ==================== MODAL ==================== */}

      {showModal && (
        <div className="promotion-modal-overlay">

          <div className="promotion-modal">

            <div className="promotion-modal-header">

              <div>
                <h2>
                  {editingPromotion
                    ? "Edit Promotion"
                    : "Add Promotion"}
                </h2>

                <p>
                  Configure product discount details.
                </p>
              </div>

              <button
                className="promotion-modal-close"
                onClick={closeModal}
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="promotion-form"
            >

              <div className="promotion-form-group">
                <label>
                  Promotion Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: Festive Sale"
                  required
                />
              </div>

              <div className="promotion-form-group">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe this promotion"
                  rows="3"
                />
              </div>

              <div className="promotion-form-group">
                <label>
                  Product
                </label>

                <select
                  name="product_id"
                  value={form.product_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="promotion-form-row">

                <div className="promotion-form-group">
                  <label>
                    Discount Type
                  </label>

                  <select
                    name="discount_type"
                    value={form.discount_type}
                    onChange={handleChange}
                  >
                    <option value="percentage">
                      Percentage
                    </option>

                    <option value="fixed">
                      Fixed Amount
                    </option>
                  </select>
                </div>

                <div className="promotion-form-group">
                  <label>
                    Discount Value
                  </label>

                  <input
                    type="number"
                    name="discount_value"
                    value={form.discount_value}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder={
                      form.discount_type ===
                      "percentage"
                        ? "20"
                        : "100"
                    }
                    required
                  />
                </div>

              </div>

              <div className="promotion-form-row">

                <div className="promotion-form-group">
                  <label>
                    Start Date
                  </label>

                  <input
                    type="datetime-local"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="promotion-form-group">
                  <label>
                    End Date
                  </label>

                  <input
                    type="datetime-local"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    required
                  />
                </div>

              </div>

              <div className="promotion-form-group">
                <label>
                  Status
                </label>

                <select
                  name="is_active"
                  value={String(form.is_active)}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      is_active:
                        e.target.value === "true",
                    }))
                  }
                >
                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Inactive
                  </option>
                </select>
              </div>

              {error && (
                <div className="promotion-form-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="promotion-form-success">
                  {success}
                </div>
              )}

              <div className="promotion-modal-actions">

                <button
                  type="button"
                  className="promotion-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="promotion-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingPromotion
                    ? "Update Promotion"
                    : "Create Promotion"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminPromotions;
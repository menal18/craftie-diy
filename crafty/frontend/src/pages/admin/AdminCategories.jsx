import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FolderOpen,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  updateCategoryStatus,
} from "../../services/adminService";

import "./AdminCategories.css";


const emptyForm = {
  name: "",
  description: "",
  image_url: "",
  is_active: true,
};


const AdminCategories = () => {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState(emptyForm);


  // =========================================================
  // LOAD CATEGORIES
  // =========================================================

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminCategories();

      setCategories(response.categories || []);
    } catch (err) {
      console.error("Load categories error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
        return;
      }

      if (err.response?.status === 403) {
        setError("You do not have admin access.");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  };


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadCategories();
  }, []);


  // =========================================================
  // CLEAR MESSAGES
  // =========================================================

  useEffect(() => {
    if (!success && !error) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess("");
      setError("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success, error]);


  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "is_active"
          ? value === "true"
          : value,
    }));
  };


  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openAddModal = () => {
    setEditingCategory(null);

    setForm({
      ...emptyForm,
      is_active: true,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };


  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (category) => {
    setEditingCategory(category);

    setForm({
      name: category.name || "",
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: Boolean(category.is_active),
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };


  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingCategory(null);

    setForm({
      ...emptyForm,
    });
  };


  // =========================================================
  // SUBMIT CATEGORY
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);

      const categoryData = {
        name,
        description: form.description.trim(),
        image_url: form.image_url.trim(),
        is_active: Boolean(form.is_active),
      };


      // -----------------------------------------------------
      // CREATE
      // -----------------------------------------------------

      if (!editingCategory) {
        const response = await createAdminCategory(
          categoryData
        );

        setSuccess(
          response.message ||
            "Category created successfully."
        );
      }


      // -----------------------------------------------------
      // UPDATE
      // -----------------------------------------------------

      else {
        const response = await updateAdminCategory(
          editingCategory.id,
          categoryData
        );

        setSuccess(
          response.message ||
            "Category updated successfully."
        );
      }

      setShowModal(false);
      setEditingCategory(null);

      setForm({
        ...emptyForm,
      });

      await loadCategories();

    } catch (err) {
      console.error("Save category error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
        return;
      }

      if (err.response?.status === 403) {
        setError("You do not have admin access.");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to save category."
      );
    } finally {
      setSaving(false);
    }
  };


  // =========================================================
  // UPDATE CATEGORY STATUS
  // =========================================================

  const handleStatusChange = async (
    category,
    newStatus
  ) => {
    const isActive = newStatus === "true";

    try {
      setError("");
      setSuccess("");

      await updateCategoryStatus(
        category.id,
        isActive
      );

      setCategories((previous) =>
        previous.map((item) =>
          item.id === category.id
            ? {
                ...item,
                is_active: isActive,
              }
            : item
        )
      );

      setSuccess(
        `${category.name} ${
          isActive
            ? "activated"
            : "deactivated"
        } successfully.`
      );

    } catch (err) {
      console.error(
        "Category status update error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
        return;
      }

      if (err.response?.status === 403) {
        setError(
          "You do not have admin access."
        );
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to update category status."
      );
    }
  };


  // =========================================================
  // DEACTIVATE CATEGORY
  // =========================================================

  const handleDelete = async (category) => {
    if (!category) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await deleteAdminCategory(
          category.id
        );

      setCategories((previous) =>
        previous.map((item) =>
          item.id === category.id
            ? {
                ...item,
                is_active: false,
              }
            : item
        )
      );

      setSuccess(
        response.message ||
          "Category deactivated successfully."
      );

    } catch (err) {
      console.error(
        "Deactivate category error:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
        return;
      }

      if (err.response?.status === 403) {
        setError(
          "You do not have admin access."
        );
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to deactivate category."
      );
    }
  };


  // =========================================================
  // SEARCH
  // =========================================================

  const filteredCategories = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return categories;
    }

    return categories.filter((category) => {
      return (
        category.name
          ?.toLowerCase()
          .includes(keyword) ||
        category.description
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [categories, search]);


  // =========================================================
  // COUNTS
  // =========================================================

  const activeCount = categories.filter(
    (category) => category.is_active
  ).length;

  const inactiveCount = categories.filter(
    (category) => !category.is_active
  ).length;


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="admin-categories-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="admin-page-header">

        <div>
          <h1>Categories</h1>

          <p>
            Manage your product categories
          </p>
        </div>

        <button
          className="add-category-btn"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Category
        </button>

      </div>


      {/* =====================================================
          ALERTS
      ===================================================== */}

      {success && (
        <div className="admin-alert success-alert">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="admin-alert error-alert">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}


      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="category-stats">

        <div className="category-stat-card">

          <div className="category-stat-icon">
            <FolderOpen size={20} />
          </div>

          <div>
            <span>Total Categories</span>
            <strong>
              {categories.length}
            </strong>
          </div>

        </div>


        <div className="category-stat-card">

          <div className="category-stat-icon active-icon">
            <CheckCircle size={20} />
          </div>

          <div>
            <span>Active</span>
            <strong>
              {activeCount}
            </strong>
          </div>

        </div>


        <div className="category-stat-card">

          <div className="category-stat-icon inactive-icon">
            <XCircle size={20} />
          </div>

          <div>
            <span>Inactive</span>
            <strong>
              {inactiveCount}
            </strong>
          </div>

        </div>

      </div>


      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="category-toolbar">

        <div className="category-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <button
          className="refresh-category-btn"
          onClick={loadCategories}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "refresh-spinning"
                : ""
            }
          />

          Refresh
        </button>

      </div>


      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="categories-table-card">

        {loading ? (

          <div className="category-loading">
            <RefreshCw
              size={28}
              className="refresh-spinning"
            />

            <p>
              Loading categories...
            </p>
          </div>

        ) : filteredCategories.length === 0 ? (

          <div className="category-empty">

            <FolderOpen size={45} />

            <h3>
              {search
                ? "No categories found"
                : "No categories available"}
            </h3>

            <p>
              {search
                ? "Try a different search term."
                : "Create your first category to get started."}
            </p>

            {!search && (
              <button
                className="add-category-btn"
                onClick={openAddModal}
              >
                <Plus size={18} />
                Add Category
              </button>
            )}

          </div>

        ) : (

          <div className="categories-table-wrapper">

            <table className="categories-table">

              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredCategories.map(
                  (category) => (

                    <tr key={category.id}>

                      {/* CATEGORY */}

                      <td>

                        <div className="category-info">

                          {category.image_url ? (

                            <img
                              src={
                                category.image_url
                              }
                              alt={
                                category.name
                              }
                              className="category-image"
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";
                                e.currentTarget.nextSibling.style.display =
                                  "flex";
                              }}
                            />

                          ) : null}


                          <div
                            className="category-image-placeholder"
                            style={{
                              display:
                                category.image_url
                                  ? "none"
                                  : "flex",
                            }}
                          >
                            <FolderOpen
                              size={18}
                            />
                          </div>


                          <div className="category-name-wrapper">

                            <strong>
                              {category.name}
                            </strong>

                            <span>
                              ID: {category.id}
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* DESCRIPTION */}

                      <td>

                        <div className="category-description">

                          {category.description ||
                            "No description"}

                        </div>

                      </td>


                      {/* STATUS */}

                      <td>

                        <select
                          className={`category-status-select ${
                            category.is_active
                              ? "active"
                              : "inactive"
                          }`}
                          value={String(
                            category.is_active
                          )}
                          onChange={(e) =>
                            handleStatusChange(
                              category,
                              e.target.value
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


                      {/* CREATED */}

                      <td>

                        <span className="category-date">

                          {category.created_at
                            ? new Date(
                                category.created_at
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}

                        </span>

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="category-actions">

                          <button
                            className="category-action-btn edit"
                            onClick={() =>
                              openEditModal(
                                category
                              )
                            }
                            title="Edit category"
                          >
                            <Edit size={17} />
                          </button>


                          {category.is_active && (
                            <button
                              className="category-action-btn delete"
                              onClick={() =>
                                handleDelete(
                                  category
                                )
                              }
                              title="Deactivate category"
                            >
                              <Trash2
                                size={17}
                              />
                            </button>
                          )}

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


      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (

        <div
          className="category-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="category-modal">

            {/* MODAL HEADER */}

            <div className="category-modal-header">

              <div>

                <h2>
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p>
                  {editingCategory
                    ? "Update category details"
                    : "Create a new product category"}
                </p>

              </div>

              <button
                className="modal-close-btn"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>

            </div>


            {/* MODAL FORM */}

            <form
              className="category-form"
              onSubmit={handleSubmit}
            >

              {/* NAME */}

              <div className="form-group">

                <label>
                  Category Name
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter category name"
                  disabled={saving}
                />

              </div>


              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter category description"
                  rows={4}
                  disabled={saving}
                />

              </div>


              {/* IMAGE URL */}

              <div className="form-group">

                <label>
                  Category Image URL
                </label>

                <input
                  type="text"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/category-image.jpg"
                  disabled={saving}
                />

              </div>


              {/* IMAGE PREVIEW */}

              {form.image_url && (

                <div className="category-image-preview">

                  <img
                    src={form.image_url}
                    alt="Category preview"
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />

                </div>

              )}


              {/* STATUS */}

              <div className="form-group">

                <label>
                  Category Status
                </label>

                <select
                  name="is_active"
                  value={String(
                    form.is_active
                  )}
                  onChange={handleChange}
                  disabled={saving}
                  className="category-form-status"
                >

                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Inactive
                  </option>

                </select>

              </div>


              {/* FORM ACTIONS */}

              <div className="category-form-actions">

                <button
                  type="button"
                  className="cancel-category-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-category-btn"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="refresh-spinning"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      {editingCategory
                        ? "Update Category"
                        : "Create Category"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default AdminCategories;
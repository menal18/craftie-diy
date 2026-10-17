
import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import {
  getAdminProducts,
  getAdminCategories,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  updateProductStatus,
  uploadProductImage,
} from "../../services/adminService";

import "./AdminProducts.css";


// =========================================================
// EMPTY FORM
// =========================================================

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock_quantity: "",
  category_id: "",
  is_active: true,
};

const getProductImageSource = (product) => {
  const imageUrl =
    product?.image_url ||
    product?.images?.find((image) => image.is_primary)?.image_url ||
    product?.images?.[0]?.image_url;

  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return "";
  }

  try {
    return new URL(imageUrl.trim(), api.defaults.baseURL).toString();
  } catch (error) {
    console.warn("Invalid product image URL:", imageUrl, error);
    return "";
  }
};

const ProductImageThumbnail = ({ src, name }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="product-image-placeholder">
        <Package size={20} />
      </div>
    );
  }

  return (
    <img
      className="product-image-thumbnail"
      src={src}
      alt={`${name} product`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};


// =========================================================
// ADMIN PRODUCTS
// =========================================================

const AdminProducts = () => {

  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState("");
  const productImagePreviewRef = useRef("");
  const productImageInputRef = useRef(null);

  const clearProductImage = () => {
    if (productImagePreviewRef.current) {
      URL.revokeObjectURL(productImagePreviewRef.current);
      productImagePreviewRef.current = "";
    }

    setProductImage(null);
    setProductImagePreview("");

    if (productImageInputRef.current) {
      productImageInputRef.current.value = "";
    }
  };

  const handleProductImageChange = (e) => {
    const image = e.target.files?.[0] || null;

    if (productImagePreviewRef.current) {
      URL.revokeObjectURL(productImagePreviewRef.current);
    }

    const previewUrl = image ? URL.createObjectURL(image) : "";
    productImagePreviewRef.current = previewUrl;

    setProductImage(image);
    setProductImagePreview(previewUrl);
  };


  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  const loadProducts = async () => {

    try {

      const response = await getAdminProducts();

      /*
       * Supports:
       *
       * {
       *   products: [...]
       * }
       *
       * OR
       *
       * [...]
       */

      const productData =
        response?.products ??
        response ??
        [];

      setProducts(
        Array.isArray(productData)
          ? productData
          : []
      );

    } catch (err) {

      console.error(
        "Load products error:",
        err
      );

      if (err?.response?.status === 401) {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          state: {
            from: "/admin/products",
          },
        });

        return;
      }

      if (err?.response?.status === 403) {

        setError(
          "Admin access required."
        );

        return;
      }

      setError(
        err?.response?.data?.message ||
        "Unable to load products."
      );
    }
  };


  // =========================================================
  // LOAD CATEGORIES
  // =========================================================

  const loadCategories = async () => {

    try {

      const response =
        await getAdminCategories();

      const categoryData =
        response?.categories ??
        response ??
        [];

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : []
      );

    } catch (err) {

      console.error(
        "Load categories error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to load categories."
      );
    }
  };


  // =========================================================
  // LOAD ALL DATA
  // =========================================================

  const loadData = async () => {

    try {

      setLoading(true);
      setError("");

      await Promise.all([
        loadProducts(),
        loadCategories(),
      ]);

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {

    loadData();

  }, []);

  useEffect(() => () => {
    if (productImagePreviewRef.current) {
      URL.revokeObjectURL(productImagePreviewRef.current);
    }
  }, []);


  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {

    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((previous) => ({

      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : name === "is_active"
          ? value === "true"
          : value,

    }));
  };


  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openAddModal = () => {

    setEditingProduct(null);

    setForm({
      ...emptyForm,
    });

    clearProductImage();

    setError("");
    setSuccess("");

    setShowModal(true);
  };


  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (product) => {

    setEditingProduct(product);

    setForm({

      name:
        product.name ?? "",

      description:
        product.description ?? "",

      price:
        product.price ?? "",

      stock_quantity:
        product.stock_quantity ?? "",

      category_id:
        product.category_id ?? "",

      is_active:
        Boolean(product.is_active),

    });

    clearProductImage();

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

    setEditingProduct(null);

    setForm({
      ...emptyForm,
    });

    clearProductImage();
  };


  // =========================================================
  // SAVE PRODUCT
  // =========================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setSuccess("");


    // =======================================================
    // VALIDATION
    // =======================================================

    if (!form.name.trim()) {

      setError(
        "Product name is required."
      );

      return;
    }


    if (
      form.price === "" ||
      Number(form.price) < 0
    ) {

      setError(
        "Please enter a valid price."
      );

      return;
    }


    if (
      form.stock_quantity === "" ||
      Number(form.stock_quantity) < 0
    ) {

      setError(
        "Please enter a valid stock quantity."
      );

      return;
    }


    if (!form.category_id) {

      setError(
        "Please select a category."
      );

      return;
    }


    try {

      setSaving(true);


      // =====================================================
      // PRODUCT DATA
      // =====================================================

      const productData = {

        name:
          form.name.trim(),

        description:
          form.description.trim(),

        price:
          Number(form.price),

        stock_quantity:
          Number(form.stock_quantity),

        category_id:
          Number(form.category_id),

        /*
         * true  = Active
         * false = Inactive
         */
        is_active:
          Boolean(form.is_active),

      };


      // =====================================================
      // CREATE / UPDATE PRODUCT
      // =====================================================

      let productId;


      if (editingProduct) {

        const response =
          await updateAdminProduct(
            editingProduct.id,
            productData
          );

        productId =
          response?.product?.id ||
          editingProduct.id;

      } else {

        const response =
          await createAdminProduct(
            productData
          );

        productId =
          response?.product?.id;

      }


      // =====================================================
      // UPLOAD PRODUCT IMAGE
      // =====================================================

      if (
        productImage &&
        productId
      ) {

        await uploadProductImage(
          productId,
          productImage,
          true,
          0
        );
      }


      // =====================================================
      // SUCCESS MESSAGE
      // =====================================================

      setSuccess(
        editingProduct
          ? "Product updated successfully."
          : "Product created successfully."
      );


      // =====================================================
      // RELOAD PRODUCTS
      // =====================================================

      await loadProducts();

      clearProductImage();

      closeModal();


    } catch (err) {

      console.error(
        "Save product error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to save product."
      );

    } finally {

      setSaving(false);

    }
  };


  // =========================================================
  // ACTIVE / INACTIVE TOGGLE
  // =========================================================

  // const handleToggleStatus = async (product) => {

  //   const newStatus =
  //     !Boolean(product.is_active);


  //   try {

  //     setError("");
  //     setSuccess("");


  //     await updateProductStatus(
  //       product.id,
  //       newStatus
  //     );


  //     /*
  //      * Backend is the source of truth.
  //      */

  //     await loadProducts();


  //     setSuccess(
  //       newStatus
  //         ? `${product.name} activated successfully.`
  //         : `${product.name} deactivated successfully.`
  //     );


  //   } catch (err) {

  //     console.error(
  //       "Toggle product status error:",
  //       err
  //     );

  //     setError(
  //       err?.response?.data?.message ||
  //       "Unable to update product status."
  //     );
  //   }
  // };


  const handleToggleStatus = async (product, newStatus) => {
  try {
    setError("");
    setSuccess("");

    await updateProductStatus(product.id, newStatus);

    setProducts((previous) =>
      previous.map((item) =>
        item.id === product.id
          ? { ...item, is_active: newStatus }
          : item
      )
    );

    setSuccess(
      `${product.name} ${
        newStatus ? "activated" : "deactivated"
      } successfully`
    );
  } catch (err) {
    console.error("Status update error:", err);

    setError(
      err.response?.data?.message ||
        "Failed to update product status"
    );
  }
};

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDelete = async (product) => {

    const confirmed =
      window.confirm(
        `Delete "${product.name}"?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setError("");
      setSuccess("");


      await deleteAdminProduct(
        product.id
      );


      await loadProducts();


      setSuccess(
        "Product deleted successfully."
      );


    } catch (err) {

      console.error(
        "Delete product error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to delete product."
      );
    }
  };


  // =========================================================
  // CATEGORY NAME
  // =========================================================

  const getCategoryName = (categoryId) => {

    const category =
      categories.find(
        (item) =>
          Number(item.id) ===
          Number(categoryId)
      );

    return (
      category?.name ||
      "Uncategorized"
    );
  };


  // =========================================================
  // SEARCH
  // =========================================================

  const filteredProducts =
    products.filter((product) => {

      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return true;
      }

      return (

        product.name
          ?.toLowerCase()
          .includes(value) ||

        product.description
          ?.toLowerCase()
          .includes(value) ||

        getCategoryName(
          product.category_id
        )
          .toLowerCase()
          .includes(value)

      );

    });


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <main className="admin-products-page">

        <div className="admin-products-loading">

          <RefreshCw size={28} />

          <h2>
            Loading products
          </h2>

          <p>
            Fetching products from backend...
          </p>

        </div>

      </main>
    );
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (

    <main className="admin-products-page">

      <div className="admin-products-container">


        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="products-page-header">

          <div className="products-header-left">

            <button
              type="button"
              className="back-dashboard-btn"
              onClick={() =>
                navigate(
                  "/admin/dashboard"
                )
              }
            >

              <ArrowLeft size={17} />

              Dashboard

            </button>


            <span className="products-eyebrow">

              CATALOG MANAGEMENT

            </span>


            <h1>
              Products
            </h1>


            <p>
              Manage products, prices,
              stock and availability.
            </p>

          </div>


          <button
            type="button"
            className="add-product-btn"
            onClick={openAddModal}
          >

            <Plus size={18} />

            Add Product

          </button>

        </header>


        {/* =====================================================
            ERROR ALERT
        ====================================================== */}

        {error && (

          <div className="products-alert error-alert">

            <XCircle size={18} />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >

              <X size={16} />

            </button>

          </div>

        )}


        {/* =====================================================
            SUCCESS ALERT
        ====================================================== */}

        {success && (

          <div className="products-alert success-alert">

            <CheckCircle2 size={18} />

            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >

              <X size={16} />

            </button>

          </div>

        )}


        {/* =====================================================
            TOOLBAR
        ====================================================== */}

        <section className="products-toolbar">

          <div className="products-count">

            <Package size={18} />

            <div>

              <strong>
                {products.length}
              </strong>

              <span>
                Products from database
              </span>

            </div>

          </div>


          <div className="product-search">

            <Search size={17} />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search products..."
            />

            {search && (

              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >

                <X size={15} />

              </button>

            )}

          </div>

        </section>


        {/* =====================================================
            PRODUCT TABLE
        ====================================================== */}

        <section className="products-table-card">

          <div className="products-table-wrapper">

            <table className="products-table">

              <thead>

                <tr>

                  <th>
                    PRODUCT
                  </th>

                  <th>
                    CATEGORY
                  </th>

                  <th>
                    PRICE
                  </th>

                  <th>
                    STOCK
                  </th>

                  <th>
                    STATUS
                  </th>

                  <th>
                    ACTIONS
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredProducts.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="empty-products"
                    >

                      <Package size={38} />

                      <h3>
                        No products found
                      </h3>

                      <p>
                        No products match
                        your search.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredProducts.map(
                    (product) => {

                      const stock =
                        Number(
                          product.stock_quantity ?? 0
                        );
                      const imageSource =
                        getProductImageSource(product);


                      return (

                        <tr
                          key={product.id}
                        >


                          {/* PRODUCT */}

                          <td>

                            <div className="product-name-cell">

                              <ProductImageThumbnail
                                key={`${product.id}-${imageSource}`}
                                src={imageSource}
                                name={product.name}
                              />


                              <div>

                                <strong>
                                  {product.name}
                                </strong>

                                <span>
                                  ID #{product.id}
                                </span>

                              </div>

                            </div>

                          </td>


                          {/* CATEGORY */}

                          <td>

                            <span className="category-text">

                              {getCategoryName(
                                product.category_id
                              )}

                            </span>

                          </td>


                          {/* PRICE */}

                          <td>

                            <strong className="price-text">

                              ₹
                              {Number(
                                product.price || 0
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </strong>

                          </td>


                          {/* STOCK */}

                          <td>

                            <span
                              className={
                                stock <= 5
                                  ? "stock-low"
                                  : "stock-good"
                              }
                            >

                              {stock}

                            </span>

                          </td>


                          {/* STATUS */}

                          {/* <td>

                            <button
                              type="button"
                              className={
                                product.is_active
                                  ? "status-badge active"
                                  : "status-badge inactive"
                              }
                              onClick={() =>
                                handleToggleStatus(
                                  product
                                )
                              }
                            >

                              {product.is_active ? (

                                <>

                                  <CheckCircle2
                                    size={14}
                                  />

                                  Active

                                </>

                              ) : (

                                <>

                                  <XCircle
                                    size={14}
                                  />

                                  Inactive

                                </>

                              )}

                            </button>

                          </td> */}

                          <td>
  <select
    className={`status-select ${
      product.is_active ? "active" : "inactive"
    }`}
    value={String(product.is_active)}
    onChange={(e) =>
      handleToggleStatus(product, e.target.value === "true")
    }
  >
    <option value="true">Active</option>
    <option value="false">Inactive</option>
  </select>
</td>


                          {/* ACTIONS */}

                          <td>

                            <div className="product-actions">

                              <button
                                type="button"
                                className="table-action edit"
                                onClick={() =>
                                  openEditModal(
                                    product
                                  )
                                }
                                title="Edit product"
                              >

                                <Pencil
                                  size={16}
                                />

                              </button>


                              <button
                                type="button"
                                className="table-action delete"
                                onClick={() =>
                                  handleDelete(
                                    product
                                  )
                                }
                                title="Delete product"
                              >

                                <Trash2
                                  size={16}
                                />

                              </button>

                            </div>

                          </td>

                        </tr>

                      );

                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>


      {/* =====================================================
          ADD / EDIT MODAL
      ====================================================== */}

      {showModal && (

        <div className="product-modal-overlay">

          <div className="product-modal">


            {/* MODAL HEADER */}

            <div className="product-modal-header">

              <div>

                <span>

                  {editingProduct
                    ? "PRODUCT EDITOR"
                    : "NEW PRODUCT"}

                </span>

                <h2>

                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}

                </h2>

              </div>


              <button
                type="button"
                className="modal-close-btn"
                onClick={closeModal}
              >

                <X size={20} />

              </button>

            </div>


            {/* FORM */}

            <form
              className="product-form"
              onSubmit={handleSubmit}
            >


              {/* PRODUCT NAME */}

              <div className="form-group full">

                <label>
                  Product Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Product name"
                />

              </div>


              {/* CATEGORY */}

              <div className="form-group">

                <label>
                  Category
                </label>

                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                >

                  <option value="">
                    Select category
                  </option>

                  {categories.map(
                    (category) => (

                      <option
                        key={category.id}
                        value={category.id}
                      >

                        {category.name}

                      </option>

                    )
                  )}

                </select>

              </div>


              {/* PRICE */}

              <div className="form-group">

                <label>
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Price"
                />

              </div>


              {/* STOCK */}

              <div className="form-group">

                <label>
                  Stock Quantity
                </label>

                <input
                  type="number"
                  name="stock_quantity"
                  value={
                    form.stock_quantity
                  }
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="Stock quantity"
                />

              </div>


              {/* PRODUCT STATUS */}

              <div className="form-group">

                <label>
                  Product Status
                </label>

                <select
                  name="is_active"
                  value={String(form.is_active)}
                  onChange={handleChange}
                >

                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Inactive
                  </option>

                </select>

              </div>


              {/* DESCRIPTION */}

              <div className="form-group full">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={handleChange}
                  rows="5"
                  placeholder="Product description"
                />

              </div>


              {/* PRODUCT IMAGE */}

              <div className="form-group full">

                {(productImagePreview ||
                  (editingProduct &&
                    getProductImageSource(editingProduct))) && (
                  <div className="product-image-preview">
                    <span className="product-image-preview-label">
                      {productImage
                        ? "Image Preview"
                        : "Current Image"}
                    </span>
                    <img
                      src={
                        productImagePreview ||
                        getProductImageSource(editingProduct)
                      }
                      alt={
                        productImage
                          ? "Selected product image preview"
                          : `${editingProduct.name} current image`
                      }
                    />
                  </div>
                )}

                <label htmlFor="product-image">
                  {editingProduct
                    ? "Choose New Image (optional)"
                    : "Product Image"}
                </label>

                <input
                  ref={productImageInputRef}
                  id="product-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleProductImageChange}
                />

                {productImage && (

                  <p className="selected-image-name">

                    Selected:{" "}
                    {productImage.name}

                  </p>

                )}

              </div>


              {/* FORM BUTTONS */}

              <div className="product-form-actions">

                <button
                  type="button"
                  className="cancel-product-btn"
                  onClick={closeModal}
                  disabled={saving}
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  className="save-product-btn"
                  disabled={saving}
                >

                  {saving ? (

                    <>

                      <RefreshCw
                        size={16}
                        className="button-spin"
                      />

                      Saving...

                    </>

                  ) : (

                    editingProduct
                      ? "Update Product"
                      : "Create Product"

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
};


export default AdminProducts;
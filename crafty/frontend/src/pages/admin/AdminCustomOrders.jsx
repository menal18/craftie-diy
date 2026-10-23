
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  X,
  Package,
  Clock,
  CheckCircle,
  ClipboardList,
} from "lucide-react";

import {
  getAdminCustomOrders,
  updateCustomOrderStatus,
  setCustomOrderQuote,
} from "../../services/adminService";
import api from "../../services/api";

import "./AdminCustomOrders.css";

const resolveReferenceImageUrl = (imageUrl) => {
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return null;
  }

  const value = imageUrl.trim();

  try {
    const absoluteUrl = new URL(value);
    return ["http:", "https:"].includes(absoluteUrl.protocol)
      ? absoluteUrl.href
      : null;
  } catch {
    try {
      const backendOrigin = new URL(
        api.defaults.baseURL,
        window.location.origin
      ).origin;
      const resolvedUrl = new URL(value, `${backendOrigin}/`);

      return ["http:", "https:"].includes(resolvedUrl.protocol)
        ? resolvedUrl.href
        : null;
    } catch {
      return null;
    }
  }
};

const AdminCustomOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [failedReferenceImage, setFailedReferenceImage] = useState(null);

  const [quotedPrice, setQuotedPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [savingQuote, setSavingQuote] = useState(false);
  // ==================== LOAD ====================

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminCustomOrders();
      setOrders(response.custom_orders || response.orders || []);
    } catch (err) {
      console.error("Custom order loading error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message || "Failed to load custom orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // ==================== HELPERS ====================


const formatDate = (date) => {
  if (!date) return "-";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return value.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};


  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "-";
    }

    const value = Number(price);

    if (!Number.isFinite(value)) {
      return "-";
    }

    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "quoted") {
      return "quoted";
    }

    if (
      value === "completed" ||
      value === "delivered" ||
      value === "approved" ||
      value === "accepted"
    ) {
      return "completed";
    }

    if (value === "cancelled" || value === "rejected") {
      return "cancelled";
    }

    if (value === "processing" || value === "in_progress") {
      return "processing";
    }

    return "pending";
  };

  const getStatusLabel = (status) => {
    if (!status) return "Pending";

    return String(status)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // ==================== FILTER ====================

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        String(order.id || "")
          .toLowerCase()
          .includes(searchText) ||
        order.customer?.name?.toLowerCase().includes(searchText) ||
        order.customer?.email?.toLowerCase().includes(searchText) ||
        order.customer?.phone?.toLowerCase().includes(searchText) ||
        order.title?.toLowerCase().includes(searchText) ||
        order.description?.toLowerCase().includes(searchText);

      const orderStatus = String(order.status || "pending").toLowerCase();

      const matchesStatus =
        statusFilter === "all" || orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // ==================== COUNTS ====================

  const totalCount = orders.length;

  const pendingCount = orders.filter(
    (order) => String(order.status || "pending").toLowerCase() === "pending"
  ).length;

  const processingCount = orders.filter(
    (order) => String(order.status || "").toLowerCase() === "processing"
  ).length;

  const completedCount = orders.filter((order) =>
    ["completed", "delivered", "approved"].includes(
      String(order.status || "").toLowerCase()
    )
  ).length;
  const rawReferenceImageUrl = selectedOrder?.reference_image_url;
  const referenceImageUrl = resolveReferenceImageUrl(rawReferenceImageUrl);
  const deliveryAddress = selectedOrder?.delivery_address;

  // ==================== VIEW ====================

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setQuotedPrice(
      order.estimated_price != null
        ? String(order.estimated_price)
        : ""
    );
    setAdminNotes(order.admin_notes || "");
    setPreviewImage(null);
    setFailedReferenceImage(null);
    setError("");
    setSuccess("");
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setPreviewImage(null);
    setFailedReferenceImage(null);
  };

  // ==================== STATUS ====================


  const handleSaveQuote = async () => {
    if (!selectedOrder || savingQuote) return;

    const price = Number(quotedPrice);

    if (quotedPrice.trim() === "" || !Number.isFinite(price) || price < 0) {
      setError("Please enter a valid quotation price.");
      setSuccess("");
      return;
    }

    try {
      setSavingQuote(true);
      setError("");
      setSuccess("");

      const response = await setCustomOrderQuote(
        selectedOrder.id,
        price,
        adminNotes
      );

      const updatedOrder = response.custom_order || response.order || {
        ...selectedOrder,
        estimated_price: price,
        admin_notes: adminNotes,
        status: "quoted",
      };

      const finalOrder = {
        ...selectedOrder,
        ...updatedOrder,
        estimated_price: updatedOrder.estimated_price ?? price,
        admin_notes: updatedOrder.admin_notes ?? adminNotes,
        status: updatedOrder.status || "quoted",
      };

      setOrders((previous) =>
        previous.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, ...finalOrder }
            : order
        )
      );

      setSelectedOrder(finalOrder);
      setQuotedPrice(String(finalOrder.estimated_price));
      setAdminNotes(finalOrder.admin_notes || "");
      setSuccess(
        response?.notification_created === true
          ? response.message || "Quotation saved and customer notified."
          : response?.notification_created === false
            ? "Quotation saved, but customer notification could not be confirmed."
            : response?.message || "Quotation saved successfully."
      );
    } catch (err) {
      console.error("Save custom order quotation error:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to save quotation price."
      );
    } finally {
      setSavingQuote(false);
    }
  };







  const handleStatusChange = async (order, newStatus) => {
    try {
      setUpdatingStatus(true);
      setError("");
      setSuccess("");

      const response = await updateCustomOrderStatus(order.id, newStatus);

      const updatedOrder = response.custom_order ||
        response.order || {
          ...order,
          status: newStatus,
        };

      setOrders((previous) =>
        previous.map((item) =>
          item.id === order.id
            ? {
                ...item,
                ...updatedOrder,
                status: newStatus,
              }
            : item
        )
      );

      setSelectedOrder((previous) =>
        previous
          ? {
              ...previous,
              ...updatedOrder,
              status: newStatus,
            }
          : previous
      );

      setSuccess("Custom order status updated successfully");
    } catch (err) {
      console.error("Custom order status error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message || "Failed to update order status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==================== UI ====================

  return (
    <div className="admin-custom-orders-page">
      {/* HEADER */}

      <div className="admin-custom-orders-header">
        <div>
          <h1>Custom Orders</h1>
          <p>Manage customer custom order requests and their status.</p>
        </div>
      </div>

      {error && !selectedOrder && (
        <div className="custom-order-alert error">{error}</div>
      )}
      {success && !selectedOrder && (
        <div className="custom-order-alert success">{success}</div>
      )}

      {/* SUMMARY */}

      <div className="custom-order-summary-grid">
        <div className="custom-order-summary-card">
          <div className="custom-order-summary-icon">
            <ClipboardList size={20} />
          </div>
          <div>
            <span>Total Requests</span>
            <strong>{totalCount}</strong>
          </div>
        </div>

        <div className="custom-order-summary-card">
          <div className="custom-order-summary-icon">
            <Clock size={20} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="custom-order-summary-card">
          <div className="custom-order-summary-icon">
            <Package size={20} />
          </div>
          <div>
            <span>Processing</span>
            <strong>{processingCount}</strong>
          </div>
        </div>

        <div className="custom-order-summary-card">
          <div className="custom-order-summary-icon">
            <CheckCircle size={20} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
        </div>
      </div>

      {/* FILTER */}

      <div className="custom-order-filter-bar">
        <div className="custom-order-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search customer, email, phone or order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="custom-order-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="quoted">Quoted</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="processing">Processing</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* TABLE */}

      <div className="custom-order-table-card">
        {loading ? (
          <div className="custom-order-loading">
            Loading custom orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="custom-order-empty">
            <ClipboardList size={42} />
            <h3>No custom orders found</h3>
            <p>Customer custom order requests will appear here.</p>
          </div>
        ) : (
          <div className="custom-order-table-wrapper">
            <table className="custom-order-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Request</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong className="custom-order-id">
                        #{order.id}
                      </strong>
                    </td>

                    <td>
                      <div className="custom-order-customer">
                        <strong>{order.customer?.name || "Customer"}</strong>

                        {order.customer?.email && (
                          <span>{order.customer.email}</span>
                        )}

                        {order.customer?.phone && (
                          <span>{order.customer.phone}</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="custom-order-request">
                        <strong>{order.title || "Custom Request"}</strong>
                        <span>{order.description || "-"}</span>
                      </div>
                    </td>

                    <td>{formatDate(order.created_at)}</td>

                    <td>
                      <select
                        className={`custom-order-status-select ${getStatusClass(
                          order.status
                        )}`}
                        value={order.status || "pending"}
                        onChange={(e) =>
                          handleStatusChange(order, e.target.value)
                        }
                        disabled={updatingStatus}
                      >
                        <option value="pending">Pending</option>
                        <option value="quoted">Quoted</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="processing">Processing</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td>
                      <button
                        className="custom-order-view-btn"
                        onClick={() => handleViewOrder(order)}
                        title="View details"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}

      {selectedOrder && (
        <div className="custom-order-modal-overlay">
          <div className="custom-order-modal">
            <div className="custom-order-modal-header">
              <div>
                <h2>Custom Order #{selectedOrder.id}</h2>
                <p>Customer custom order details</p>
              </div>

              <button
                className="custom-order-modal-close"
                onClick={closeOrderModal}
                aria-label="Close order details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="custom-order-details">
              <div className="custom-order-detail-section">
                <h3>Customer</h3>

                <div className="custom-order-detail-grid">
                  <div>
                    <span>Name</span>
                    <strong>{selectedOrder.customer?.name || "-"}</strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>{selectedOrder.customer?.email || "-"}</strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>{selectedOrder.customer?.phone || "-"}</strong>
                  </div>
                </div>
              </div>

              <div className="custom-order-detail-section">
                <h3>Delivery Address</h3>
                {deliveryAddress ? (
                  <div className="custom-order-delivery-address-card">
                    <strong>{deliveryAddress.full_name || "Recipient"}</strong>
                    <p>{deliveryAddress.address_line1}</p>
                    {deliveryAddress.address_line2 && (
                      <p>{deliveryAddress.address_line2}</p>
                    )}
                    <p>
                      {[
                        deliveryAddress.city,
                        deliveryAddress.state,
                        deliveryAddress.postal_code,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p>{deliveryAddress.country}</p>
                    <p>{deliveryAddress.phone}</p>
                  </div>
                ) : (
                  <div className="custom-order-delivery-address-card missing">
                    Address not provided
                  </div>
                )}
              </div>

              <div className="custom-order-detail-section">
                <h3>Request Details</h3>

                <div className="custom-order-detail-grid">
                  <div>
                    <span>Title</span>
                    <strong>{selectedOrder.title || "-"}</strong>
                  </div>

                  <div>
                    <span>Created</span>
                    <strong>{formatDate(selectedOrder.created_at)}</strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>{getStatusLabel(selectedOrder.status)}</strong>
                  </div>
                </div>
              </div>

              <div className="custom-order-detail-section">
                <h3>Description</h3>
                <p className="custom-order-description">
                  {selectedOrder.description || "No description provided."}
                </p>
              </div>

              <div className="custom-order-detail-section">
                <h3>Customization Details</h3>
                <p className="custom-order-description">
                  {selectedOrder.customization_details ||
                    "No customization details provided."}
                </p>
              </div>

              {/* <div className="custom-order-detail-section">
                <h3>Order Information</h3>

                <div className="custom-order-detail-grid">
                  <div>
                    <span>Quantity</span>
                    <strong>{selectedOrder.quantity ?? "-"}</strong>
                  </div>

                  <div>
                    <span>Estimated Price</span>
                    <strong>
                      {formatPrice(selectedOrder.estimated_price)}
                    </strong>
                  </div>
                </div>
              </div> */}



              <div className="custom-order-detail-section">
                <h3>Order Information</h3>

                <div className="custom-order-detail-grid">
                  <div>
                    <span>Quantity</span>
                    <strong>{selectedOrder.quantity ?? "-"}</strong>
                  </div>

                  <div>
                    <span>Current Estimated Price</span>
                    <strong>
                      {selectedOrder.estimated_price == null ||
                      selectedOrder.estimated_price === "" ? (
                        <span className="custom-order-empty-price">
                          No quotation set
                        </span>
                      ) : (
                        formatPrice(selectedOrder.estimated_price)
                      )}
                    </strong>
                  </div>
                </div>

                <div className="custom-order-quote-form">
                  <label htmlFor="custom-order-quote-price">
                    Quotation Price (₹)
                  </label>
                  <input
                    id="custom-order-quote-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quotedPrice}
                    onChange={(event) => setQuotedPrice(event.target.value)}
                    placeholder="Enter price for this custom order"
                    disabled={savingQuote}
                  />

                  <label htmlFor="custom-order-admin-notes">
                    Message to Customer (Optional)
                  </label>
                  <textarea
                    id="custom-order-admin-notes"
                    value={adminNotes}
                    onChange={(event) => setAdminNotes(event.target.value)}
                    placeholder="Add details about the quotation"
                    rows={3}
                    disabled={savingQuote}
                  />

                  <button
                    type="button"
                    className="custom-order-quote-submit"
                    onClick={handleSaveQuote}
                    disabled={savingQuote}
                  >
                    {savingQuote ? "Saving Quote..." : "Save & Send Quote"}
                  </button>

                  {error && (
                    <div className="custom-order-alert error" role="alert">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="custom-order-alert success" role="status">
                      {success}
                    </div>
                  )}
                </div>
              </div>

              {/* REFERENCE IMAGE */}

              <div className="custom-order-detail-section">
                <h3>Reference Image</h3>
                {!referenceImageUrl ||
                failedReferenceImage === referenceImageUrl ? (
                  <div className="custom-order-image-placeholder">
                    {rawReferenceImageUrl
                      ? "The reference image URL is invalid or the image could not be loaded."
                      : "No reference image was provided."}
                  </div>
                ) : (
                  <>
                    <img
                      src={referenceImageUrl}
                      alt="Custom order reference"
                      className="custom-order-reference-image"
                      onClick={() => setPreviewImage(referenceImageUrl)}
                      onError={() =>
                        setFailedReferenceImage(referenceImageUrl)
                      }
                      title="Click to view full image"
                    />

                    <p className="image-preview-hint">
                      Click image to view full size
                    </p>
                  </>
                )}
              </div>

              {selectedOrder.admin_notes && (
                <div className="custom-order-detail-section">
                  <h3>Admin Notes</h3>
                  <p className="custom-order-description">
                    {selectedOrder.admin_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN IMAGE PREVIEW */}

      {previewImage && (
        <div
          className="custom-image-lightbox"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="custom-image-close"
            onClick={() => setPreviewImage(null)}
            aria-label="Close image preview"
          >
            <X size={28} />
          </button>

          <img
            src={previewImage}
            alt="Full-size custom order reference"
            className="custom-image-full"
            onClick={(event) => event.stopPropagation()}
            onError={() => {
              setFailedReferenceImage(previewImage);
              setPreviewImage(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminCustomOrders;

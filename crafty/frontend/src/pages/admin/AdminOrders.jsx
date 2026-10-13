import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  X,
  ShoppingBag,
  IndianRupee,
  CalendarDays,
  CreditCard,
  User,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getAdminOrders,
  updateAdminOrderStatus,
  updateAdminPaymentStatus,
} from "../../services/adminService";
import api from "../../services/api";

import "./AdminOrders.css";


const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
];

const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
];


function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}


function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function formatDateTime(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatStatus(status) {
  if (!status) return "-";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}


function getStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}


function getStatusIcon(status) {
  const value = String(status || "").toLowerCase();

  if (value === "completed" || value === "delivered") {
    return <CheckCircle2 size={14} />;
  }

  if (value === "shipped") {
    return <Truck size={14} />;
  }

  if (value === "processing") {
    return <PackageCheck size={14} />;
  }

  if (value === "cancelled" || value === "failed") {
    return <XCircle size={14} />;
  }

  return <Clock size={14} />;
}

function getOrderItemImageUrl(item) {
  const images = Array.isArray(item?.product?.images)
    ? item.product.images
    : Array.isArray(item?.images)
      ? item.images
      : [];
  const selectedImage =
    images.find((image) => image?.is_primary) || images[0];
  const imageUrl =
    item?.image_url ||
    item?.product_image_url ||
    item?.product?.image_url ||
    selectedImage?.image_url;

  if (!imageUrl || typeof imageUrl !== "string") return null;
  if (/^(data:|blob:)/i.test(imageUrl)) return imageUrl;

  try {
    return new URL(
      imageUrl,
      api.defaults.baseURL || window.location.origin,
    ).href;
  } catch {
    return imageUrl;
  }
}

function AdminOrderItemImage({ item, onPreview, className = "" }) {
  const imageUrl = getOrderItemImageUrl(item);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const imageAvailable = imageUrl && failedImageUrl !== imageUrl;

  return (
    <div className={`admin-order-item-image ${className}`.trim()}>
      {imageAvailable ? (
        <button
          type="button"
          className="admin-order-image-button"
          onClick={() =>
            onPreview({
              src: imageUrl,
              alt: item.product_name || item.product?.name || "Product",
            })
          }
          aria-label={`Preview ${item.product_name || item.product?.name || "product"} image`}
        >
          <img
            src={imageUrl}
            alt={item.product_name || item.product?.name || "Product"}
            onError={() => setFailedImageUrl(imageUrl)}
          />
        </button>
      ) : (
        <ShoppingBag size={20} aria-label="Product image unavailable" />
      )}

    </div>
  );
}


export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [updatingOrder, setUpdatingOrder] = useState(null);

  const [updatingPayment, setUpdatingPayment] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!imagePreview) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setImagePreview(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imagePreview]);


  // =========================================================
  // LOAD ORDERS
  // =========================================================

  const loadOrders = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await getAdminOrders();

      const orderList = response?.orders ?? [];

      setOrders(Array.isArray(orderList) ? orderList : []);

    } catch (err) {
      console.error("ADMIN ORDERS ERROR:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
          state: {
            from: "/admin/orders",
          },
        });

        return;
      }

      if (err.response?.status === 403) {
        setError("You do not have admin permission.");
        return;
      }

      setError(
        err.response?.data?.message ||
        "Failed to load orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);


  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadOrders();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadOrders]);


  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !searchValue ||
        String(order.order_number || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(order.id || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(order.user_id || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        String(order.order_status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);


  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

  const handleOrderStatusChange = async (
    orderId,
    newStatus
  ) => {
    try {
      setUpdatingOrder(orderId);

      const response = await updateAdminOrderStatus(
        orderId,
        newStatus
      );

      const updatedOrder = response?.order;

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? updatedOrder || {
                ...order,
                order_status: newStatus,
              }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(
          updatedOrder || {
            ...selectedOrder,
            order_status: newStatus,
          }
        );
      }

    } catch (err) {
      console.error(
        "UPDATE ORDER STATUS ERROR:",
        err
      );

      alert(
        err.response?.data?.message ||
        "Failed to update order status."
      );
    } finally {
      setUpdatingOrder(null);
    }
  };


  // =========================================================
  // UPDATE PAYMENT STATUS
  // =========================================================

  const handlePaymentStatusChange = async (
    orderId,
    newStatus
  ) => {
    try {
      setUpdatingPayment(orderId);

      const response =
        await updateAdminPaymentStatus(
          orderId,
          newStatus
        );

      const updatedOrder = response?.order;

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? updatedOrder || {
                ...order,
                payment_status: newStatus,
              }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(
          updatedOrder || {
            ...selectedOrder,
            payment_status: newStatus,
          }
        );
      }

    } catch (err) {
      console.error(
        "UPDATE PAYMENT STATUS ERROR:",
        err
      );

      alert(
        err.response?.data?.message ||
        "Failed to update payment status."
      );
    } finally {
      setUpdatingPayment(null);
    }
  };


  // =========================================================
  // SUMMARY
  // =========================================================

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) =>
      String(order.order_status).toLowerCase() ===
      "pending"
  ).length;

  const completedOrders = orders.filter(
    (order) =>
      String(order.order_status).toLowerCase() ===
      "completed"
  ).length;

  const cancelledOrders = orders.filter(
    (order) =>
      String(order.order_status).toLowerCase() ===
      "cancelled"
  ).length;


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="admin-orders-page">
        <div className="admin-orders-loading">
          <RefreshCw
            size={30}
            className="spin"
          />

          <p>Loading orders...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="admin-orders-page">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="admin-orders-header">

        <div>

          <button
            className="admin-back-button"
            onClick={() =>
              navigate("/admin/dashboard")
            }
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <h1>Orders</h1>

          <p>
            Manage customer orders and payment
            status.
          </p>

        </div>


        <button
          className="admin-refresh-button"
          onClick={() => loadOrders(false)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "spin" : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>


      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <div className="admin-orders-error">
          <XCircle size={18} />
          {error}
        </div>
      )}


      {/* ================================================= */}
      {/* SUMMARY CARDS */}
      {/* ================================================= */}

      <div className="admin-order-summary">

        <div className="admin-order-summary-card">

          <div className="summary-icon">
            <ShoppingBag size={21} />
          </div>

          <div>
            <span>Total Orders</span>
            <strong>{totalOrders}</strong>
          </div>

        </div>


        <div className="admin-order-summary-card">

          <div className="summary-icon">
            <Clock size={21} />
          </div>

          <div>
            <span>Pending</span>
            <strong>{pendingOrders}</strong>
          </div>

        </div>


        <div className="admin-order-summary-card">

          <div className="summary-icon">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Completed</span>
            <strong>{completedOrders}</strong>
          </div>

        </div>


        <div className="admin-order-summary-card">

          <div className="summary-icon">
            <XCircle size={21} />
          </div>

          <div>
            <span>Cancelled</span>
            <strong>{cancelledOrders}</strong>
          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* TOOLBAR */}
      {/* ================================================= */}

      <div className="admin-orders-toolbar">

        <div className="admin-order-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search order number, ID or user ID..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="admin-order-filter"
        >
          <option value="all">
            All statuses
          </option>

          {ORDER_STATUSES.map((status) => (
            <option
              key={status}
              value={status}
            >
              {formatStatus(status)}
            </option>
          ))}
        </select>

      </div>


      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="admin-orders-table-wrapper">

        <table className="admin-orders-table">

          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Order Status</th>
              <th>Action</th>
            </tr>
          </thead>


          <tbody>

            {filteredOrders.length === 0 ? (

              <tr>
                <td
                  colSpan="7"
                  className="admin-orders-empty"
                >
                  <ShoppingBag size={35} />

                  <strong>
                    No orders found
                  </strong>

                  <span>
                    Try changing your search
                    or filter.
                  </span>
                </td>
              </tr>

            ) : (

              filteredOrders.map((order) => (

                <tr key={order.id}>

                  {/* ORDER */}

                  <td>

                    <div className="order-number">
                      #{order.order_number}
                    </div>

                    <small>
                      ID: {order.id}
                    </small>

                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div className="admin-order-list-images">
                        {order.items.slice(0, 4).map((item) => (
                          <AdminOrderItemImage
                            key={item.id}
                            item={item}
                            className="admin-order-list-image"
                            onPreview={setImagePreview}
                          />
                        ))}
                        {order.items.length > 4 && (
                          <span className="admin-order-list-image-count">
                            +{order.items.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                  </td>


                  {/* CUSTOMER */}

                  <td>

                    <div className="customer-cell">

                      <div className="customer-avatar">
                        <User size={16} />
                      </div>

                      <div>

                        <strong>
                          User #{order.user_id}
                        </strong>

                        <small>
                          Address #{order.address_id || "-"}
                        </small>

                      </div>

                    </div>

                  </td>


                  {/* DATE */}

                  <td>

                    <div className="date-cell">

                      <CalendarDays size={15} />

                      <span>
                        {formatDate(
                          order.created_at
                        )}
                      </span>

                    </div>

                  </td>


                  {/* TOTAL */}

                  <td>

                    <strong className="order-total">
                      {formatCurrency(
                        order.total
                      )}
                    </strong>

                  </td>


                  {/* PAYMENT */}

                  <td>

                    <div className="payment-cell">

                      <div>
                        <CreditCard size={14} />

                        <span>
                          {order.payment_method ||
                            "-"}
                        </span>
                      </div>

                      <span
                        className={`status-badge payment-${getStatusClass(
                          order.payment_status
                        )}`}
                      >
                        {getStatusIcon(
                          order.payment_status
                        )}

                        {formatStatus(
                          order.payment_status
                        )}
                      </span>

                    </div>

                  </td>


                  {/* ORDER STATUS */}

                  <td>

                    <select
                      className={`status-select ${getStatusClass(
                        order.order_status
                      )}`}
                      value={
                        order.order_status || ""
                      }
                      disabled={
                        updatingOrder ===
                        order.id
                      }
                      onChange={(event) =>
                        handleOrderStatusChange(
                          order.id,
                          event.target.value
                        )
                      }
                    >

                      {ORDER_STATUSES.map(
                        (status) => (

                          <option
                            key={status}
                            value={status}
                          >
                            {formatStatus(status)}
                          </option>

                        )
                      )}

                    </select>

                  </td>


                  {/* ACTION */}

                  <td>

                    <button
                      className="view-order-button"
                      onClick={() =>
                        setSelectedOrder(order)
                      }
                    >
                      <Eye size={16} />
                      View
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>


      {/* ================================================= */}
      {/* ORDER DETAILS MODAL */}
      {/* ================================================= */}

      {selectedOrder && (

        <div
          className="admin-order-modal-overlay"
          onClick={() =>
            setSelectedOrder(null)
          }
        >

          <div
            className="admin-order-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-order-modal-header">

              <div>

                <span>
                  Order details
                </span>

                <h2>
                  #{selectedOrder.order_number}
                </h2>

              </div>


              <button
                className="modal-close-button"
                onClick={() =>
                  setSelectedOrder(null)
                }
              >
                <X size={20} />
              </button>

            </div>


            <div className="admin-order-modal-body">

              
{/* 
              <div className="order-detail-section">

                <h3>
                  <User size={17} />
                  Customer
                </h3>

                <div className="order-detail-grid">

                  <div>
                    <span>User ID</span>
                    <strong>
                      #{selectedOrder.user_id}
                    </strong>
                  </div>

                  <div>
                    <span>Address ID</span>
                    <strong>
                      #
                      {selectedOrder.address_id ||
                        "-"}
                    </strong>
                  </div>

                </div>

              </div> */}

              {/* CUSTOMER */}

<div className="order-detail-section">

  <h3>
    <User size={17} />
    Customer
  </h3>

  <div className="order-detail-grid">

    <div>
      <span>Name</span>
      <strong>
        {selectedOrder.customer?.name || "-"}
      </strong>
    </div>

    <div>
      <span>Email</span>
      <strong>
        {selectedOrder.customer?.email || "-"}
      </strong>
    </div>

    <div>
      <span>Phone</span>
      <strong>
        {selectedOrder.customer?.phone || "-"}
      </strong>
    </div>

    <div>
      <span>User ID</span>
      <strong>
        #{selectedOrder.customer?.id || selectedOrder.user_id}
      </strong>
    </div>

  </div>

</div>


{/* DELIVERY ADDRESS */}

<div className="order-detail-section">

  <h3>
    <Truck size={17} />
    Delivery Address
  </h3>

  {selectedOrder.address ? (
    <div className="order-address-box">

      <strong>
        {selectedOrder.address.full_name}
      </strong>

      <span>
        {selectedOrder.address.phone}
      </span>

      <span>
        {selectedOrder.address.address_line1}
      </span>

      {selectedOrder.address.address_line2 && (
        <span>
          {selectedOrder.address.address_line2}
        </span>
      )}

      <span>
        {selectedOrder.address.city},{" "}
        {selectedOrder.address.state}
      </span>

      <span>
        {selectedOrder.address.postal_code}
      </span>

      <span>
        {selectedOrder.address.country}
      </span>

    </div>
  ) : (
    <p className="order-empty-text">
      Delivery address not available.
    </p>
  )}

</div>

              {/* ORDER INFORMATION */}

              <div className="order-detail-section">

                <h3>
                  <ShoppingBag size={17} />
                  Order Information
                </h3>

                <div className="order-detail-grid">

                  <div>
                    <span>Order ID</span>
                    <strong>
                      #{selectedOrder.id}
                    </strong>
                  </div>

                  <div>
                    <span>Created</span>
                    <strong>
                      {formatDateTime(
                        selectedOrder.created_at
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Updated</span>
                    <strong>
                      {formatDateTime(
                        selectedOrder.updated_at
                      )}
                    </strong>
                  </div>
{/* 
                  <div>
                    <span>Payment Method</span>
                    <strong>
                      {selectedOrder.payment_method ||
                        "-"}
                    </strong>
                  </div> */}

                </div>

              </div>

              {/* ORDER ITEMS */}

<div className="order-detail-section">

  <h3>
    <ShoppingBag size={17} />
    Order Items
  </h3>

  {selectedOrder.items?.length > 0 ? (

    <div className="admin-order-items">

      {selectedOrder.items.map((item) => (

        <div
          className="admin-order-item"
          key={item.id}
        >

          <AdminOrderItemImage
            item={item}
            onPreview={setImagePreview}
          />

          <div className="admin-order-item-info">

            <strong>
              {item.product_name}
            </strong>

            <span>
              Quantity: {item.quantity}
            </span>

            <span>
              Unit Price:{" "}
              {formatCurrency(item.unit_price)}
            </span>

          </div>

          <strong className="admin-order-item-total">
            {formatCurrency(item.subtotal)}
          </strong>

        </div>

      ))}

    </div>

  ) : (

    <p className="order-empty-text">
      No order items available.
    </p>

  )}

</div>


              {/* PRICE */}
{/* 
              <div className="order-detail-section">

                <h3>
                  <IndianRupee size={17} />
                  Order Summary
                </h3>

                <div className="order-price-list">

                  <div>
                    <span>Subtotal</span>
                    <strong>
                      {formatCurrency(
                        selectedOrder.subtotal
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Delivery</span>
                    <strong>
                      {formatCurrency(
                        selectedOrder.delivery_charge
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Discount</span>
                    <strong>
                      -{" "}
                      {formatCurrency(
                        selectedOrder.discount
                      )}
                    </strong>
                  </div>

                  <div className="order-final-total">
                    <span>Total</span>
                    <strong>
                      {formatCurrency(
                        selectedOrder.total
                      )}
                    </strong>
                  </div>

                </div>

              </div> */}

              {/* ORDER SUMMARY */}

<div className="order-detail-section">

  <h3>
    <IndianRupee size={17} />
    Order Summary
  </h3>

  <div className="order-price-list">

    <div>
      <span>Subtotal</span>

      <strong>
        {formatCurrency(
          selectedOrder.subtotal
        )}
      </strong>
    </div>

    <div>
      <span>Promotion Discount</span>

      <strong className="discount-value">
        -{" "}
        {formatCurrency(
          selectedOrder.promotion_discount
        )}
      </strong>
    </div>

    {selectedOrder.promo_code && (
      <div>
        <span>
          Promo Code
          <small className="promo-code-label">
            {" "}
            ({selectedOrder.promo_code})
          </small>
        </span>

        <strong className="discount-value">
          -{" "}
          {formatCurrency(
            selectedOrder.promo_code_discount
          )}
        </strong>
      </div>
    )}

    <div>
      <span>Total Discount</span>

      <strong className="discount-value">
        -{" "}
        {formatCurrency(
          selectedOrder.discount
        )}
      </strong>
    </div>

    <div>
      <span>Delivery</span>

      <strong>
        {Number(
          selectedOrder.delivery_charge || 0
        ) === 0
          ? "FREE"
          : formatCurrency(
              selectedOrder.delivery_charge
            )}
      </strong>
    </div>

    <div className="order-final-total">

      <span>Total</span>

      <strong>
        {formatCurrency(
          selectedOrder.total
        )}
      </strong>

    </div>

  </div>

</div>



{/* PAYMENT INFORMATION */}

<div className="order-detail-section">

  <h3>
    <CreditCard size={17} />
    Payment Information
  </h3>

  <div className="order-detail-grid">

    <div>
      <span>Payment Method</span>

      <strong>
        {selectedOrder.payment_method || "-"}
      </strong>
    </div>

    <div>
      <span>Payment Status</span>

      <strong>
        {formatStatus(
          selectedOrder.payment_status
        )}
      </strong>
    </div>

  </div>

</div>
              {/* ORDER STATUS */}

              <div className="order-detail-section">

                <h3>
                  <PackageCheck size={17} />
                  Order Status
                </h3>

                <select
                  className={`modal-status-select ${getStatusClass(
                    selectedOrder.order_status
                  )}`}
                  value={
                    selectedOrder.order_status ||
                    ""
                  }
                  disabled={
                    updatingOrder ===
                    selectedOrder.id
                  }
                  onChange={(event) =>
                    handleOrderStatusChange(
                      selectedOrder.id,
                      event.target.value
                    )
                  }
                >

                  {ORDER_STATUSES.map(
                    (status) => (

                      <option
                        key={status}
                        value={status}
                      >
                        {formatStatus(status)}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* PAYMENT STATUS */}

              <div className="order-detail-section">

                <h3>
                  <CreditCard size={17} />
                  Payment Status
                </h3>

                <select
                  className={`modal-status-select ${getStatusClass(
                    selectedOrder.payment_status
                  )}`}
                  value={
                    selectedOrder.payment_status ||
                    ""
                  }
                  disabled={
                    updatingPayment ===
                    selectedOrder.id
                  }
                  onChange={(event) =>
                    handlePaymentStatusChange(
                      selectedOrder.id,
                      event.target.value
                    )
                  }
                >

                  {PAYMENT_STATUSES.map(
                    (status) => (

                      <option
                        key={status}
                        value={status}
                      >
                        {formatStatus(status)}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* NOTES */}

              {selectedOrder.notes && (

                <div className="order-detail-section">

                  <h3>
                    Notes
                  </h3>

                  <p className="order-notes">
                    {selectedOrder.notes}
                  </p>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

      {imagePreview && (
        <div
          className="admin-image-preview-overlay"
          role="presentation"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="admin-image-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Product image preview"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="admin-image-preview-close"
              onClick={() => setImagePreview(null)}
              aria-label="Close image preview"
            >
              <X size={22} />
            </button>
            <img src={imagePreview.src} alt={imagePreview.alt} />
          </div>
        </div>
      )}

    </div>
  );
}
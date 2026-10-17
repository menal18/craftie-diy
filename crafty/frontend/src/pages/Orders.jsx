

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock3,
  Package,
  PackageCheck,
  Pencil,
  RefreshCw,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

import {
  getMyOrders,
  getMyOrder,
  cancelOrder,
} from "../services/orderService";
import {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
} from "../services/reviewService";
import { getProfile } from "../services/authService";
import api from "../services/api";

import "./Orders.css";

const getOrderItemImage = (item) => {
  const images = [
    ...(Array.isArray(item?.product?.images) ? item.product.images : []),
    ...(Array.isArray(item?.images) ? item.images : []),
  ];
  const primaryImage = images.find((image) => image?.is_primary) || images[0];

  const imageUrl =
    item?.image_url ||
    item?.product_image_url ||
    item?.product?.image_url ||
    primaryImage?.image_url ||
    null

  if (!imageUrl || typeof imageUrl !== "string") return null;
  if (/^(data:|blob:)/i.test(imageUrl)) return imageUrl;

  try {
    return new URL(imageUrl, api.defaults.baseURL || window.location.origin).href;
  } catch {
    return imageUrl;
  }
};

const getOrderItems = (order) =>
  Array.isArray(order?.items) ? order.items : [];

const OrderItemImage = ({ item, productName }) => {
  const imageUrl = getOrderItemImage(item);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const imageFailed = failedImageUrl === imageUrl;

  return (
    <div className="order-item-image">
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={productName || "Product"}
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        <div className="order-item-image-placeholder">
          <Package size={21} />
        </div>
      )}
    </div>
  );
};

const getStoredUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id == null ? null : String(user.id);
  } catch {
    return null;
  }
};

const canReviewOrder = (status) =>
  ["delivered", "completed"].includes(
    String(status || "").trim().toLowerCase(),
  );

const TRACKING_STAGES = [
  { status: "pending", label: "Order Placed", Icon: Clock3 },
  { status: "confirmed", label: "Confirmed", Icon: CheckCircle2 },
  { status: "processing", label: "Processing", Icon: Package },
  { status: "shipped", label: "Shipped", Icon: Truck },
  { status: "out_for_delivery", label: "Out for Delivery", Icon: Truck },
  { status: "delivered", label: "Delivered", Icon: PackageCheck },
];

const getTrackingStageIndex = (status) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (normalizedStatus === "completed" || normalizedStatus === "delivered") {
    return TRACKING_STAGES.length - 1;
  }

  return TRACKING_STAGES.findIndex(
    (stage) => stage.status === normalizedStatus,
  );
};

const getReviewErrorMessage = (error) => {
  const status = error.response?.status;
  const message = error.response?.data?.message;

  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) {
    return message || "Reviews are available only for delivered or completed orders.";
  }
  if (status === 409) return message || "You have already reviewed this product.";
  if (message) return message;
  if (!error.response) return "Unable to reach the server. Check your connection and try again.";
  return "Unable to save your review. Please try again.";
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [productReviews, setProductReviews] = useState({});
  const [reviewLookupLoading, setReviewLookupLoading] = useState(false);
  const [reviewFormProductId, setReviewFormProductId] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusyProductId, setReviewBusyProductId] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState(null);
  const [orderFeedback, setOrderFeedback] = useState(null);
  const mountedRef = useRef(false);
  const ordersRequestIdRef = useRef(0);
  const reviewsRequestIdRef = useRef(0);
  const trackingRequestIdRef = useRef(0);

  const loadProductReviews = useCallback(async (orderList) => {
    const requestId = ++reviewsRequestIdRef.current;
    const productIds = [
      ...new Set(
        orderList
          .flatMap(getOrderItems)
          .map((item) => item.product_id)
          .filter((productId) => productId != null)
          .map(String),
      ),
    ];

    if (productIds.length === 0) {
      if (
        mountedRef.current &&
        requestId === reviewsRequestIdRef.current
      ) {
        setProductReviews({});
        setReviewLookupLoading(false);
      }
      return;
    }

    if (mountedRef.current) setReviewLookupLoading(true);

    try {
      let currentUserId = getStoredUserId();
      let currentUserError = "";
      if (currentUserId === null && localStorage.getItem("token")) {
        try {
          const profileResponse = await getProfile();
          const profileUser = profileResponse?.user || profileResponse;
          currentUserId =
            profileUser?.id == null ? null : String(profileUser.id);
          if (currentUserId === null) {
            currentUserError =
              "Unable to identify your account. Please log in again.";
          }
        } catch (profileError) {
          currentUserError =
            profileError.response?.data?.message ||
            "Unable to verify your account for review management.";
        }
      }

      const results = await Promise.allSettled(
        productIds.map((productId) => getProductReviews(productId)),
      );

      const nextReviews = {};
      results.forEach((result, index) => {
        const productId = productIds[index];
        if (result.status === "fulfilled") {
          if (!Array.isArray(result.value?.reviews)) {
            nextReviews[productId] = {
              review: null,
              error: "The server returned an unexpected reviews response.",
            };
            return;
          }

          const ownReview =
            currentUserId === null
              ? null
              : result.value.reviews.find(
                  (review) => String(review.user_id) === currentUserId,
                ) || null;

          nextReviews[productId] = {
            review: ownReview,
            error: currentUserError,
          };
        } else {
          nextReviews[productId] = {
            review: null,
            error:
              currentUserError ||
              result.reason?.response?.data?.message ||
              "Unable to check whether you have reviewed this product.",
          };
        }
      });

      if (mountedRef.current && requestId === reviewsRequestIdRef.current) {
        setProductReviews(nextReviews);
      }
    } catch (reviewsError) {
      console.error("Failed to load product reviews:", reviewsError);
      if (mountedRef.current && requestId === reviewsRequestIdRef.current) {
        setProductReviews(
          Object.fromEntries(
            productIds.map((productId) => [
              productId,
              {
                review: null,
                error:
                  reviewsError.response?.data?.message ||
                  "Unable to load review information. Please try again.",
              },
            ]),
          ),
        );
      }
    } finally {
      if (mountedRef.current && requestId === reviewsRequestIdRef.current) {
        setReviewLookupLoading(false);
      }
    }
  }, []);

  const loadOrders = useCallback(async (isRefresh = false) => {
    const requestId = ++ordersRequestIdRef.current;
    try {
      if (mountedRef.current) {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError("");
        setOrderFeedback(null);
      }

      const response = await getMyOrders();
      if (!Array.isArray(response?.orders)) {
        throw new Error("The server returned an unexpected orders response.");
      }
      if (!mountedRef.current || requestId !== ordersRequestIdRef.current) {
        return;
      }

      const orderList = response.orders;
      setOrders(orderList);
      await loadProductReviews(orderList);
    } catch (err) {
      console.error("Failed to load orders:", err);
      if (mountedRef.current && requestId === ordersRequestIdRef.current) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load your orders. Please try again.",
        );
      }
    } finally {
      if (mountedRef.current && requestId === ordersRequestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [loadProductReviews]);

  useEffect(() => {
    mountedRef.current = true;
    void loadOrders();

    return () => {
      mountedRef.current = false;
      ordersRequestIdRef.current += 1;
      reviewsRequestIdRef.current += 1;
      trackingRequestIdRef.current += 1;
    };
  }, [loadOrders]);

  const toggleOrder = (orderId) => {
    setExpandedOrder((current) =>
      current === orderId ? null : orderId
    );
  };

  const loadOrderTracking = async (orderId) => {
    const requestId = ++trackingRequestIdRef.current;
    setTrackingError("");
    setTrackingLoading(true);

    try {
      const response = await getMyOrder(orderId);
      if (
        !mountedRef.current ||
        requestId !== trackingRequestIdRef.current
      ) {
        return;
      }

      if (!response?.order || String(response.order.id) !== String(orderId)) {
        throw new Error("The server returned an unexpected order response.");
      }

      setTrackingOrder(response.order);
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          String(order.id) === String(orderId) ? response.order : order,
        ),
      );
    } catch (trackingLoadError) {
      if (
        mountedRef.current &&
        requestId === trackingRequestIdRef.current
      ) {
        setTrackingError(
          trackingLoadError.response?.data?.message ||
            trackingLoadError.message ||
            "Unable to load tracking information. Please try again.",
        );
      }
    } finally {
      if (
        mountedRef.current &&
        requestId === trackingRequestIdRef.current
      ) {
        setTrackingLoading(false);
      }
    }
  };

  const toggleOrderTracking = (orderId) => {
    if (String(trackingOrderId) === String(orderId)) {
      trackingRequestIdRef.current += 1;
      setTrackingOrderId(null);
      setTrackingOrder(null);
      setTrackingError("");
      setTrackingLoading(false);
      return;
    }

    setTrackingOrderId(orderId);
    setTrackingOrder(null);
    void loadOrderTracking(orderId);
  };

  const refreshOrderTracking = () => {
    if (trackingOrderId !== null) void loadOrderTracking(trackingOrderId);
  };

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingOrder(orderId);
      setOrderFeedback(null);

      const response = await cancelOrder(orderId);

      const updatedOrder = response?.order;
      if (!mountedRef.current) return;

      if (updatedOrder) {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === orderId
              ? updatedOrder
              : order
          )
        );
        setOrderFeedback({
          type: "success",
          message: response?.message || "Order cancelled successfully.",
        });
      } else {
        await loadOrders(true);
        if (mountedRef.current) {
          setOrderFeedback({
              type: "success",
              message: response?.message || "Order cancelled successfully.",
          });
        }
      }
    } catch (err) {
      console.error("Failed to cancel order:", err);
      if (mountedRef.current) {
        setOrderFeedback({
          type: "error",
          message:
              err?.response?.data?.message || "Unable to cancel this order.",
        });
      }
    } finally {
      if (mountedRef.current) setCancellingOrder(null);
    }
  };

  const openReviewForm = (productId) => {
    const existingReview = productReviews[String(productId)]?.review;
    setReviewFormProductId(String(productId));
    setReviewRating(Number(existingReview?.rating) || 0);
    setReviewComment(existingReview?.comment || "");
    setReviewFeedback(null);
  };

  const closeReviewForm = () => {
    setReviewFormProductId(null);
    setReviewRating(0);
    setReviewComment("");
    setReviewFeedback(null);
  };

  const handleReviewSubmit = async (event, productId) => {
    event.preventDefault();
    const key = String(productId);
    const existingReview = productReviews[key]?.review;

    if (!localStorage.getItem("token")) {
      setReviewFeedback({
        productId: key,
        type: "error",
        message: "Please log in to submit a review.",
      });
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewFeedback({
        productId: key,
        type: "error",
        message: "Please select a rating from 1 to 5 stars.",
      });
      return;
    }

    try {
      setReviewBusyProductId(key);
      setReviewFeedback(null);

      const response = existingReview
        ? await updateReview(existingReview.id, reviewRating, reviewComment)
        : await addReview(productId, reviewRating, reviewComment);

      if (!mountedRef.current) return;
      const savedReview = response?.review;
      if (
        !savedReview ||
        typeof savedReview !== "object" ||
        String(savedReview.product_id) !== key
      ) {
        throw new Error("The server returned an unexpected review response.");
      }

      setProductReviews((current) => ({
        ...current,
        [key]: {
          ...current[key],
          review: savedReview,
          error: "",
        },
      }));
      closeReviewForm();
      setReviewFeedback({
        productId: key,
        type: "success",
        message: existingReview
          ? "Your review has been updated."
          : "Thank you. Your review has been submitted.",
      });
    } catch (reviewError) {
      if (mountedRef.current) {
        setReviewFeedback({
          productId: key,
          type: "error",
          message: getReviewErrorMessage(reviewError),
        });
      }
    } finally {
      if (mountedRef.current) setReviewBusyProductId(null);
    }
  };

  const handleReviewDelete = async (productId) => {
    const key = String(productId);
    const existingReview = productReviews[key]?.review;
    if (!existingReview || !window.confirm("Delete your review for this product?")) {
      return;
    }

    try {
      setReviewBusyProductId(key);
      setReviewFeedback(null);
      const response = await deleteReview(existingReview.id);
      if (!mountedRef.current) return;
      if (!response || typeof response.message !== "string") {
        throw new Error("The server returned an unexpected delete response.");
      }
      setProductReviews((current) => ({
        ...current,
        [key]: { ...current[key], review: null, error: "" },
      }));
      if (reviewFormProductId === key) closeReviewForm();
      setReviewFeedback({
        productId: key,
        type: "success",
        message: "Your review has been deleted.",
      });
    } catch (reviewError) {
      if (mountedRef.current) {
        setReviewFeedback({
          productId: key,
          type: "error",
          message: getReviewErrorMessage(reviewError),
        });
      }
    } finally {
      if (mountedRef.current) setReviewBusyProductId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatStatus = (status) => {
    if (typeof status !== "string" || !status.trim()) {
      return "Pending";
    }

    return status
      .trim()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "status-delivered";

      case "cancelled":
        return "status-cancelled";

      case "shipped":
      case "out_for_delivery":
        return "status-shipped";

      case "processing":
      case "confirmed":
        return "status-processing";

      case "pending":
      default:
        return "status-pending";
    }
  };

  const canCancel = (status) => {
    return !["delivered", "cancelled"].includes(
      String(status || "").trim().toLowerCase(),
    );
  };

  const eligibleReviewOrderByProduct = {};
  orders.forEach((order) => {
    if (!canReviewOrder(order.order_status)) return;
    getOrderItems(order).forEach((item) => {
      if (item.product_id == null) return;
      const productId = String(item.product_id);
      if (!eligibleReviewOrderByProduct[productId]) {
        eligibleReviewOrderByProduct[productId] = order.id;
      }
    });
  });

  if (loading) {
    return (
      <main className="orders-page">
        <div className="orders-container">
          <div className="orders-loading">
            <div className="orders-spinner" />
            <p>Loading your orders...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">

      <div className="orders-container">

        {/* Header */}
        <section className="orders-header">

          <div>
            <p className="orders-eyebrow">
              YOUR SHOPPING JOURNEY
            </p>

            <h1>My Orders</h1>

            <p className="orders-subtitle">
              Keep track of your CraftieDIY orders,
              deliveries and purchases.
            </p>
          </div>

          <button
            type="button"
            className="refresh-orders-btn"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

        </section>

        {/* Error */}
        {error && (
          <div className="orders-error">
            <XCircle size={20} />

            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() => loadOrders()}
            >
              Try Again
            </button>
          </div>
        )}

        {orderFeedback && (
          <div
            className={`orders-action-feedback orders-action-feedback-${orderFeedback.type}`}
            role={orderFeedback.type === "error" ? "alert" : "status"}
          >
            {orderFeedback.message}
          </div>
        )}

        {/* Empty */}
        {!error && orders.length === 0 && (
          <section className="orders-empty">

            <div className="empty-order-icon">
              <ShoppingBag size={40} />
            </div>

            <h2>No orders yet</h2>

            <p>
              You haven't placed an order yet.
              Discover something beautiful from
              our collection.
            </p>

            <Link
              to="/shop"
              className="browse-products-btn"
            >
              Browse Products
              <ArrowRight size={18} />
            </Link>

          </section>
        )}

        {/* Orders */}
        {orders.length > 0 && (
          <section className="orders-list">

            <div className="orders-count">
              <span>
                {orders.length}{" "}
                {orders.length === 1
                  ? "Order"
                  : "Orders"}
              </span>
            </div>

            <div className="orders-grid">

              {orders.map((order) => {
                const isExpanded =
                  expandedOrder === order.id;
                const isTracking =
                  String(trackingOrderId) === String(order.id);
                const displayedTrackingOrder =
                  isTracking && trackingOrder ? trackingOrder : order;
                const trackingStatus = String(
                  displayedTrackingOrder.order_status || "pending",
                ).trim().toLowerCase();
                const trackingStageIndex =
                  getTrackingStageIndex(trackingStatus);
                const isTrackingCancelled =
                  trackingStatus === "cancelled";
                const trackingHasUnknownStatus =
                  trackingStageIndex < 0 && !isTrackingCancelled;

                const items = getOrderItems(order);

                return (
                  <article
                    className={`order-card${
                      isExpanded
                        ? " order-card-expanded"
                        : ""
                    }`}
                    key={order.id}
                  >

                    {/* Order Top */}
                    <div className="order-card-top">

                      <div className="order-main-info">

                        <div className="order-icon">
                          <Package size={22} />
                        </div>

                        <div>
                          <p className="order-label">
                            Order Number
                          </p>

                          <h2>
                            {order.order_number ||
                              `#${order.id}`}
                          </h2>
                        </div>

                      </div>

                      <div
                        className={`order-status ${getStatusClass(
                          order.order_status
                        )}`}
                      >
                        {formatStatus(
                          order.order_status
                        )}
                      </div>

                    </div>

                    {/* Order Meta */}
                    <div className="order-meta">

                      <div className="order-meta-item">
                        <CalendarDays size={16} />

                        <div>
                          <span>Ordered on</span>
                          <strong>
                            {formatDate(
                              order.created_at
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="order-meta-item">
                        <Package size={16} />

                        <div>
                          <span>Items</span>
                          <strong>
                            {items.reduce(
                              (total, item) =>
                                total +
                                Number(
                                  item.quantity || 0
                                ),
                              0
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="order-meta-item">
                        <div className="meta-price-symbol">
                          ₹
                        </div>

                        <div>
                          <span>Total</span>
                          <strong>
                            ₹
                            {Number(
                              order.total || 0
                            ).toFixed(2)}
                          </strong>
                        </div>
                      </div>

                    </div>

                    <section className="order-tracking">
                      <button
                        type="button"
                        className="track-order-btn"
                        onClick={() => toggleOrderTracking(order.id)}
                        aria-expanded={isTracking}
                        aria-controls={`order-tracking-${order.id}`}
                      >
                        <Truck size={16} />
                        {isTracking ? "Hide Tracking" : "Track Order"}
                      </button>

                      {isTracking && (
                        <div
                          className="order-tracking-panel"
                          id={`order-tracking-${order.id}`}
                        >
                          <div className="order-tracking-heading">
                            <div>
                              <h3>
                                Tracking {displayedTrackingOrder.order_number ||
                                  `#${displayedTrackingOrder.id}`}
                              </h3>
                              <p>
                                Ordered{" "}
                                {formatDate(displayedTrackingOrder.created_at)}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="refresh-tracking-btn"
                              onClick={refreshOrderTracking}
                              disabled={trackingLoading}
                            >
                              <RefreshCw
                                size={15}
                                className={trackingLoading ? "spin" : ""}
                              />
                              <span>Refresh</span>
                            </button>
                          </div>

                          {trackingLoading ? (
                            <div className="tracking-state" role="status">
                              <div className="orders-spinner" />
                              <p>Refreshing order status...</p>
                            </div>
                          ) : trackingError ? (
                            <div className="tracking-error" role="alert">
                              <p>{trackingError}</p>
                              <button
                                type="button"
                                onClick={refreshOrderTracking}
                              >
                                Try Again
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="tracking-current-status">
                                <span>Current status</span>
                                <strong
                                  className={`order-status ${getStatusClass(
                                    displayedTrackingOrder.order_status,
                                  )}`}
                                >
                                  {formatStatus(
                                    displayedTrackingOrder.order_status,
                                  )}
                                </strong>
                              </div>

                              {isTrackingCancelled ? (
                                <div className="tracking-terminal tracking-cancelled">
                                  <XCircle size={20} />
                                  <p>
                                    This order was cancelled. Tracking updates are no longer available.
                                  </p>
                                </div>
                              ) : trackingHasUnknownStatus ? (
                                <div className="tracking-terminal" role="status">
                                  <p>
                                    Tracking stages are unavailable for this order status.
                                  </p>
                                </div>
                              ) : (
                                <ol
                                  className="tracking-timeline"
                                  aria-label="Order progress"
                                >
                                  {TRACKING_STAGES.map((stage, index) => {
                                    const isComplete =
                                      index < trackingStageIndex;
                                    const isCurrent =
                                      index === trackingStageIndex;
                                    const StageIcon = isComplete
                                      ? CheckCircle2
                                      : stage.Icon || Circle;

                                    return (
                                      <li
                                        key={stage.status}
                                        className={[
                                          "tracking-stage",
                                          isComplete ? "is-complete" : "",
                                          isCurrent ? "is-current" : "",
                                        ]
                                          .filter(Boolean)
                                          .join(" ")}
                                        aria-current={isCurrent ? "step" : undefined}
                                      >
                                        <span className="tracking-stage-icon">
                                          <StageIcon size={18} />
                                        </span>
                                        <span>{stage.label}</span>
                                      </li>
                                    );
                                  })}
                                </ol>
                              )}

                              {String(
                                displayedTrackingOrder.payment_status || "",
                              ).toLowerCase() === "failed" && (
                                <div className="tracking-terminal tracking-payment-failed">
                                  <XCircle size={18} />
                                  <p>
                                    Payment status: Failed. Contact support if you need help with this order.
                                  </p>
                                </div>
                              )}

                              <div className="tracking-items">
                                <h4>Items in this order</h4>
                                {getOrderItems(displayedTrackingOrder).length ? (
                                  <ul>
                                    {getOrderItems(displayedTrackingOrder).map(
                                      (item) => (
                                        <li key={item.id}>
                                          <span>
                                            {item.product_name || "Product"} ×{" "}
                                            {Number(item.quantity || 0)}
                                          </span>
                                          <strong>
                                            ₹
                                            {Number(
                                              item.subtotal ??
                                                Number(item.unit_price || 0) *
                                                  Number(item.quantity || 0),
                                            ).toFixed(2)}
                                          </strong>
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                ) : (
                                  <p className="no-items">
                                    No item details available.
                                  </p>
                                )}
                                <div className="tracking-order-total">
                                  <span>Order total</span>
                                  <strong>
                                    ₹
                                    {Number(
                                      displayedTrackingOrder.total || 0,
                                    ).toFixed(2)}
                                  </strong>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </section>

                    {/* Expanded Items */}
                    {isExpanded && (
                      <div className="order-items">

                        <div className="order-items-header">
                          <h3>Order Items</h3>
                        </div>

                        {items.length === 0 ? (
                          <p className="no-items">
                            No item details available.
                          </p>
                        ) : (
                          <div className="order-items-grid">
                            {items.map((item) => {
                              const productKey =
                                item.product_id == null
                                  ? null
                                  : String(item.product_id);
                              const canReviewItem =
                                productKey !== null &&
                                eligibleReviewOrderByProduct[productKey] === order.id;
                              const reviewEntry = productKey
                                ? productReviews[productKey]
                                : null;
                              const isReviewFormOpen =
                                reviewFormProductId === productKey;

                              return (
                                <div
                                  className="order-item"
                                  key={item.id}
                                >

                                <OrderItemImage
                                  item={item}
                                  productName={item.product_name}
                                />

                                <div className="order-item-info">

                                  <h4>
                                    {item.product_name ||
                                      "Product"}
                                  </h4>

                                  <p>
                                    Quantity:{" "}
                                    {item.quantity}
                                  </p>

                                </div>

                                <div className="order-item-price">
                                  <span>
                                    ₹
                                    {Number(
                                      item.unit_price || 0
                                    ).toFixed(2)}
                                  </span>

                                  <strong>
                                    ₹
                                    {Number(
                                      item.subtotal || 0
                                    ).toFixed(2)}
                                  </strong>
                                </div>

                                  {canReviewItem && (
                                    <div className="order-item-review">
                                      {reviewLookupLoading && !reviewEntry ? (
                                        <span className="order-review-loading">
                                          Checking review...
                                        </span>
                                      ) : reviewEntry?.error ? (
                                        <div className="order-review-lookup-error">
                                          <span>{reviewEntry.error}</span>
                                          <button
                                            type="button"
                                            onClick={() => loadProductReviews(orders)}
                                          >
                                            Retry
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="order-review-actions">
                                            <button
                                              type="button"
                                              className="order-review-button"
                                              onClick={() =>
                                                openReviewForm(item.product_id)
                                              }
                                              disabled={
                                                reviewBusyProductId === productKey
                                              }
                                            >
                                              {reviewEntry?.review ? (
                                                <>
                                                  <Pencil size={15} />
                                                  Edit Review
                                                </>
                                              ) : (
                                                <>
                                                  <Star size={15} />
                                                  Write a Review
                                                </>
                                              )}
                                            </button>
                                            {reviewEntry?.review && (
                                              <button
                                                type="button"
                                                className="order-review-delete"
                                                onClick={() =>
                                                  handleReviewDelete(item.product_id)
                                                }
                                                disabled={
                                                  reviewBusyProductId === productKey
                                                }
                                              >
                                                <Trash2 size={15} />
                                                Delete
                                              </button>
                                            )}
                                          </div>

                                          {reviewEntry?.review && (
                                            <div className="order-review-preview">
                                              <div
                                                className="order-review-preview-stars"
                                                role="img"
                                                aria-label={`${reviewEntry.review.rating} out of 5 stars`}
                                              >
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                  <Star
                                                    key={star}
                                                    size={14}
                                                    fill={
                                                      star <=
                                                      Number(reviewEntry.review.rating)
                                                        ? "currentColor"
                                                        : "none"
                                                    }
                                                  />
                                                ))}
                                              </div>
                                              {reviewEntry.review.comment && (
                                                <p>{reviewEntry.review.comment}</p>
                                              )}
                                            </div>
                                          )}

                                          {isReviewFormOpen && (
                                            <form
                                              className="order-review-form"
                                              onSubmit={(event) =>
                                                handleReviewSubmit(
                                                  event,
                                                  item.product_id,
                                                )
                                              }
                                            >
                                              <fieldset>
                                                <legend>Your rating</legend>
                                                <div className="order-review-stars">
                                                  {[1, 2, 3, 4, 5].map((rating) => (
                                                    <label
                                                      key={rating}
                                                      className={
                                                        rating <= reviewRating
                                                          ? "is-selected"
                                                          : ""
                                                      }
                                                    >
                                                      <input
                                                        type="radio"
                                                        name={`rating-${productKey}`}
                                                        value={rating}
                                                        aria-label={`${rating} ${
                                                          rating === 1
                                                            ? "star"
                                                            : "stars"
                                                        }`}
                                                        checked={reviewRating === rating}
                                                        onChange={() =>
                                                          setReviewRating(rating)
                                                        }
                                                        required
                                                      />
                                                      <Star
                                                        size={22}
                                                        fill={
                                                          rating <= reviewRating
                                                            ? "currentColor"
                                                            : "none"
                                                        }
                                                        aria-hidden="true"
                                                      />
                                                    </label>
                                                  ))}
                                                </div>
                                              </fieldset>

                                              <label
                                                className="order-review-comment-label"
                                                htmlFor={`review-comment-${productKey}`}
                                              >
                                                Comment <span>(optional)</span>
                                              </label>
                                              <textarea
                                                id={`review-comment-${productKey}`}
                                                rows={3}
                                                maxLength={2000}
                                                value={reviewComment}
                                                onChange={(event) =>
                                                  setReviewComment(event.target.value)
                                                }
                                                placeholder="Share your experience with this product"
                                              />

                                              {reviewFeedback?.productId ===
                                                productKey && (
                                                <p
                                                  className={`order-review-feedback order-review-feedback-${reviewFeedback.type}`}
                                                  role={
                                                    reviewFeedback.type === "error"
                                                      ? "alert"
                                                      : "status"
                                                  }
                                                >
                                                  {reviewFeedback.message}
                                                </p>
                                              )}

                                              <div className="order-review-form-actions">
                                                <button
                                                  type="submit"
                                                  disabled={
                                                    reviewBusyProductId === productKey
                                                  }
                                                >
                                                  {reviewBusyProductId === productKey
                                                    ? "Saving..."
                                                    : reviewEntry?.review
                                                      ? "Save Review"
                                                      : "Submit Review"}
                                                </button>
                                                <button
                                                  type="button"
                                                  className="order-review-cancel"
                                                  onClick={closeReviewForm}
                                                  disabled={
                                                    reviewBusyProductId === productKey
                                                  }
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </form>
                                          )}

                                          {reviewFeedback?.productId ===
                                            productKey &&
                                            !isReviewFormOpen && (
                                              <p
                                                className={`order-review-feedback order-review-feedback-${reviewFeedback.type}`}
                                                role={
                                                  reviewFeedback.type === "error"
                                                    ? "alert"
                                                    : "status"
                                                }
                                              >
                                                {reviewFeedback.message}
                                              </p>
                                            )}
                                        </>
                                      )}
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="order-breakdown">

                          <div>
                            <span>Subtotal</span>
                            <strong>
                              ₹
                              {Number(
                                order.subtotal || 0
                              ).toFixed(2)}
                            </strong>
                          </div>

                          <div>
                            <span>Delivery</span>
                            <strong>
                              ₹
                              {Number(
                                order.delivery_charge || 0
                              ).toFixed(2)}
                            </strong>
                          </div>

                          {Number(order.discount || 0) >
                            0 && (
                            <div className="discount-row">
                              <span>Discount</span>
                              <strong>
                                -₹
                                {Number(
                                  order.discount
                                ).toFixed(2)}
                              </strong>
                            </div>
                          )}

                          <div className="order-total-row">
                            <span>Total</span>
                            <strong>
                              ₹
                              {Number(
                                order.total || 0
                              ).toFixed(2)}
                            </strong>
                          </div>

                        </div>

                      </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="order-card-bottom">

                      <div className="payment-info">
                        <span>Payment</span>
                        <strong>
                          {order.payment_method ||
                            "COD"}
                        </strong>
                      </div>

                      <div className="order-actions">

                        {canCancel(
                          order.order_status
                        ) && (
                          <button
                            type="button"
                            className="cancel-order-btn"
                            onClick={() =>
                              handleCancelOrder(
                                order.id
                              )
                            }
                            disabled={
                              cancellingOrder ===
                              order.id
                            }
                          >
                            <XCircle size={16} />

                            {cancellingOrder ===
                            order.id
                              ? "Cancelling..."
                              : "Cancel Order"}
                          </button>
                        )}

                        <button
                          type="button"
                          className="view-order-btn"
                          onClick={() =>
                            toggleOrder(order.id)
                          }
                        >
                          {isExpanded
                            ? "Hide Details"
                            : "View Details"}

                          {isExpanded ? (
                            <ChevronUp size={17} />
                          ) : (
                            <ChevronDown size={17} />
                          )}
                        </button>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>

          </section>
        )}

      </div>

    </main>
  );
};

export default Orders;
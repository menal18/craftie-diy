import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CheckCircle,
  Package,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

import "./OrderSuccess.css";

const OrderSuccess = () => {
  const location = useLocation();

  const order = location.state?.order;

  const orderNumber = order?.order_number || "Your order";
  const total = Number(order?.total || 0);

  return (
    <main className="order-success-page">
      <div className="order-success-container">

        {/* Success Icon */}
        <div className="success-icon">
          <CheckCircle size={58} strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <p className="success-eyebrow">
          ORDER CONFIRMED
        </p>

        <h1>
          Thank you for your order!
        </h1>

        <p className="success-description">
          Your order has been placed successfully.
          We’ll carefully prepare your CraftieDIY order for you.
        </p>

        {/* Order Card */}
        <div className="order-confirmation-card">

          <div className="confirmation-header">
            <div className="confirmation-icon">
              <Package size={22} />
            </div>

            <div>
              <span>Order Number</span>
              <strong>{orderNumber}</strong>
            </div>
          </div>

          <div className="confirmation-divider" />

          <div className="confirmation-details">

            <div className="confirmation-detail">
              <span>Payment Method</span>
              <strong>
                {order?.payment_method || "COD"}
              </strong>
            </div>

            <div className="confirmation-detail">
              <span>Payment Status</span>
              <strong className="status-text">
                {order?.payment_status || "Pending"}
              </strong>
            </div>

            <div className="confirmation-detail">
              <span>Order Status</span>
              <strong>
                {order?.order_status || "Pending"}
              </strong>
            </div>

            <div className="confirmation-detail">
              <span>Total Amount</span>
              <strong className="total-amount">
                ₹{total.toFixed(2)}
              </strong>
            </div>

          </div>
        </div>

        {/* What's Next */}
        <div className="next-section">

          <h2>What happens next?</h2>

          <div className="next-steps">

            <div className="next-step">
              <div className="step-number">1</div>

              <div>
                <h3>Order received</h3>
                <p>
                  We have received your order successfully.
                </p>
              </div>
            </div>

            <div className="next-step">
              <div className="step-number">2</div>

              <div>
                <h3>Preparing your order</h3>
                <p>
                  Our team will carefully prepare your items.
                </p>
              </div>
            </div>

            <div className="next-step">
              <div className="step-number">3</div>

              <div>
                <h3>Ready for delivery</h3>
                <p>
                  Your order will be prepared for delivery.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="success-actions">

          <Link
            to="/shop"
            className="continue-shopping-btn"
          >
            <ShoppingBag size={18} />
            Continue Shopping
          </Link>

          <Link
            to="/orders"
            className="view-orders-btn"
          >
            View My Orders
            <ArrowRight size={18} />
          </Link>

        </div>

      </div>
    </main>
  );
};

export default OrderSuccess;
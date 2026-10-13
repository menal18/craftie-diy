import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Check,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../services/cartService";

import { useCart } from "../context/CartContext";

import "./Cart.css";

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { refreshCart } = useCart();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const token = localStorage.getItem("token");

    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    // Guest
    if (!token) {
      setError("Please login to view your cart.");
      setLoading(false);
      return;
    }

    // Admin
    if (user?.role?.toLowerCase() === "admin") {
      setError("Admin accounts cannot use the customer cart.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getCart();

      // Supports both:
      // { cart: {...} }
      // and direct cart object
      const cartData = data?.cart || data;

      setCart(cartData || null);
    } catch (err) {
      console.error("Get cart error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setError("Please login to view your cart.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to load your cart."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setActionLoading(true);
      setMessage("");
      setError("");

      const data = await updateCartItem(
        item.id,
        newQuantity
      );

      const updatedCart = data?.cart || data;

      setCart(updatedCart);

      await refreshCart();

      setMessage(
        data?.message ||
          "Cart updated successfully."
      );
    } catch (err) {
      console.error("Update cart error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update cart."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setActionLoading(true);
      setMessage("");
      setError("");

      const data = await removeCartItem(itemId);

      const updatedCart = data?.cart || data;

      setCart(updatedCart);

      await refreshCart();

      setMessage(
        data?.message ||
          "Product removed from cart."
      );
    } catch (err) {
      console.error("Remove cart item error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to remove product."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearCart = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear your cart?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setMessage("");
      setError("");

      const data = await clearCart();

      const updatedCart = data?.cart || data;

      setCart(updatedCart);

      await refreshCart();

      setMessage(
        data?.message ||
          "Cart cleared successfully."
      );
    } catch (err) {
      console.error("Clear cart error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to clear cart."
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="cart-page">
        <div className="cart-message">
          <div className="cart-loader"></div>
          <p>Loading your cart...</p>
        </div>
      </main>
    );
  }

  if (error && !cart) {
    return (
      <main className="cart-page">
        <div className="cart-message">
          <ShoppingBag size={45} />

          <h2>Your Cart</h2>

          <p>{error}</p>

          {error.toLowerCase().includes("login") && (
            <Link
              to="/login"
              className="cart-primary-button"
            >
              Login
            </Link>
          )}

          <Link
            to="/shop"
            className="cart-secondary-button"
          >
            <ArrowLeft size={15} />
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  const items = cart?.items || [];

  const totalItems = Number(
    cart?.total_items ??
      items.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      )
  );

  const subtotal = Number(
    cart?.subtotal ??
      items.reduce((total, item) => {
        const product = item.product || {};

        const price = Number(
          item.unit_price ??
            item.price ??
            product.price ??
            0
        );

        const quantity = Number(
          item.quantity || 0
        );

        return total + price * quantity;
      }, 0)
  );

  /*
   =========================================
   EMPTY CART
  =========================================
  */

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <section className="cart-header">
          <div>
            <span>YOUR SHOPPING BAG</span>

            <h1>Your Cart</h1>
          </div>
        </section>

        <div className="empty-cart">
          <div className="empty-cart-icon">
            <ShoppingBag size={40} />
          </div>

          <h2>Your cart is empty</h2>

          <p>
            Discover something beautiful from
            our handmade collection.
          </p>

          <Link
            to="/shop"
            className="cart-primary-button"
          >
            Explore Collection
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  /*
   =========================================
   CART
  =========================================
  */

  return (
    <main className="cart-page">

      {/* HEADER */}

      <section className="cart-header">
        <div>
          <span>YOUR SHOPPING BAG</span>

          <h1>Your Cart</h1>

          <p>
            {totalItems}{" "}
            {totalItems === 1
              ? "item"
              : "items"}{" "}
            in your shopping bag
          </p>
        </div>
      </section>

      {/* CONTENT */}

      <section className="cart-content">

        <div className="cart-main">

          {/* TOP BAR */}

          <div className="cart-topbar">
            <span>
              {totalItems}{" "}
              {totalItems === 1
                ? "PRODUCT"
                : "PRODUCTS"}
            </span>

            <button
              type="button"
              className="clear-cart-button"
              onClick={handleClearCart}
              disabled={actionLoading}
            >
              <Trash2 size={14} />
              Clear Cart
            </button>
          </div>

          {/* MESSAGES */}

          {message && (
            <div className="cart-success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="cart-error-message">
              {error}
            </div>
          )}

          {/* ITEMS */}

          <div className="cart-items">

            {items.map((item) => {
              const product = item.product || {};

              const productId =
                item.product_id ||
                product.id;

              const productName =
                item.product_name ||
                product.name ||
                "Product";

              /*
               * Product image:
               * 1. primary image
               * 2. first image
               * 3. product.image_url
               * 4. item.image_url
               */

              const primaryImage =
                product.images?.find(
                  (image) =>
                    image.is_primary
                ) ||
                product.images?.[0];

              const imageUrl =
                primaryImage?.image_url ||
                product.image_url ||
                item.image_url ||
                "";

              const unitPrice = Number(
                item.unit_price ??
                  item.price ??
                  product.price ??
                  0
              );

              const quantity = Number(
                item.quantity || 1
              );

              const itemSubtotal = Number(
                item.subtotal ??
                  unitPrice * quantity
              );

              const stock = Number(
                item.stock_quantity ??
                  product.stock_quantity ??
                  0
              );

              return (
                <article
                  className="cart-item"
                  key={item.id}
                >

                  {/* IMAGE */}

                  <Link
                    to={`/product/${productId}`}
                    className="cart-item-image"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={productName}
                      />
                    ) : (
                      <div className="cart-image-placeholder">
                        <ShoppingBag size={30} />
                      </div>
                    )}
                  </Link>

                  {/* INFO */}

                  <div className="cart-item-info">

                    <span className="cart-item-category">
                      Handmade Creation
                    </span>

                    <Link
                      to={`/product/${productId}`}
                    >
                      <h2>{productName}</h2>
                    </Link>

                    <p>
                      ₹{unitPrice.toFixed(2)} each
                    </p>

                    {/* QUANTITY */}

                    <div className="cart-item-controls">

                      <div className="cart-quantity">

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(
                              item,
                              quantity - 1
                            )
                          }
                          disabled={
                            actionLoading ||
                            quantity <= 1
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>

                        <span>
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(
                              item,
                              quantity + 1
                            )
                          }
                          disabled={
                            actionLoading ||
                            (stock > 0 &&
                              quantity >= stock)
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>

                      </div>

                      <button
                        type="button"
                        className="remove-item-button"
                        onClick={() =>
                          handleRemoveItem(
                            item.id
                          )
                        }
                        disabled={
                          actionLoading
                        }
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>

                    </div>
                  </div>

                  {/* PRICE */}

                  <div className="cart-item-price">

                    <span>
                      Item Total
                    </span>

                    <strong>
                      ₹{itemSubtotal.toFixed(2)}
                    </strong>

                  </div>

                </article>
              );
            })}

          </div>

          {/* CONTINUE SHOPPING */}

          <Link
            to="/shop"
            className="continue-shopping-cart"
          >
            <ArrowLeft size={15} />
            Continue Shopping
          </Link>

        </div>

        {/* SUMMARY */}

        <aside className="cart-summary">

          <div className="cart-summary-header">
            <span>ORDER SUMMARY</span>

            <h2>Cart Total</h2>
          </div>

          <div className="cart-summary-row">
            <span>Subtotal</span>

            <strong>
              ₹{subtotal.toFixed(2)}
            </strong>
          </div>

          <div className="cart-summary-row">
            <span>Delivery</span>

            <span className="delivery-text">
              Calculated at checkout
            </span>
          </div>

          <div className="cart-summary-divider"></div>

          <div className="cart-summary-total">
            <span>Total</span>

            <strong>
              ₹{subtotal.toFixed(2)}
            </strong>
          </div>

          <button
            type="button"
            className="checkout-button"
            onClick={() =>
              navigate("/checkout")
            }
          >
            Proceed to Checkout

            <ArrowRight size={17} />
          </button>

          <div className="cart-secure-note">
            <Check size={14} />

            <span>
              Secure checkout
            </span>
          </div>

        </aside>

      </section>
    </main>
  );
}

export default Cart;
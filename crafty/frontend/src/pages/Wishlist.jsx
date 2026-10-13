import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

import { getWishlist, removeFromWishlist } from "../services/wishlistService";

import { addToCart } from "../services/cartService";

import "./Wishlist.css";

function WishlistProductImage({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const primaryImage =
    product.images?.find((image) => image.is_primary) || product.images?.[0];
  const imageUrl = primaryImage?.image_url || product.image_url;

  return imageUrl && !imageFailed ? (
    <img
      src={imageUrl}
      alt={product.name}
      onError={() => setImageFailed(true)}
    />
  ) : (
    <div className="wishlist-image-placeholder">
      <ShoppingBag size={32} />
    </div>
  );
}

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);
  const loadRequestId = useRef(0);

  const { refreshCart } = useCart();

  const loadWishlist = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    const token = localStorage.getItem("token");

    if (!token) {
      setWishlist([]);
      setError("Please log in to view your wishlist.");
      setRequiresLogin(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setRequiresLogin(false);

      const data = await getWishlist();

      if (!Array.isArray(data?.wishlist)) {
        throw new Error("Unexpected wishlist response.");
      }

      if (requestId === loadRequestId.current) {
        setWishlist(data.wishlist);
      }
    } catch (err) {
      console.error("Wishlist error:", err);

      if (requestId === loadRequestId.current) {
        const unauthenticated = err.response?.status === 401;
        setRequiresLogin(unauthenticated);
        setError(
          unauthenticated
            ? "Please log in to view your wishlist."
            : err.response?.data?.message || "Unable to load wishlist.",
        );
      }
    } finally {
      if (requestId === loadRequestId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const loadTimeout = window.setTimeout(loadWishlist, 0);

    const handleAuthChange = () => {
      setWishlist([]);
      setMessage("");
      loadWishlist();
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.clearTimeout(loadTimeout);
      loadRequestId.current += 1;
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [loadWishlist]);

  const handleRemove = async (productId) => {
    try {
      setActionLoading(productId);
      setError("");
      setMessage("");

      await removeFromWishlist(productId);

      setWishlist((current) =>
        current.filter(
          (item) => String(item.product_id) !== String(productId),
        ),
      );

      setMessage("Product removed from wishlist.");
    } catch (err) {
      console.error("Remove wishlist error:", err);

      setError(err.response?.data?.message || "Unable to remove product.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!localStorage.getItem("token")) {
      setRequiresLogin(true);
      setError("Please log in to add products to your cart.");
      return;
    }

    try {
      setActionLoading(productId);
      setError("");
      setMessage("");

      const response = await addToCart(productId, 1);

      setMessage(response.message || "Product added to cart.");
      try {
        await refreshCart();
      } catch (refreshError) {
        console.error("Cart refresh error after wishlist add:", refreshError);
        setMessage(
          "Product added to cart, but the cart could not be refreshed.",
        );
      }
    } catch (err) {
      console.error("Add to cart error:", err);

      setError(err.response?.data?.message || "Unable to add product to cart.");
      setMessage("");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-loading">
          <div className="wishlist-loader"></div>
          <p>Loading your wishlist...</p>
        </div>
      </main>
    );
  }

  if (error && wishlist.length === 0) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-message">
          <Heart size={42} />

          <h2>Your Wishlist</h2>

          <p>{error}</p>

          {requiresLogin && (
            <Link to="/login" className="wishlist-primary-button">
              Login
            </Link>
          )}

          {!requiresLogin && (
            <button
              type="button"
              className="wishlist-primary-button"
              onClick={loadWishlist}
            >
              Try Again
            </button>
          )}

          <Link to="/shop" className="wishlist-secondary-button">
            Explore Shop
            <ArrowRight size={15} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist-page">
      {/* HEADER */}

      <section className="wishlist-header">
        <span>YOUR COLLECTION</span>

        <h1>Wishlist</h1>

        <p>Save the handmade pieces you love.</p>
      </section>

      {/* CONTENT */}

      <section className="wishlist-content">
        {message && (
          <div className="wishlist-success" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="wishlist-error" role="alert">
            {error}
            {requiresLogin && (
              <Link to="/login" className="wishlist-inline-login">
                Log in
              </Link>
            )}
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className="empty-wishlist">
            <div className="empty-wishlist-icon">
              <Heart size={38} />
            </div>

            <h2>Your wishlist is empty</h2>

            <p>When you find something you love, save it here for later.</p>

            <Link to="/shop" className="wishlist-primary-button">
              Explore Collection
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="wishlist-topbar">
              <span>
                {wishlist.length} {wishlist.length === 1 ? "ITEM" : "ITEMS"}
              </span>

              <Link to="/shop">
                Continue Shopping
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="wishlist-grid">
              {wishlist.map((item) => {
                const product = item.product;

                if (!product) return null;

                const price = Number(product.price ?? 0);
                const finalPrice = Number(
                  product.final_price ?? product.price ?? 0,
                );
                const discountAmount = Number(product.discount_amount ?? 0);
                const hasDiscount =
                  finalPrice < price && discountAmount > 0;
                const stock = Number(product.stock_quantity ?? 0);

                return (
                  <article className="wishlist-card" key={item.id}>
                    {/* IMAGE */}

                    <div className="wishlist-image-wrapper">
                      <Link
                        to={`/product/${product.id}`}
                        className="wishlist-image-link"
                      >
                        <WishlistProductImage product={product} />
                      </Link>

                      <button
                        type="button"
                        className="wishlist-remove"
                        onClick={() => handleRemove(product.id)}
                        disabled={actionLoading === product.id}
                        aria-label={`Remove ${product.name} from wishlist`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* DETAILS */}

                    <div className="wishlist-details">
                      <span>
                        {product.category_name || "Handmade Collection"}
                      </span>

                      <Link to={`/product/${product.id}`}>
                        <h2>{product.name}</h2>
                      </Link>

                      <p className="wishlist-description">
                        {product.description || "Beautiful handmade creation."}
                      </p>

                      <div className="wishlist-bottom">
                        <div className="wishlist-prices">
                          {hasDiscount && (
                            <del>₹{price.toFixed(2)}</del>
                          )}
                          <strong>
                            ₹{(hasDiscount ? finalPrice : price).toFixed(2)}
                          </strong>
                          {hasDiscount && (
                            <span className="wishlist-discount">
                              {product.discount_type === "percentage" &&
                              Number(product.discount_value) > 0
                                ? `${Number(product.discount_value)}% OFF`
                                : `₹${discountAmount.toFixed(2)} OFF`}
                            </span>
                          )}
                        </div>

                        <span
                          className={stock > 0 ? "in-stock" : "out-of-stock"}
                        >
                          {stock > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="wishlist-cart-button"
                        onClick={() => handleAddToCart(product.id)}
                        disabled={
                          actionLoading === product.id ||
                          stock <= 0
                        }
                      >
                        <ShoppingBag size={15} />

                        {actionLoading === product.id
                          ? "Adding..."
                          : "Add to Cart"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Wishlist;

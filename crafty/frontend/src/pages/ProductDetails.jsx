import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  ArrowLeft,
  Check,
  Star,
  Pencil,
  Trash2,
} from "lucide-react";

import { getProduct, getRelatedProducts } from "../services/productService";
import { addToCart } from "../services/cartService";
import {
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from "../services/wishlistService";
import {
  getProductReviews,
  
  addReview,
  updateReview,
  deleteReview,
} from "../services/reviewService";

import "./ProductDetails.css";
import { useCart } from "../context/CartContext";

const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id == null ? null : String(user.id);
  } catch {
    return null;
  }
};

const getReviewErrorMessage = (error) => {
  const status = error.response?.status;
  const message = error.response?.data?.message;

  if (status === 401) return "Please log in to submit a review.";
  if (status === 403) {
    return message || "You can review only products you have purchased.";
  }
  if (status === 409) {
    return message || "You have already reviewed this product.";
  }
  if (status === 404) return message || "This product or review could not be found.";
  if (message) return message;
  if (!error.response) return "Unable to reach the server. Check your connection and try again.";
  return "Unable to save your review. Please try again.";
};

const getProductImageUrl = (product) => {
  const primaryImage =
    product.images?.find((image) => image.is_primary) || product.images?.[0];
  return primaryImage?.image_url || product.image_url;
};

function SimilarProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getProductImageUrl(product);
  const price = Number(product.price ?? 0);
  const finalPrice = Number(product.final_price ?? product.price ?? 0);
  const discountAmount = Number(product.discount_amount ?? 0);
  const hasDiscount = finalPrice < price && discountAmount > 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="similar-product-card"
      aria-label={`View ${product.name}`}
    >
      <div className="similar-product-image">
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={product.name}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="similar-product-placeholder">
            <ShoppingBag size={34} />
          </div>
        )}
      </div>

      <div className="similar-product-info">
        <h3>{product.name}</h3>
        <div className="similar-product-pricing">
          {hasDiscount && (
            <span className="similar-product-original-price">
              ₹{price.toFixed(2)}
            </span>
          )}
          <strong>₹{(hasDiscount ? finalPrice : price).toFixed(2)}</strong>
          {hasDiscount && (
            <span className="similar-product-discount">
              {product.discount_type === "percentage" &&
              Number(product.discount_value) > 0
                ? `${Number(product.discount_value)}% OFF`
                : `₹${discountAmount.toFixed(2)} OFF`}
            </span>
          )}
        </div>
        <span className="similar-product-view-link">View Product</span>
      </div>
    </Link>
  );
}

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [isInWishlist, setIsInWishlist] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [wishlistLoginRequired, setWishlistLoginRequired] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [reviewData, setReviewData] = useState({
    average_rating: 0,
    total_reviews: 0,
    reviews: [],
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewFeedbackType, setReviewFeedbackType] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedProductsLoading, setRelatedProductsLoading] = useState(true);
  const [relatedProductsError, setRelatedProductsError] = useState("");
  const [relatedProductsRetry, setRelatedProductsRetry] = useState(0);

  const { refreshCart } = useCart();
  const currentUserId = getCurrentUserId();
  const isProductLoading =
    loading || (product && String(product.id) !== String(id));

  useEffect(() => {
    let isCurrent = true;

    const loadRelatedProducts = async () => {
      setRelatedProductsLoading(true);
      setRelatedProductsError("");
      setRelatedProducts([]);

      try {
        const data = await getRelatedProducts(id);
        if (!isCurrent) return;

        if (!Array.isArray(data?.products)) {
          throw new Error("Unexpected related products response");
        }

        setRelatedProducts(data.products);
      } catch (relatedProductsLoadError) {
        if (isCurrent) {
          setRelatedProductsError(
            relatedProductsLoadError.response?.data?.message ||
              "Unable to load similar products. Please try again.",
          );
        }
      } finally {
        if (isCurrent) setRelatedProductsLoading(false);
      }
    };

    loadRelatedProducts();

    return () => {
      isCurrent = false;
    };
  }, [id, relatedProductsRetry]);

  useEffect(() => {
    let isCurrent = true;

    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError("");

        const data = await getProductReviews(id);

        if (isCurrent) {
          setReviewData({
            average_rating: Number(data.average_rating) || 0,
            total_reviews: Number(data.total_reviews) || 0,
            reviews: Array.isArray(data.reviews) ? data.reviews : [],
          });
        }
      } catch (reviewsLoadError) {
        if (isCurrent) {
          setReviewsError(
            reviewsLoadError.response?.data?.message ||
              "Unable to load customer reviews. Please try again.",
          );
        }
      } finally {
        if (isCurrent) setReviewsLoading(false);
      }
    };

    loadReviews();

    return () => {
      isCurrent = false;
    };
  }, [id]);

  const refreshReviews = async () => {
    const data = await getProductReviews(id);
    setReviewData({
      average_rating: Number(data.average_rating) || 0,
      total_reviews: Number(data.total_reviews) || 0,
      reviews: Array.isArray(data.reviews) ? data.reviews : [],
    });
    setReviewsError("");
  };

  const startEditingReview = (review) => {
    setEditingReviewId(review.id);
    setReviewRating(Number(review.rating));
    setReviewComment(review.comment || "");
    setReviewFeedback("");
    setReviewFeedbackType("");
  };

  const cancelEditingReview = () => {
    setEditingReviewId(null);
    setReviewRating(0);
    setReviewComment("");
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!localStorage.getItem("token")) {
      setReviewFeedback("Please log in to submit a review.");
      setReviewFeedbackType("error");
      return;
    }

    if (!reviewRating) {
      setReviewFeedback("Please choose a star rating from 1 to 5.");
      setReviewFeedbackType("error");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewFeedback("");

      if (editingReviewId !== null) {
        await updateReview(editingReviewId, reviewRating, reviewComment);
        await refreshReviews();
        cancelEditingReview();
        setReviewFeedback("Your review has been updated.");
      } else {
        await addReview(id, reviewRating, reviewComment);
        await refreshReviews();
        setReviewRating(0);
        setReviewComment("");
        setReviewFeedback("Thank you. Your review has been submitted.");
      }

      setReviewFeedbackType("success");
    } catch (reviewSubmitError) {
      setReviewFeedback(getReviewErrorMessage(reviewSubmitError));
      setReviewFeedbackType("error");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    try {
      setDeletingReviewId(reviewId);
      setReviewFeedback("");
      await deleteReview(reviewId);
      await refreshReviews();
      if (editingReviewId === reviewId) cancelEditingReview();
      setReviewFeedback("Your review has been deleted.");
      setReviewFeedbackType("success");
    } catch (reviewDeleteError) {
      setReviewFeedback(getReviewErrorMessage(reviewDeleteError));
      setReviewFeedbackType("error");
    } finally {
      setDeletingReviewId(null);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    const loadProduct = async () => {
      try {
        const data = await getProduct(id);

        if (!isCurrent) return;

        const productData = data.product || data;
        setProduct(productData);
        setError("");

        if (localStorage.getItem("token")) {
          try {
            const wishlistData = await checkWishlist(id);
            if (isCurrent) {
              setIsInWishlist(wishlistData.in_wishlist === true);
            }
          } catch (wishlistError) {
            console.log("Wishlist check skipped:", wishlistError);
          }
        }
      } catch (err) {
        if (isCurrent) {
          console.error("Product details error:", err);
          setProduct(null);
          setError(err.response?.data?.message || "Unable to load this product.");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      isCurrent = false;
    };
  }, [id]);

  const increaseQuantity = () => {
    if (!product) return;

    const stock = Number(product.stock_quantity ?? 0);

    setQuantity((current) => {
      if (stock > 0 && current >= stock) {
        return current;
      }

      return current + 1;
    });
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  // const handleAddToCart = async () => {
  //   const token = localStorage.getItem("token");

  //   if (!token) {
  //     setMessage("Please login to add products to cart.");
  //     return;
  //   }

  //   try {
  //     setActionLoading(true);
  //     setMessage("");

  //     const response = await addToCart(product.id, quantity);

  //     setMessage(response.message || "Product added to cart successfully.");
  //   } catch (err) {
  //     console.error("Add to cart error:", err);

  //     setMessage(
  //       err.response?.data?.message || "Unable to add product to cart.",
  //     );
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");

    setWishlistLoginRequired(false);

    if (!token) {
      setCartAdded(false);
      setMessage("Please login to add products to cart.");
      setMessageType("error");
      return;
    }

    try {
      setActionLoading(true);
      setCartAdded(false);
      setMessage("");
      setMessageType("");

      const response = await addToCart(product.id, quantity);

      setMessage(response.message || "Product added to cart successfully.");
      setMessageType("success");
      setCartAdded(true);

      try {
        await refreshCart();
      } catch (refreshError) {
        console.error("Cart refresh error after adding product:", refreshError);
        setMessage(
          "Product added to cart, but the cart could not be refreshed. Open View Cart to check.",
        );
      }
    } catch (err) {
      console.error("Add to cart error:", err);

      setMessage(
        err.response?.data?.message || "Unable to add product to cart.",
      );
      setMessageType("error");
      setCartAdded(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWishlist = async () => {
    const token = localStorage.getItem("token");

    setCartAdded(false);
    setWishlistLoginRequired(false);

    if (!token) {
      setWishlistLoginRequired(true);
      setMessage("Please login to use wishlist.");
      setMessageType("error");
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");
      setMessageType("");

      if (isInWishlist) {
        const response = await removeFromWishlist(product.id);

        setIsInWishlist(false);

        setMessage(response.message || "Product removed from wishlist.");
        setMessageType("success");
      } else {
        const response = await addToWishlist(product.id);

        setIsInWishlist(true);

        setMessage(response.message || "Product added to wishlist.");
        setMessageType("success");
      }
    } catch (err) {
      console.error("Wishlist error:", err);

      setMessage(err.response?.data?.message || "Unable to update wishlist.");
      setMessageType("error");
      setWishlistLoginRequired(err.response?.status === 401);
    } finally {
      setActionLoading(false);
    }
  };

  if (isProductLoading) {
    return (
      <main className="product-details-page">
        <div className="product-details-message">
          <div className="product-loader"></div>
          <p>Loading product...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-details-page">
        <div className="product-details-message">
          <h2>Product Not Found</h2>

          <p>{error || "The requested product could not be found."}</p>

          <Link to="/shop" className="back-shop-button">
            <ArrowLeft size={16} />
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const stock = Number(product.stock_quantity ?? 0);

  const price = Number(product.price ?? 0);
  const finalPrice = Number(product.final_price ?? product.price ?? 0);
  const discountAmount = Number(product.discount_amount ?? 0);
  const hasPromotion =
    product.promotion_id && discountAmount > 0 && finalPrice < price;

  const isOutOfStock = stock <= 0;

  const categoryName = product.category?.name || product.category_name || "";

  const primaryImage =
    product.images?.find((image) => image.is_primary) || product.images?.[0];

  const imageUrl = primaryImage?.image_url || product.image_url;

  return (
    <main className="product-details-page">
      {/* BREADCRUMB */}

      <div className="product-breadcrumb">
        <Link to="/">Home</Link>

        <span>/</span>

        <Link to="/shop">Shop</Link>

        <span>/</span>

        <span>{product.name}</span>
      </div>

      {/* PRODUCT */}

      <section className="product-details-container">
        {/* IMAGE */}

        <div className="product-details-image-section">
          <div className="product-details-image">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} />
            ) : (
              <div className="product-details-placeholder">
                <ShoppingBag size={55} />
              </div>
            )}

            {isOutOfStock && (
              <div className="out-of-stock-badge">Out of Stock</div>
            )}
          </div>
        </div>

        {/* INFORMATION */}

        <div className="product-details-info">
          {categoryName && (
            <span className="product-details-category">{categoryName}</span>
          )}

          <h1>{product.name}</h1>

          <div className="product-review-summary">
            <span
              className="product-review-summary-stars"
              role="img"
              aria-label={`${reviewData.average_rating} out of 5 stars`}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill={star <= Math.round(reviewData.average_rating) ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              ))}
            </span>
            <span>
              {reviewData.average_rating.toFixed(1)} ({reviewData.total_reviews}{" "}
              {reviewData.total_reviews === 1 ? "review" : "reviews"})
            </span>
          </div>

          <div className="product-details-price">
            {hasPromotion ? (
              <>
                <span className="product-details-original-price">
                  ₹{price.toFixed(2)}
                </span>
                <span className="product-details-final-price">
                  ₹{finalPrice.toFixed(2)}
                </span>
                <span className="product-details-discount-badge">
                  {product.discount_type === "percentage"
                    ? `${Number(product.discount_value ?? 0)}% OFF`
                    : `₹${discountAmount.toFixed(2)} OFF`}
                </span>
              </>
            ) : (
              `₹${price.toFixed(2)}`
            )}
          </div>

          <div className="product-details-divider"></div>

          {/* DESCRIPTION */}

          {product.description && (
            <div className="product-description">
              <h3>Description</h3>

              <p>{product.description}</p>
            </div>
          )}

          {/* STOCK */}

          <div className="product-stock">
            {isOutOfStock ? (
              <span className="stock-out">Currently unavailable</span>
            ) : stock <= 5 ? (
              <span className="stock-low">Only {stock} left in stock</span>
            ) : (
              <span className="stock-available">
                <Check size={15} />
                In Stock
              </span>
            )}
          </div>

          {/* ACTIONS */}

          {!isOutOfStock && (
            <div className="product-actions">
              {/* QUANTITY */}

              <div className="quantity-wrapper">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={actionLoading || quantity <= 1}
                >
                  <Minus size={15} />
                </button>

                <span>{quantity}</span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={actionLoading || quantity >= stock}
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* CART */}

              <button
                type="button"
                className="product-add-cart"
                onClick={handleAddToCart}
                disabled={actionLoading}
              >
                <ShoppingBag size={18} />

                {actionLoading ? "Processing..." : "Add to Cart"}
              </button>

              {/* WISHLIST */}

              <button
                type="button"
                className={`product-add-wishlist ${
                  isInWishlist ? "wishlist-active" : ""
                }`}
                onClick={handleWishlist}
                disabled={actionLoading}
                aria-label={
                  isInWishlist ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <Heart
                  size={20}
                  fill={isInWishlist ? "currentColor" : "none"}
                />
              </button>
            </div>
          )}

          {/* ACTION MESSAGE */}

          {message && (
            <div
              className={`product-action-message product-action-message-${messageType}`}
              role={messageType === "error" ? "alert" : "status"}
            >
              <span>{message}</span>
              {cartAdded && (
                <Link to="/cart" className="product-view-cart">
                  View Cart
                </Link>
              )}
              {wishlistLoginRequired && (
                <Link
                  to="/login"
                  state={{ from: `/product/${id}` }}
                  className="product-action-login"
                >
                  Log in
                </Link>
              )}
            </div>
          )}

          {/* BENEFITS */}

          <div className="product-benefits">
            <div className="product-benefit">
              <div className="benefit-icon">
                <Check size={17} />
              </div>

              <div>
                <strong>Handcrafted Quality</strong>

                <p>Carefully created with attention to detail.</p>
              </div>
            </div>

            <div className="product-benefit">
              <div className="benefit-icon">
                <ShoppingBag size={17} />
              </div>

              <div>
                <strong>Beautiful Packaging</strong>

                <p>Thoughtfully packaged for gifting.</p>
              </div>
            </div>
          </div>

          <Link to="/shop" className="continue-shopping">
            <ArrowLeft size={15} />
            Continue Shopping
          </Link>
        </div>
      </section>

      <section className="product-reviews" aria-labelledby="product-reviews-title">
        <div className="product-reviews-heading">
          <span className="product-reviews-eyebrow">HANDMADE, LOVED, REVIEWED</span>
          <h2 id="product-reviews-title">Customer Reviews</h2>
          <p>
            {reviewData.average_rating > 0
              ? `${reviewData.average_rating.toFixed(1)} out of 5 from ${reviewData.total_reviews} ${
                  reviewData.total_reviews === 1 ? "review" : "reviews"
                }`
              : "Be the first to share your experience with this piece."}
          </p>
        </div>

        {reviewsLoading ? (
          <div className="product-reviews-state" role="status">
            <div className="product-loader" />
            <p>Loading reviews...</p>
          </div>
        ) : reviewsError ? (
          <div className="product-reviews-state product-reviews-error" role="alert">
            <p>{reviewsError}</p>
            <button type="button" onClick={refreshReviews}>Try again</button>
          </div>
        ) : (
          <>
            {reviewData.reviews.length === 0 ? (
              <p className="product-reviews-empty">No reviews yet. Your experience could help another customer.</p>
            ) : (
              <div className="product-review-list">
                {reviewData.reviews.map((review) => {
                  const isOwnReview =
                    currentUserId !== null &&
                    String(review.user_id) === currentUserId;

                  return (
                    <article className="product-review-card" key={review.id}>
                      <div className="product-review-card-heading">
                        <div>
                          <h3>{review.user_name || "Customer"}</h3>
                          <time dateTime={review.created_at || undefined}>
                            {review.created_at
                              ? new Date(review.created_at).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : ""}
                          </time>
                        </div>
                        <div
                          className="product-review-stars"
                          role="img"
                          aria-label={`${review.rating} out of 5 stars`}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={15}
                              fill={star <= Number(review.rating) ? "currentColor" : "none"}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p>{review.comment}</p>}

                      {isOwnReview && (
                        <div className="product-review-controls">
                          <button
                            type="button"
                            onClick={() => startEditingReview(review)}
                            disabled={reviewSubmitting || deletingReviewId !== null}
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewDelete(review.id)}
                            disabled={reviewSubmitting || deletingReviewId === review.id}
                          >
                            <Trash2 size={14} />
                            {deletingReviewId === review.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            <div className="product-review-form-section">
              <h3>{editingReviewId !== null ? "Edit your review" : "Share your experience"}</h3>
              {!localStorage.getItem("token") ? (
                <p className="product-review-login">
                  <Link to="/login" state={{ from: `/product/${id}` }}>
                    Log in
                  </Link>{" "}
                  to write a review. Reviews are available to customers who have purchased this product.
                </p>
              ) : editingReviewId === null &&
                reviewData.reviews.some(
                  (review) =>
                    currentUserId !== null &&
                    String(review.user_id) === currentUserId,
                ) ? (
                <p className="product-review-login">
                  You have already reviewed this product. You can edit or delete your review above.
                </p>
              ) : (
                <form className="product-review-form" onSubmit={handleReviewSubmit}>
                  <fieldset className="product-review-rating">
                    <legend>Your rating</legend>
                    <div className="product-review-rating-options">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label
                          key={rating}
                          className={`product-review-rating-option ${
                            rating <= reviewRating ? "is-selected" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="product-review-rating"
                            value={rating}
                            checked={reviewRating === rating}
                            onChange={() => setReviewRating(rating)}
                            required
                          />
                          <Star
                            size={25}
                            fill={rating <= reviewRating ? "currentColor" : "none"}
                            aria-hidden="true"
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label className="product-review-comment-label" htmlFor="product-review-comment">
                    Your comments <span>(optional)</span>
                  </label>
                  <textarea
                    id="product-review-comment"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="What did you think of this handmade piece?"
                  />

                  {reviewFeedback && (
                    <p
                      className={`product-review-feedback product-review-feedback-${reviewFeedbackType}`}
                      role={reviewFeedbackType === "error" ? "alert" : "status"}
                    >
                      {reviewFeedback}
                    </p>
                  )}

                  <div className="product-review-form-actions">
                    <button type="submit" disabled={reviewSubmitting}>
                      {reviewSubmitting
                        ? "Submitting..."
                        : editingReviewId !== null
                          ? "Save Changes"
                          : "Submit Review"}
                    </button>
                    {editingReviewId !== null && (
                      <button type="button" className="product-review-cancel" onClick={cancelEditingReview}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </section>

      <section
        className="similar-products"
        aria-labelledby="similar-products-title"
      >
        <div className="similar-products-heading">
          <span className="similar-products-eyebrow">MORE TO LOVE</span>
          <h2 id="similar-products-title">Similar Products</h2>
          <p>Discover more handmade pieces from this collection.</p>
        </div>

        {relatedProductsLoading ? (
          <div className="similar-products-state" role="status">
            <div className="product-loader" />
            <p>Finding similar products...</p>
          </div>
        ) : relatedProductsError ? (
          <div className="similar-products-state similar-products-error" role="alert">
            <p>{relatedProductsError}</p>
            <button
              type="button"
              onClick={() => setRelatedProductsRetry((attempt) => attempt + 1)}
            >
              Try again
            </button>
          </div>
        ) : relatedProducts.length === 0 ? (
          <p className="similar-products-empty">
            No similar products are available right now.
          </p>
        ) : (
          <div className="similar-products-grid">
            {relatedProducts.map((relatedProduct) => (
              <SimilarProductCard
                key={`${relatedProduct.id}:${getProductImageUrl(relatedProduct) || ""}`}
                product={relatedProduct}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default ProductDetails;

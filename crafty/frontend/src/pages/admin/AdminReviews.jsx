import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Star,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAdminReviews,
  deleteAdminReview,
} from "../../services/adminService";

import "./AdminReviews.css";

const AdminReviews = () => {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminReviews();

      setReviews(data.reviews || []);
    } catch (err) {
      console.error("Reviews loading error:", err);

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          state: {
            from: "/admin/reviews",
          },
        });

        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load reviews"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (review) => {
    const confirmed = window.confirm(
      `Delete review by ${
        review.user_name || "this customer"
      }?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(review.id);
      setError("");
      setSuccess("");

      await deleteAdminReview(review.id);

      setReviews((previous) =>
        previous.filter(
          (item) => item.id !== review.id
        )
      );

      setSuccess("Review deleted successfully");
    } catch (err) {
      console.error("Delete review error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete review"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReviews = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return reviews.filter((review) => {
      const matchesSearch =
        !searchValue ||
        String(review.id)
          .toLowerCase()
          .includes(searchValue) ||
        String(review.user_name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(review.product_name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(review.comment || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesRating =
        ratingFilter === "all" ||
        String(review.rating) === ratingFilter;

      return matchesSearch && matchesRating;
    });
  }, [reviews, search, ratingFilter]);

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews > 0
      ? (
          reviews.reduce(
            (total, review) =>
              total + Number(review.rating || 0),
            0
          ) / totalReviews
        ).toFixed(1)
      : "0.0";

  const ratingCounts = {
    5: reviews.filter(
      (review) => Number(review.rating) === 5
    ).length,
    4: reviews.filter(
      (review) => Number(review.rating) === 4
    ).length,
    3: reviews.filter(
      (review) => Number(review.rating) === 3
    ).length,
    2: reviews.filter(
      (review) => Number(review.rating) === 2
    ).length,
    1: reviews.filter(
      (review) => Number(review.rating) === 1
    ).length,
  };

  const renderStars = (rating) => {
    return (
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={15}
            fill={
              star <= Number(rating)
                ? "currentColor"
                : "none"
            }
          />
        ))}
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="admin-reviews-page">
      <div className="admin-reviews-header">
        <div>
          <span className="admin-reviews-eyebrow">
            Customer Feedback
          </span>

          <h1>Reviews</h1>

          <p>
            Manage customer reviews and ratings
            across your products.
          </p>
        </div>

        <button
          className="reviews-refresh-btn"
          onClick={loadReviews}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="reviews-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="reviews-alert success">
          {success}
        </div>
      )}

      <div className="reviews-summary-grid">
        <div className="review-summary-card">
          <div className="summary-icon">
            <MessageSquare size={20} />
          </div>

          <div>
            <span>Total Reviews</span>
            <strong>{totalReviews}</strong>
          </div>
        </div>

        <div className="review-summary-card">
          <div className="summary-icon rating-icon">
            <Star size={20} fill="currentColor" />
          </div>

          <div>
            <span>Average Rating</span>
            <strong>{averageRating}</strong>
          </div>
        </div>

        <div className="review-summary-card">
          <div className="summary-icon">
            <Star size={20} />
          </div>

          <div>
            <span>5 Star Reviews</span>
            <strong>{ratingCounts[5]}</strong>
          </div>
        </div>

        <div className="review-summary-card">
          <div className="summary-icon">
            <Star size={20} />
          </div>

          <div>
            <span>1 Star Reviews</span>
            <strong>{ratingCounts[1]}</strong>
          </div>
        </div>
      </div>

      <div className="reviews-toolbar">
        <div className="reviews-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search customer, product or review..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={ratingFilter}
          onChange={(e) =>
            setRatingFilter(e.target.value)
          }
          className="rating-filter"
        >
          <option value="all">
            All Ratings
          </option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      <div className="reviews-table-card">
        <div className="reviews-table-header">
          <div>
            <h2>Customer Reviews</h2>
            <span>
              Showing {filteredReviews.length} of{" "}
              {reviews.length} reviews
            </span>
          </div>
        </div>

        {loading ? (
          <div className="reviews-loading">
            Loading reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="reviews-empty">
            <MessageSquare size={42} />

            <h3>No reviews found</h3>

            <p>
              There are no reviews matching your
              current filters.
            </p>
          </div>
        ) : (
          <div className="reviews-table-wrapper">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          {(
                            review.user_name ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {review.user_name ||
                              "Unknown Customer"}
                          </strong>

                          <span>
                            User #{review.user_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="product-cell">
                        <strong>
                          {review.product_name ||
                            "Unknown Product"}
                        </strong>

                        <span>
                          Product #{review.product_id}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="rating-cell">
                        {renderStars(review.rating)}

                        <span>
                          {review.rating}/5
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="comment-cell">
                        {review.comment ||
                          "No comment"}
                      </div>
                    </td>

                    <td>
                      <span className="review-date">
                        {formatDate(
                          review.created_at
                        )}
                      </span>
                    </td>

                    <td>
                      <button
                        className="delete-review-btn"
                        onClick={() =>
                          handleDelete(review)
                        }
                        disabled={
                          deletingId === review.id
                        }
                        title="Delete review"
                      >
                        <Trash2 size={17} />

                        {deletingId ===
                        review.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
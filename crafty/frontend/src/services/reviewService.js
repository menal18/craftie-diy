import api from "./api";

// Get all reviews for a product
export const getProductReviews = async (productId) => {
  const response = await api.get(
    `/api/reviews/product/${productId}`
  );
  return response.data;
};

// Get one review
export const getReview = async (reviewId) => {
  const response = await api.get(
    `/api/reviews/${reviewId}`
  );
  return response.data;
};

// Add a review
export const addReview = async (productId, rating, comment = "") => {
  const response = await api.post("/api/reviews", {
    product_id: productId,
    rating,
    comment,
  });
  return response.data;
};

// Update your review
export const updateReview = async (reviewId, rating, comment) => {
  const response = await api.put(
    `/api/reviews/${reviewId}`,
    { rating, comment }
  );
  return response.data;
};

// Delete your review
export const deleteReview = async (reviewId) => {
  const response = await api.delete(
    `/api/reviews/${reviewId}`
  );
  return response.data;
};
import api from "./api";

export const getWishlist = async () => {
  const response = await api.get("/api/wishlist");
  return response.data;
};

export const addToWishlist = async (productId) => {
  const response = await api.post("/api/wishlist", {
    product_id: productId,
  });

  return response.data;
};

export const removeFromWishlist = async (productId) => {
  const response = await api.delete(
    `/api/wishlist/${productId}`
  );

  return response.data;
};

export const checkWishlist = async (productId) => {
  const response = await api.get(
    `/api/wishlist/check/${productId}`
  );

  return response.data;
};
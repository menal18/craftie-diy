import api from "./api";

export const getCart = async () => {
  const response = await api.get("/api/cart");
  return response.data;
};

export const addToCart = async (productId, quantity = 1) => {
  const response = await api.post("/api/cart/add", {
    product_id: productId,
    quantity: quantity,
  });

  return response.data;
};

export const updateCartItem = async (itemId, quantity) => {
  const response = await api.put(`/api/cart/update/${itemId}`, {
    quantity: quantity,
  });

  return response.data;
};

export const removeCartItem = async (itemId) => {
  const response = await api.delete(`/api/cart/remove/${itemId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await api.delete("/api/cart/clear");
  return response.data;
};
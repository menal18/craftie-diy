import api from "./api";

export const getMyOrders = async () => {
  const response = await api.get("/api/orders");
  return response.data;
};

export const getMyOrder = async (orderId) => {
  const response = await api.get(`/api/orders/${orderId}`);
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const response = await api.put(`/api/orders/${orderId}/cancel`);
  return response.data;
};
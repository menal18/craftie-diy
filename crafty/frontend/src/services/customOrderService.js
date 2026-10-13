
import api from "./api";

export const createCustomOrder = async (orderData) => {
  const response = await api.post("/api/custom-orders", orderData);
  return response.data;
};

export const getMyCustomOrders = async () => {
  const response = await api.get("/api/custom-orders");
  return response.data;
};

export const getMyCustomOrder = async (orderId) => {
  const response = await api.get(`/api/custom-orders/${orderId}`);
  return response.data;
};

export const updateMyCustomOrder = async (orderId, orderData) => {
  const response = await api.put(
    `/api/custom-orders/${orderId}`,
    orderData
  );
  return response.data;
};

export const cancelMyCustomOrder = async (orderId) => {
  const response = await api.delete(`/api/custom-orders/${orderId}`);
  return response.data;
};

export const acceptCustomOrderQuote = async (orderId) => {
  const response = await api.put(
    `/api/custom-orders/${orderId}/accept`
  );
  return response.data;
};

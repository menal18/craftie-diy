import api from "./api";

export const getProducts = async () => {
  const response = await api.get("/api/products");
  return response.data;
};

export const getBestsellers = async () => {
  const response = await api.get("/api/products/bestsellers");
  return response.data;
};

export const searchProducts = async (query, config = {}) => {
  const response = await api.get("/api/products/search", {
    ...config,
    params: { q: query },
  });
  return response.data;
};

export const getProduct = async (id) => {
  const response = await api.get(`/api/products/${id}`);
  return response.data;
};

export const getRelatedProducts = async (id) => {
  const response = await api.get(`/api/products/${id}/related`);
  return response.data;
};
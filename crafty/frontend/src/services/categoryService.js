import api from "./api";

export const getCategories = async () => {
  const response = await api.get("/api/categories");
  return response.data;
};

export const getCategory = async (id) => {
  const response = await api.get(`/api/categories/${id}`);
  return response.data;
};
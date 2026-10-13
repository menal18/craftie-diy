import api from "./api";

export const registerUser = async (userData) => {
  const response = await api.post(
    "/api/auth/register",
    userData
  );

  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post(
    "/api/auth/login",
    credentials
  );

  return response.data;
};

export const getProfile = async () => {
  const response = await api.get(
    "/api/auth/profile"
  );

  return response.data;
};
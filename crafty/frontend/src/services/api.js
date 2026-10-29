import axios from "axios";

const api = axios.create({
  baseURL: "https://craftie-diy.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.debug(
      "API request authentication:",
      config.method?.toUpperCase(),
      config.url,
      token ? "token present" : "token missing",
    );

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    if (status === 401 && !requestUrl.includes("/api/auth/login")) {
      console.warn(
        "Authentication failed:",
        error.response?.data?.message || "Unauthorized request",
      );

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth-change"));

      window.location.assign("/login");
    }

    return Promise.reject(error);
  },
);

export default api;

import api from "./api";

export const getMyNotifications = async () => {
  const response = await api.get("/api/notifications");
  return response.data;
};

export const getMyUnreadNotificationCount = async () => {
  const response = await api.get("/api/notifications/count");
  return response.data;
};

export const markMyNotificationAsRead = async (notificationId) => {
  const response = await api.put(
    `/api/notifications/${notificationId}/read`,
  );
  return response.data;
};

export const markAllMyNotificationsAsRead = async () => {
  const response = await api.put("/api/notifications/read-all");
  return response.data;
};

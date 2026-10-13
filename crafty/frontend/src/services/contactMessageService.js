import api from "./api";

export const sendContactMessage = async (messageData) => {
  const response = await api.post(
    "/api/contact-messages",
    messageData
  );

  return response.data;
};
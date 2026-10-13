// import api from "./api";

// export const createOrder = async ({
//   addressId,
//   paymentMethod = "COD",
//   notes = "",
// }) => {
//   const response = await api.post("/api/orders", {
//     address_id: addressId,
//     payment_method: paymentMethod,
//     notes: notes,
//   });

//   return response.data;
// };

import api from "./api";

export const createOrder = async ({
  addressId,
  paymentMethod,
  notes,
  promoCode,
}) => {
  const response = await api.post("/api/orders", {
    address_id: addressId,
    payment_method: paymentMethod,
    notes,
    promo_code: promoCode || null,
  });

  return response.data;
};

export const previewPromoCode = async (code, orderAmount) => {
  const response = await api.post(
    "/api/promo-codes/preview",
    {
      code: code,
      order_amount: orderAmount,
    }
  );

  return response.data;
};
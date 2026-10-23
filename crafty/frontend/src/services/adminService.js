import api from "./api";

// =========================================================
// ADMIN DASHBOARD
// =========================================================

export const getAdminDashboard = async () => {
  const response = await api.get("/api/admin/dashboard");
  return response.data;
};

// =========================================================
// ADMIN USERS
// =========================================================

export const getAdminUsers = async () => {
  const response = await api.get("/api/admin/users");
  return response.data;
};

export const updateAdminUserRole = async (userId, role) => {
  const response = await api.put(
    `/api/admin/users/${userId}/role`,
    {
      role,
    }
  );

  return response.data;
};

// =========================================================
// ADMIN ORDERS
// =========================================================

export const getAdminOrders = async () => {
  const response = await api.get("/api/admin/orders");
  return response.data;
};

export const updateAdminOrderStatus = async (orderId, orderStatus) => {
  const response = await api.put(
    `/api/admin/orders/${orderId}/status`,
    {
      order_status: orderStatus,
    }
  );

  return response.data;
};

export const updateAdminPaymentStatus = async (
  orderId,
  paymentStatus
) => {
  const response = await api.put(
    `/api/admin/orders/${orderId}/payment-status`,
    {
      payment_status: paymentStatus,
    }
  );

  return response.data;
};

// =========================================================
// ADMIN CUSTOM ORDERS
// =========================================================

// export const getAdminCustomOrders = async () => {
//   const response = await api.get("/api/custom-orders/admin");

//   return response.data;
// };

export const getAdminCustomOrders = async () => {
  const response = await api.get("/api/admin/custom-orders");
  return response.data;
};


export const updateCustomOrderStatus = async (customOrderId, status) => {
  const response = await api.put(
    `/api/custom-orders/${customOrderId}/status`,
    { status }
  );

  return response.data;
};



export const setCustomOrderQuote = async (
  customOrderId,
  estimatedPrice,
  adminNotes = ""
) => {
  const response = await api.put(
    `/api/custom-orders/${customOrderId}/quote`,
    {
      estimated_price: Number(estimatedPrice),
      admin_notes: adminNotes,
    }
  );

  return response.data;
};


export const getAdminCustomOrder = async (customOrderId) => {
  const response = await api.get(
    `/api/custom-orders/${customOrderId}`
  );

  return response.data;
};

// =========================================================
// ADMIN PAYMENTS
// =========================================================

export const getAdminPayments = async () => {
  const response = await api.get("/api/admin/payments");

  return response.data;
};

// =========================================================
// PRODUCTS
// =========================================================

export const getAdminProducts = async () => {
  const response = await api.get("/api/products/admin");

  return response.data;
};

export const createAdminProduct = async (productData) => {
  const response = await api.post(
    "/api/products",
    productData
  );

  return response.data;
};

export const updateAdminProduct = async (
  productId,
  productData
) => {
  const response = await api.put(
    `/api/products/${productId}`,
    productData
  );

  return response.data;
};

export const deleteAdminProduct = async (productId) => {
  const response = await api.delete(
    `/api/products/${productId}`
  );

  return response.data;
};

// =========================================================
// PRODUCT ACTIVE / DEACTIVE
// =========================================================

export const updateProductStatus = async (
  productId,
  isActive
) => {
  const response = await api.put(
    `/api/products/${productId}`,
    {
      is_active: isActive,
    }
  );

  return response.data;
};

// =========================================================
// PRODUCT IMAGES
// =========================================================

export const uploadProductImage = async (
  productId,
  imageFile,
  isPrimary = false,
  displayOrder = 0
) => {
  const formData = new FormData();

  formData.append("product_id", productId);
  formData.append("image", imageFile);
  formData.append("is_primary", String(isPrimary));
  formData.append("display_order", String(displayOrder));

  const response = await api.post(
    "/api/product-images",
    formData,
    {
      headers: {
        "Content-Type": undefined,
      },
    }
  );

  return response.data;
};

// =========================================================
// CATEGORIES
// =========================================================

export const getAdminCategories = async () => {
  const response = await api.get("/api/categories/admin");

  return response.data;
};

export const createAdminCategory = async (categoryData) => {
  const response = await api.post(
    "/api/categories",
    categoryData
  );

  return response.data;
};

export const updateAdminCategory = async (
  categoryId,
  categoryData
) => {
  const response = await api.put(
    `/api/categories/${categoryId}`,
    categoryData
  );

  return response.data;
};

export const deleteAdminCategory = async (categoryId) => {
  const response = await api.delete(
    `/api/categories/${categoryId}`
  );

  return response.data;
};

export const updateCategoryStatus = async (
  categoryId,
  isActive
) => {
  const response = await api.put(
    `/api/categories/${categoryId}`,
    {
      is_active: isActive,
    }
  );

  return response.data;
};

// =========================================================
// ADMIN REVIEWS
// =========================================================

export const getAdminReviews = async () => {
  const response = await api.get("/api/admin/reviews");

  return response.data;
};

export const deleteAdminReview = async (reviewId) => {
  const response = await api.delete(
    `/api/admin/reviews/${reviewId}`
  );

  return response.data;
};

// =========================================================
// PROMOTIONS
// =========================================================

export const getAdminPromotions = async () => {
  const response = await api.get("/api/promotions");

  return response.data;
};

export const createPromotion = async (promotionData) => {
  const response = await api.post(
    "/api/promotions",
    promotionData
  );

  return response.data;
};

export const updatePromotion = async (
  promotionId,
  promotionData
) => {
  const response = await api.put(
    `/api/promotions/${promotionId}`,
    promotionData
  );

  return response.data;
};

export const deletePromotion = async (promotionId) => {
  const response = await api.delete(
    `/api/promotions/${promotionId}`
  );

  return response.data;
};

// =========================================================
// PROMO CODES
// =========================================================

export const getAdminPromoCodes = async () => {
  const response = await api.get("/api/promo-codes");

  return response.data;
};

export const createPromoCode = async (promoCodeData) => {
  const response = await api.post(
    "/api/promo-codes",
    promoCodeData
  );

  return response.data;
};

export const updatePromoCode = async (
  promoCodeId,
  promoCodeData
) => {
  const response = await api.put(
    `/api/promo-codes/${promoCodeId}`,
    promoCodeData
  );

  return response.data;
};

export const deletePromoCode = async (promoCodeId) => {
  const response = await api.delete(
    `/api/promo-codes/${promoCodeId}`
  );

  return response.data;
};

// =========================================================
// CONTACT MESSAGES
// =========================================================

export const getAdminContactMessages = async () => {
  const response = await api.get("/api/contact-messages");

  return response.data;
};

export const getAdminContactMessage = async (messageId) => {
  const response = await api.get(
    `/api/contact-messages/${messageId}`
  );

  return response.data;
};

export const updateContactMessageStatus = async (
  messageId,
  status
) => {
  const response = await api.put(
    `/api/contact-messages/${messageId}/status`,
    {
      status,
    }
  );

  return response.data;
};

export const deleteContactMessage = async (messageId) => {
  const response = await api.delete(
    `/api/contact-messages/${messageId}`
  );

  return response.data;
};


// =========================================================
// ADMIN NOTIFICATIONS
// =========================================================

export const createAdminNotification = async (
  notificationData,
  idempotencyKey
) => {
  const response = await api.post(
    "/api/notifications",
    notificationData,
    {
      headers: idempotencyKey
        ? { "Idempotency-Key": idempotencyKey }
        : {},
    }
  );

  return response.data;
};

export const broadcastAdminNotification = async (
  notificationData,
  idempotencyKey
) => {
  const response = await api.post(
    "/api/notifications/admin/broadcast",
    notificationData,
    {
      headers: idempotencyKey
        ? { "Idempotency-Key": idempotencyKey }
        : {},
    }
  );

  return response.data;
};

// =========================================================
// ADMIN PROFILE / SETTINGS
// =========================================================

export const getAdminProfile = async () => {
  const response = await api.get("/api/admin/profile");
  return response.data;
};

export const updateAdminProfile = async (profileData) => {
  const response = await api.put(
    "/api/admin/profile",
    profileData
  );

  return response.data;
};
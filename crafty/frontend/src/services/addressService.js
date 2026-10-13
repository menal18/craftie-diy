import api from "./api";

export const getAddresses = async () => {
  const response = await api.get("/api/addresses");
  return response.data;
};

export const getAddress = async (addressId) => {
  const response = await api.get(
    `/api/addresses/${addressId}`
  );
  return response.data;
};

export const createAddress = async (addressData) => {
  const response = await api.post(
    "/api/addresses",
    addressData
  );
  return response.data;
};

export const updateAddress = async (
  addressId,
  addressData
) => {
  const response = await api.put(
    `/api/addresses/${addressId}`,
    addressData
  );
  return response.data;
};

export const setDefaultAddress = async (addressId) => {
  const response = await api.put(
    `/api/addresses/${addressId}/default`
  );
  return response.data;
};

export const deleteAddress = async (addressId) => {
  const response = await api.delete(
    `/api/addresses/${addressId}`
  );
  return response.data;
};
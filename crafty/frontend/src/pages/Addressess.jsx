import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  LoaderCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "../services/addressService";

import "./Addressess.css";

function Addresses() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAddresses();

      const addressData = response?.addresses || response || [];

      setAddresses(
        Array.isArray(addressData) ? addressData : []
      );
    } catch (error) {
      console.error("Address loading error:", error);

      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          state: {
            from: "/addresses",
          },
        });

        return;
      }

      setError(
        error?.response?.data?.message ||
          "Unable to load your addresses."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
    });

    setEditingId(null);
    setShowForm(false);
  };

  const handleAdd = () => {
    setEditingId(null);

    setForm({
      name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
    });

    setShowForm(true);
  };

  const handleEdit = (address) => {
    setEditingId(address.id);

    setForm({
      name: address.name || "",
      phone: address.phone || "",
      address_line1: address.address_line1 || "",
      address_line2: address.address_line2 || "",
      city: address.city || "",
      state: address.state || "",
      postal_code: address.postal_code || "",
      country: address.country || "India",
    });

    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateAddress(editingId, form);
      } else {
        await createAddress(form);
      }

      resetForm();
      await loadAddresses();
    } catch (error) {
      console.error("Address save error:", error);

      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          state: {
            from: "/addresses",
          },
        });

        return;
      }

      setError(
        error?.response?.data?.message ||
          "Unable to save address."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDefault = async (addressId) => {
    try {
      setError("");

      await setDefaultAddress(addressId);

      await loadAddresses();
    } catch (error) {
      console.error("Default address error:", error);

      setError(
        error?.response?.data?.message ||
          "Unable to set default address."
      );
    }
  };

  const handleDelete = async (addressId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteAddress(addressId);

      await loadAddresses();
    } catch (error) {
      console.error("Address delete error:", error);

      setError(
        error?.response?.data?.message ||
          "Unable to delete address."
      );
    }
  };

  if (loading) {
    return (
      <main className="addresses-page">
        <div className="addresses-loading">
          <LoaderCircle
            size={34}
            className="addresses-spinner"
          />

          <p>Loading your addresses...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="addresses-page">
      <div className="addresses-container">

        {/* HEADER */}
        <section className="addresses-header">
          <div>
            <span className="addresses-eyebrow">
              MY ACCOUNT
            </span>

            <h1>My Addresses</h1>

            <p>
              Manage your saved delivery addresses.
            </p>
          </div>

          <button
            type="button"
            className="add-address-button"
            onClick={handleAdd}
          >
            <Plus size={18} />
            Add Address
          </button>
        </section>

        {/* ERROR */}
        {error && (
          <div className="address-error">
            {error}
          </div>
        )}

        {/* FORM */}
        {showForm && (
          <section className="address-form-card">

            <div className="form-header">
              <div>
                <span>
                  {editingId
                    ? "EDIT ADDRESS"
                    : "NEW ADDRESS"}
                </span>

                <h2>
                  {editingId
                    ? "Update Address"
                    : "Add New Address"}
                </h2>
              </div>

              <button
                type="button"
                className="close-form-button"
                onClick={resetForm}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="address-form-grid">

                <div className="form-group">
                  <label>Full Name *</label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address Line 1 *</label>

                  <input
                    type="text"
                    name="address_line1"
                    value={form.address_line1}
                    onChange={handleChange}
                    placeholder="House / Flat / Street"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address Line 2</label>

                  <input
                    type="text"
                    name="address_line2"
                    value={form.address_line2}
                    onChange={handleChange}
                    placeholder="Apartment, landmark, area"
                  />
                </div>

                <div className="form-group">
                  <label>City *</label>

                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>State *</label>

                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Postal Code *</label>

                  <input
                    type="text"
                    name="postal_code"
                    value={form.postal_code}
                    onChange={handleChange}
                    placeholder="Postal code"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Country *</label>

                  <input
                    type="text"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="Country"
                    required
                  />
                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-address-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="button-spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId
                        ? "Update Address"
                        : "Save Address"}
                    </>
                  )}
                </button>

              </div>

            </form>
          </section>
        )}

        {/* EMPTY STATE */}
        {addresses.length === 0 && !showForm ? (
          <section className="empty-address-card">

            <div className="empty-address-icon">
              <MapPin size={34} />
            </div>

            <h2>No saved addresses</h2>

            <p>
              Add a delivery address to make checkout
              faster and easier.
            </p>

            <button
              type="button"
              className="add-address-button"
              onClick={handleAdd}
            >
              <Plus size={18} />
              Add Your First Address
            </button>

          </section>
        ) : (
          <section className="addresses-list">

            {addresses.map((address) => (
              <article
                className={`address-card ${
                  address.is_default
                    ? "default-address"
                    : ""
                }`}
                key={address.id}
              >

                <div className="address-card-top">

                  <div className="address-icon">
                    <MapPin size={22} />
                  </div>

                  <div className="address-main">

                    <div className="address-title-row">

                      <h2>
                        {address.name ||
                          "Delivery Address"}
                      </h2>

                      {address.is_default && (
                        <span className="default-badge">
                          <Star size={12} />
                          Default
                        </span>
                      )}

                    </div>

                    <p className="address-phone">
                      {address.phone}
                    </p>

                  </div>

                </div>

                <div className="address-details">

                  <p>
                    {address.address_line1}
                  </p>

                  {address.address_line2 && (
                    <p>
                      {address.address_line2}
                    </p>
                  )}

                  <p>
                    {address.city},{" "}
                    {address.state}{" "}
                    {address.postal_code}
                  </p>

                  <p>
                    {address.country}
                  </p>

                </div>

                <div className="address-actions">

                  {!address.is_default && (
                    <button
                      type="button"
                      className="default-action"
                      onClick={() =>
                        handleDefault(address.id)
                      }
                    >
                      <Star size={16} />
                      Set Default
                    </button>
                  )}

                  <button
                    type="button"
                    className="edit-action"
                    onClick={() =>
                      handleEdit(address)
                    }
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-action"
                    onClick={() =>
                      handleDelete(address.id)
                    }
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>

                </div>

              </article>
            ))}

          </section>
        )}

      </div>
    </main>
  );
}

export default Addresses;
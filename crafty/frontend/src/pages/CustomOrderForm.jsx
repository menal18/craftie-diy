
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus } from "lucide-react";
import { createCustomOrder } from "../services/customOrderService";
import { createAddress, getAddresses } from "../services/addressService";
import { getProducts } from "../services/productService";
import "./CustomOrderForm.css";

export default function CustomOrderForm() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [addressForm, setAddressForm] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    address_type: "home",
    is_default: false,
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    customization_details: "",
    quantity: 1,
    product_id: "",
    reference_image_url: "",
  });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await getProducts();
        const list = Array.isArray(response)
          ? response
          : response.products || [];

        setProducts(list.filter((product) => product.is_active !== false));
      } catch {
        setError("Unable to load products. You can still submit without selecting a product.");
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await getAddresses();
        const addressList = response?.addresses || [];
        setAddresses(addressList);

        const defaultAddress = addressList.find(
          (address) => address.is_default
        );
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      } catch (err) {
        console.error("Custom order address loading error:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load your saved delivery addresses."
        );
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "quantity" ? value : value,
    }));
  };

  const handleAddressChange = (event) => {
    const { name, value, type, checked } = event.target;
    setAddressForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateAddress = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSavingAddress(true);
      const response = await createAddress(addressForm);
      const newAddress = response?.address;

      if (!newAddress?.id) {
        throw new Error("The saved address was not returned by the server.");
      }

      const refreshedResponse = await getAddresses();
      const refreshedAddresses = refreshedResponse?.addresses || [];
      const savedAddress =
        refreshedAddresses.find(
          (address) => String(address.id) === String(newAddress.id)
        ) || newAddress;

      setAddresses(
        refreshedAddresses.some(
          (address) => String(address.id) === String(newAddress.id)
        )
          ? refreshedAddresses
          : [...refreshedAddresses, newAddress]
      );
      setSelectedAddressId(savedAddress.id);
      setShowAddressForm(false);
      setAddressForm({
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        address_type: "home",
        is_default: false,
      });
      setSuccess("Address added and selected for delivery.");
    } catch (err) {
      console.error("Custom order address creation error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to add the delivery address."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (loadingAddresses || !selectedAddressId) {
      setError(
        addresses.length
          ? "Please select a delivery address."
          : "Please add a delivery address before submitting your custom order."
      );
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    if (form.reference_image_url.trim()) {
      try {
        const url = new URL(form.reference_image_url.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid URL");
        }
      } catch {
        setError("Enter a valid reference image URL.");
        return;
      }
    }

    setSubmitting(true);

    try {
      await createCustomOrder({
        title: form.title.trim(),
        description: form.description.trim(),
        customization_details: form.customization_details.trim() || null,
        quantity: Number(form.quantity),
        product_id: form.product_id ? Number(form.product_id) : null,
        reference_image_url: form.reference_image_url.trim() || null,
        address_id: selectedAddressId,
      });

      setSuccess("Your custom order request has been submitted!");
      setForm({
        title: "",
        description: "",
        customization_details: "",
        quantity: 1,
        product_id: "",
        reference_image_url: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to submit your request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="custom-order-page">
      <section className="custom-order-card">
        <p className="custom-order-eyebrow">MADE JUST FOR YOU</p>
        <h1>Request a Custom Order</h1>
        <p className="custom-order-intro">
          Share your idea and customization preferences with us.
        </p>

        {error && <div className="custom-order-message error">{error}</div>}
        {success && (
          <div className="custom-order-message success">
            {success}
            {success === "Your custom order request has been submitted!" && (
              <button type="button" onClick={() => navigate("/orders")}>
                View My Orders
              </button>
            )}
          </div>
        )}

        <section className="custom-order-delivery">
          <div className="custom-order-delivery-heading">
            <MapPin size={20} />
            <div>
              <h2>Delivery Address</h2>
              <p>Select where this custom order should be delivered.</p>
            </div>
          </div>

          {loadingAddresses ? (
            <p className="custom-order-address-message">
              Loading saved addresses...
            </p>
          ) : addresses.length > 0 ? (
            <div className="custom-order-address-list">
              {addresses.map((address) => (
                <button
                  type="button"
                  key={address.id}
                  className={`custom-order-address-option ${
                    String(selectedAddressId) === String(address.id)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setSelectedAddressId(address.id)}
                  aria-pressed={
                    String(selectedAddressId) === String(address.id)
                  }
                >
                  <span className="custom-order-address-radio">
                    {String(selectedAddressId) === String(address.id) && (
                      <span />
                    )}
                  </span>
                  <span className="custom-order-address-copy">
                    <span className="custom-order-address-top">
                      <strong>{address.full_name}</strong>
                      {address.is_default && (
                        <span className="custom-order-default-badge">
                          Default
                        </span>
                      )}
                    </span>
                    <span>{address.address_line1}</span>
                    {address.address_line2 && <span>{address.address_line2}</span>}
                    <span>
                      {[address.city, address.state, address.postal_code]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                    <span>{address.country}</span>
                    <span className="custom-order-address-phone">
                      {address.phone}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="custom-order-address-message">
              Please add a delivery address before submitting your custom order.
            </p>
          )}

          {addresses.length > 0 && !selectedAddressId && !loadingAddresses && (
            <p className="custom-order-address-message">
              Please select a delivery address.
            </p>
          )}

          <button
            type="button"
            className="custom-order-add-address"
            onClick={() => setShowAddressForm((visible) => !visible)}
          >
            <Plus size={17} />
            {showAddressForm ? "Close Address Form" : "Add New Address"}
          </button>

          {showAddressForm && (
            <form
              className="custom-order-address-form"
              onSubmit={handleCreateAddress}
            >
              <div className="custom-order-address-fields">
                <div>
                  <label htmlFor="address-full-name">Full Name</label>
                  <input
                    id="address-full-name"
                    name="full_name"
                    value={addressForm.full_name}
                    onChange={handleAddressChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="address-phone">Phone</label>
                  <input
                    id="address-phone"
                    name="phone"
                    type="tel"
                    value={addressForm.phone}
                    onChange={handleAddressChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div className="full-width">
                  <label htmlFor="address-line-1">Address Line 1</label>
                  <input
                    id="address-line-1"
                    name="address_line1"
                    value={addressForm.address_line1}
                    onChange={handleAddressChange}
                    placeholder="House / Flat / Street"
                    required
                  />
                </div>
                <div className="full-width">
                  <label htmlFor="address-line-2">
                    Address Line 2 <span>Optional</span>
                  </label>
                  <input
                    id="address-line-2"
                    name="address_line2"
                    value={addressForm.address_line2}
                    onChange={handleAddressChange}
                    placeholder="Apartment, landmark, etc."
                  />
                </div>
                <div>
                  <label htmlFor="address-city">City</label>
                  <input
                    id="address-city"
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="address-state">State</label>
                  <input
                    id="address-state"
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressChange}
                    placeholder="State"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="address-postal-code">Postal Code</label>
                  <input
                    id="address-postal-code"
                    name="postal_code"
                    value={addressForm.postal_code}
                    onChange={handleAddressChange}
                    placeholder="Postal code"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="address-country">Country</label>
                  <input
                    id="address-country"
                    name="country"
                    value={addressForm.country}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
              </div>
              <label className="custom-order-default-address">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={addressForm.is_default}
                  onChange={handleAddressChange}
                />
                Set as my default address
              </label>
              <button
                className="custom-order-add-address-submit"
                type="submit"
                disabled={savingAddress}
              >
                {savingAddress ? "Saving Address..." : "Save Address"}
              </button>
            </form>
          )}
        </section>

        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="E.g. Personalized handmade gift"
            maxLength={200}
            required
          />

          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe what you would like us to create..."
            rows={4}
            required
          />

          <label htmlFor="customization_details">Customization Details</label>
          <textarea
            id="customization_details"
            name="customization_details"
            value={form.customization_details}
            onChange={handleChange}
            placeholder="Colors, size, materials, names, design preferences..."
            rows={3}
          />

          <label htmlFor="quantity">Quantity *</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={handleChange}
            required
          />

          <label htmlFor="product_id">Related Product (Optional)</label>
          <select
            id="product_id"
            name="product_id"
            value={form.product_id}
            onChange={handleChange}
          >
            <option value="">No specific product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          {loadingProducts && <small>Loading products...</small>}

          <label htmlFor="reference_image_url">Reference Image URL (Optional)</label>
          <input
            id="reference_image_url"
            name="reference_image_url"
            type="url"
            value={form.reference_image_url}
            onChange={handleChange}
            placeholder="https://example.com/reference-image.jpg"
          />

          <button
            className="custom-order-submit"
            type="submit"
            disabled={
              submitting ||
              savingAddress ||
              loadingAddresses ||
              addresses.length === 0 ||
              !selectedAddressId
            }
          >
            {submitting ? "Submitting..." : "Submit Custom Order"}
          </button>
        </form>

        <p className="custom-order-note">
          Your request will be submitted with pending status while we review it.
        </p>
      </section>
    </main>
  );
}

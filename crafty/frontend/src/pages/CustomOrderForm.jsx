
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCustomOrder } from "../services/customOrderService";
import { getProducts } from "../services/productService";
import "./CustomOrderForm.css";

export default function CustomOrderForm() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      } catch (err) {
        setError("Unable to load products. You can still submit without selecting a product.");
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "quantity" ? value : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

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
            <button type="button" onClick={() => navigate("/orders")}>
              View My Orders
            </button>
          </div>
        )}

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
            disabled={submitting}
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

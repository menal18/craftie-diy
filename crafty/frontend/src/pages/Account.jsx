import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Package,
  Heart,
  MapPin,
  LogOut,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { getProfile } from "../services/authService";
import { useCart } from "../context/CartContext";

import "./Account.css";

function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { clearCart } = useCart();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getProfile();

      // Supports:
      // { user: {...} }
      // or direct user object
      const userData = response?.user || response;

      setUser(userData);
    } catch (error) {
      console.error("Profile error:", error);

      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          state: {
            from: "/account",
          },
        });

        return;
      }

      setError(
        error?.response?.data?.message || "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearCart();
    window.dispatchEvent(new Event("auth-change"));

    navigate("/login");
  };

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-loading">
          <LoaderCircle size={34} className="account-spinner" />
          <p>Loading your account...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="account-page">
        <div className="account-error">
          <h2>Unable to load account</h2>
          <p>{error}</p>

          <button type="button" onClick={loadProfile}>
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <div className="account-container">
        {/* Header */}
        <section className="account-header">
          <div>
            <span className="account-eyebrow">MY ACCOUNT</span>

            <h1>Welcome back</h1>

            <p>Manage your profile, orders, wishlist and saved addresses.</p>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </button>
        </section>

        {/* Profile Card */}
        <section className="profile-card">
          <div className="profile-avatar">
            <User size={34} />
          </div>

          <div className="profile-content">
            <span className="profile-label">CUSTOMER</span>

            <h2>{user?.name || "Customer"}</h2>

            <p>{user?.email || "Email unavailable"}</p>
          </div>
        </section>

        {/* Main Grid */}
        <section className="account-grid">
          {/* Profile Information */}
          <div className="account-information">
            <div className="section-title">
              <div>
                <span>YOUR DETAILS</span>
                <h2>Profile Information</h2>
              </div>

              <User size={22} />
            </div>

            <div className="profile-fields">
              <div className="profile-field">
                <div className="field-icon">
                  <User size={18} />
                </div>

                <div>
                  <span>Full Name</span>
                  <strong>{user?.name || "Not available"}</strong>
                </div>
              </div>

              <div className="profile-field">
                <div className="field-icon">
                  <Mail size={18} />
                </div>

                <div>
                  <span>Email Address</span>
                  <strong>{user?.email || "Not available"}</strong>
                </div>
              </div>

              <div className="profile-field">
                <div className="field-icon">
                  <Phone size={18} />
                </div>

                <div>
                  <span>Phone Number</span>
                  <strong>{user?.phone || "Not available"}</strong>
                </div>
              </div>

              <div className="profile-field">
                <div className="field-icon">
                  <User size={18} />
                </div>

                <div>
                  <span>Account Type</span>
                  <strong>{user?.role || "customer"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="account-links">
            <div className="section-title">
              <div>
                <span>QUICK ACCESS</span>
                <h2>My Shopping</h2>
              </div>
            </div>

            <Link to="/orders" className="account-link-card">
              <div className="account-link-icon">
                <Package size={21} />
              </div>

              <div>
                <strong>My Orders</strong>
                <span>View your orders and order status</span>
              </div>

              <ArrowRight size={18} />
            </Link>

            <Link to="/wishlist" className="account-link-card">
              <div className="account-link-icon">
                <Heart size={21} />
              </div>

              <div>
                <strong>Wishlist</strong>
                <span>View your saved products</span>
              </div>

              <ArrowRight size={18} />
            </Link>

            <Link to="/addresses" className="account-link-card">
              <div className="account-link-icon">
                <MapPin size={21} />
              </div>

              <div>
                <strong>My Addresses</strong>
                <span>Manage your delivery addresses</span>
              </div>

              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Account;

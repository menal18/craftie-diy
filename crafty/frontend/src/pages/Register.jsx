import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { registerUser } from "../services/authService";
import craftieLogo from "../assets/Craftie-Diy-Logo.png";

import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      setSuccess(
        response?.message ||
          "Registration successful. You can now login."
      );

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">

      <div className="auth-wrapper">

        {/* BRAND */}

        <section className="auth-brand">

          <div className="auth-brand-content">

            <span className="auth-brand-small">
              CRAFTIEDIY
            </span>

            <h1>
              Made for
              <br />
              <em>your story.</em>
            </h1>

            <p>
              Join our creative community and
              discover unique handmade products
              created with care and imagination.
            </p>

            <div className="auth-brand-line"></div>

            <span className="auth-brand-note">
              Handcrafted • Thoughtful • Unique
            </span>

          </div>

        </section>

        {/* REGISTER */}

        <section className="auth-form-panel">

          <div className="auth-form-container">

            {/* <div className="auth-mobile-brand">
              <span>CRAFTIEDIY</span>
            </div> */}

            <div className="auth-mobile-brand">
  <img
    src={craftieLogo}
    alt="Craftie DIY"
    className="auth-logo"
  />
</div>
            <div className="auth-heading">

              <span className="auth-eyebrow">
                CREATE ACCOUNT
              </span>

              <h2>
                Start your journey
              </h2>

              <p>
                Create an account to save your
                favorites and manage your orders.
              </p>

            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {success && (
              <div className="auth-success">
                {success}
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >

              {/* NAME */}

              <div className="auth-field">

                <label htmlFor="name">
                  Full Name
                </label>

                <div className="auth-input-wrapper">

                  <UserRound size={18} />

                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    autoComplete="name"
                  />

                </div>

              </div>

              {/* EMAIL */}

              <div className="auth-field">

                <label htmlFor="email">
                  Email Address
                </label>

                <div className="auth-input-wrapper">

                  <Mail size={18} />

                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />

                </div>

              </div>

              {/* PHONE */}

              <div className="auth-field">

                <label htmlFor="phone">
                  Phone Number
                </label>

                <div className="auth-input-wrapper">

                  <Phone size={18} />

                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                    autoComplete="tel"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="auth-field">

                <label htmlFor="password">
                  Password
                </label>

                <div className="auth-input-wrapper">

                  <LockKeyhole size={18} />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="auth-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}

              </button>

            </form>

            <div className="auth-divider">
              <span>ALREADY A MEMBER?</span>
            </div>

            <Link
              to="/login"
              className="auth-secondary-btn"
            >
              Sign In
            </Link>

            <Link
              to="/"
              className="auth-back-home"
            >
              Continue as guest
            </Link>

          </div>

        </section>

      </div>

    </main>
  );
};

export default Register;
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { loginUser } from "../services/authService";
import { useCart } from "../context/CartContext";
import craftieLogo from "../assets/Craftie-Diy-Logo.png";

import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { refreshCart } = useCart();

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

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      /*
       * Expected backend response:
       *
       * {
       *   message: "Login successful",
       *   token: "...",
       *   user: {...}
       * }
       */

      if (!response?.token) {
        throw new Error("Login successful, but no token was returned.");
      }

      localStorage.setItem("token", response.token);

      localStorage.setItem("user", JSON.stringify(response.user));
      window.dispatchEvent(new Event("auth-change"));
      await refreshCart();

      // const redirectPath =
      //   location.state?.from || "/";

      // navigate(redirectPath, {
      //   replace: true,
      // });
      let redirectPath = "/";

      if (response.user?.role === "admin") {
        redirectPath = "/admin/dashboard";
      } else if (location.state?.from) {
        redirectPath = location.state.from;
      }

      navigate(redirectPath, {
        replace: true,
      });
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to login. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-wrapper">
        {/* LEFT BRAND PANEL */}

        <section className="auth-brand">
          <div className="auth-brand-content">
            <span className="auth-brand-small">CRAFTIEDIY</span>

            <h1>
              Handmade
              <br />
              <em>with heart.</em>
            </h1>

            <p>
              Discover thoughtfully crafted pieces made to bring warmth,
              creativity and personality into your everyday life.
            </p>

            <div className="auth-brand-line"></div>

            <span className="auth-brand-note">
              Handcrafted • Thoughtful • Unique
            </span>
          </div>
        </section>

        {/* LOGIN PANEL */}

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
              <span className="auth-eyebrow">WELCOME BACK</span>

              <h2>Sign in to your account</h2>

              <p>
                Access your orders, wishlist and personalized shopping
                experience.
              </p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              {/* EMAIL */}

              <div className="auth-field">
                <label htmlFor="email">Email Address</label>

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

              {/* PASSWORD */}

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="password">Password</label>

                  <button
                    type="button"
                    className="forgot-password"
                    onClick={() => {
                      setError("Password reset is not available yet.");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="auth-input-wrapper">
                  <LockKeyhole size={18} />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* SUBMIT */}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="auth-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>NEW TO CRAFTIEDIY?</span>
            </div>

            <Link to="/register" className="auth-secondary-btn">
              Create an Account
            </Link>

            <Link to="/" className="auth-back-home">
              Continue as guest
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;

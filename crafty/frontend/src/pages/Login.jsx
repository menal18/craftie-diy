import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { loginUser } from "../services/authService";
import { useCart } from "../context/CartContext";

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
    <main className="auth-page auth-login-page">
      <div className="auth-wrapper">
        <section className="auth-brand">
          <div className="auth-brand-content">
            <span className="auth-brand-small">CRAFTIEDIY · HANDMADE WITH LOVE</span>
            <h1>
              Thoughtful gifts,
              <br />
              <em>made to be kept.</em>
            </h1>
            <p>
              Discover one-of-a-kind creations, made by hand and chosen with
              heart for life’s most meaningful moments.
            </p>
            <span className="auth-brand-note">HANDCRAFTED · THOUGHTFUL · UNIQUE</span>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-container">
            <div className="auth-form-card">
              <div className="auth-heading">
                <span className="auth-eyebrow">WELCOME BACK</span>
                <h1>Welcome Back, Craft Lover!</h1>
                <p>Your favourite handmade gifts are waiting for you.</p>
              </div>

              {error && (
                <div className="auth-error" role="alert" aria-live="polite">
                  {error}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label htmlFor="email">Email Address</label>

                  <div className="auth-input-wrapper">
                    <Mail size={18} aria-hidden="true" />
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
                    <LockKeyhole size={18} aria-hidden="true" />
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

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
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

              <p className="auth-switch">
                New to CraftieDIY? <Link to="/register">Create an account.</Link>
              </p>
            </div>

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

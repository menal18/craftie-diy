import { useState } from "react";
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
    <main className="auth-page auth-register-page">
      <div className="auth-wrapper">
        <section className="auth-brand">
          <div className="auth-brand-content">
            <span className="auth-brand-small">CRAFTIEDIY · HANDMADE WITH LOVE</span>
            <h1>
              Made with care,
              <br />
              <em>made for your story.</em>
            </h1>
            <p>
              Join a community that celebrates thoughtful gifting, little
              details and the joy of something made by hand.
            </p>
            <span className="auth-brand-note">HANDCRAFTED · THOUGHTFUL · UNIQUE</span>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-container">
            <div className="auth-form-card">
              <div className="auth-heading">
                <span className="auth-eyebrow">JOIN THE CRAFTIE COMMUNITY</span>
                <h1>Create your account</h1>
                <p>
                  Save your favourite finds and keep every thoughtful order
                  close at hand.
                </p>
              </div>

              {error && (
                <div className="auth-error" role="alert" aria-live="polite">
                  {error}
                </div>
              )}

              {success && (
                <div className="auth-success" role="status" aria-live="polite">
                  {success}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label htmlFor="name">Full Name</label>
                  <div className="auth-input-wrapper">
                    <UserRound size={18} aria-hidden="true" />
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
                  <label htmlFor="phone">Phone Number</label>
                  <div className="auth-input-wrapper">
                    <Phone size={18} aria-hidden="true" />
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

                <div className="auth-field">
                  <label htmlFor="password">Password</label>
                  <div className="auth-input-wrapper">
                    <LockKeyhole size={18} aria-hidden="true" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      autoComplete="new-password"
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

              <p className="auth-switch">
                Already have an account? <Link to="/login">Sign in.</Link>
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

export default Register;
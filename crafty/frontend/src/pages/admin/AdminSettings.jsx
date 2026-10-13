import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAdminProfile,
  updateAdminProfile,
} from "../../services/adminService";

import "./AdminSettings.css";

const AdminSettings = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAdminProfile();

        const adminProfile = response.profile;

        setProfile(adminProfile);

        setName(adminProfile.name || "");
        setEmail(adminProfile.email || "");
        setPhone(adminProfile.phone || "");
      } catch (err) {
        console.error(
          "Admin profile loading error:",
          err
        );

        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Failed to load admin profile"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Password validation only when user wants
    // to change the password.

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setError(
          "Current password is required to change password"
        );
        return;
      }

      if (newPassword.length < 6) {
        setError(
          "New password must be at least 6 characters"
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        return;
      }
    }

    try {
      setSaving(true);

      const profileData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };

      if (newPassword) {
        profileData.current_password =
          currentPassword;

        profileData.new_password =
          newPassword;
      }

      const response =
        await updateAdminProfile(profileData);

      const updatedProfile = response.profile;

      setProfile(updatedProfile);
      window.dispatchEvent(
        new CustomEvent("admin-profile-updated", {
          detail: updatedProfile,
        })
      );

      setName(updatedProfile.name || "");
      setEmail(updatedProfile.email || "");
      setPhone(updatedProfile.phone || "");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Keep local user information updated
      const storedUser =
        localStorage.getItem("user");

      if (storedUser) {
        try {
          const parsedUser =
            JSON.parse(storedUser);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...parsedUser,
              ...updatedProfile,
            })
          );
        } catch (storageError) {
          console.error(
            "Failed to update local user:",
            storageError
          );
        }
      }

      setSuccess(
        "Admin profile updated successfully"
      );
    } catch (err) {
      console.error(
        "Admin profile update error:",
        err
      );

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to update admin profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-settings-page">
        <div className="settings-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-settings-page">

      {/* HEADER */}

      <div className="settings-page-header">
        <div>
          <h1>Settings</h1>

          <p>
            Manage your admin profile and account
            security.
          </p>
        </div>

        <div className="settings-header-icon">
          <Shield size={28} />
        </div>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="settings-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="settings-alert success">
          {success}
        </div>
      )}

      <form
        className="settings-form"
        onSubmit={handleSubmit}
      >

        {/* PROFILE INFORMATION */}

        <div className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <User size={21} />
            </div>

            <div>
              <h2>Profile Information</h2>

              <p>
                Update your admin account details.
              </p>
            </div>

          </div>

          <div className="settings-card-body">

            <div className="settings-grid">

              {/* NAME */}

              <div className="settings-field">

                <label>Name</label>

                <div className="settings-input-wrapper">

                  <User size={18} />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Enter your name"
                  />

                </div>

              </div>

              {/* EMAIL */}

              <div className="settings-field">

                <label>Email</label>

                <div className="settings-input-wrapper">

                  <Mail size={18} />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email"
                  />

                </div>

              </div>

              {/* PHONE */}

              <div className="settings-field">

                <label>Phone</label>

                <div className="settings-input-wrapper">

                  <Phone size={18} />

                  <input
                    type="text"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    placeholder="Enter your phone"
                  />

                </div>

              </div>

              {/* ROLE */}

              <div className="settings-field">

                <label>Role</label>

                <div className="settings-role">

                  <Shield size={18} />

                  <span>
                    {profile?.role || "admin"}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* SECURITY */}

        <div className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <Lock size={21} />
            </div>

            <div>
              <h2>Change Password</h2>

              <p>
                Leave these fields empty if you don't
                want to change your password.
              </p>
            </div>

          </div>

          <div className="settings-card-body">

            <div className="settings-grid">

              {/* CURRENT PASSWORD */}

              <div className="settings-field">

                <label>
                  Current Password
                </label>

                <div className="settings-input-wrapper">

                  <Lock size={18} />

                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) =>
                      setCurrentPassword(
                        e.target.value
                      )
                    }
                    placeholder="Current password"
                  />

                </div>

              </div>

              {/* NEW PASSWORD */}

              <div className="settings-field">

                <label>
                  New Password
                </label>

                <div className="settings-input-wrapper">

                  <Lock size={18} />

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                    placeholder="New password"
                  />

                </div>

              </div>

              {/* CONFIRM PASSWORD */}

              <div className="settings-field">

                <label>
                  Confirm New Password
                </label>

                <div className="settings-input-wrapper">

                  <Lock size={18} />

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm new password"
                  />

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* SAVE */}

        <div className="settings-actions">

          <button
            type="submit"
            disabled={saving}
          >
            <Save size={18} />

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </form>

    </div>
  );
};

export default AdminSettings;
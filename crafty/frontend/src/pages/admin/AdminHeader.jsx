import { useState } from "react";
import { UserRound } from "lucide-react";

import "./AdminHeader.css";

function getInitials(name) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || null
  );
}

function AdminHeader({ title, profile, logo }) {
  const profileImage =
    profile?.profile_image_url || profile?.avatar_url || profile?.image_url;
  const [failedImage, setFailedImage] = useState(null);
  const displayName = profile?.name || "Profile unavailable";
  const displayRole = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "";

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-heading">
        <div className="admin-topbar-brand">
          <img src={logo} alt="CraftieDIY" />
          <p className="admin-topbar-label">CRAFTIEDIY</p>
        </div>
        <h1>{title}</h1>
      </div>

      <div className="admin-profile">
        <div className="admin-profile-avatar">
          {profileImage && profileImage !== failedImage ? (
            <img
              src={profileImage}
              alt=""
              onError={() => setFailedImage(profileImage)}
            />
          ) : (
            getInitials(profile?.name) || <UserRound size={19} />
          )}
        </div>

        <div className="admin-profile-details">
          <strong>{displayName}</strong>
          {displayRole && <span>{displayRole}</span>}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;

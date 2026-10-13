import { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Star,
  Megaphone,
  TicketPercent,
  ClipboardList,
  Mail,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import "./AdminLayout.css";
import craftieLogo from "../../assets/Craftie-Diy-Logo.png";
import { getAdminProfile } from "../../services/adminService";
import AdminHeader from "./AdminHeader";

const ADMIN_PAGE_TITLES = {
  "/admin": "Dashboard",
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/orders": "Orders",
  "/admin/users": "Customers",
  "/admin/reviews": "Reviews",
  "/admin/promotions": "Promotions",
  "/admin/promo-codes": "Promo Codes",
  "/admin/custom-orders": "Custom Orders",
  "/admin/contact-messages": "Contact Messages",
  "/admin/notifications": "Notifications",
  "/admin/settings": "Settings",
};

const menuItems = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: Package,
  },
  {
    label: "Categories",
    path: "/admin/categories",
    icon: FolderTree,
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    label: "Customers",
    path: "/admin/users",
    icon: Users,
  },
  {
    label: "Reviews",
    path: "/admin/reviews",
    icon: Star,
  },
  {
    label: "Promotions",
    path: "/admin/promotions",
    icon: Megaphone,
  },
  {
    label: "Promo Codes",
    path: "/admin/promo-codes",
    icon: TicketPercent,
  },
  {
    label: "Custom Orders",
    path: "/admin/custom-orders",
    icon: ClipboardList,
  },
  {
    label: "Contact Messages",
    path: "/admin/contact-messages",
    icon: Mail,
  },
  {
    label: "Notifications",
    path: "/admin/notifications",
    icon: Bell,
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    let active = true;

    const loadAdminProfile = async () => {
      try {
        const response = await getAdminProfile();
        if (!response?.profile) {
          throw new Error("Admin profile was missing from the API response");
        }
        if (active) {
          setAdminProfile(response.profile);
        }
      } catch (error) {
        console.error("Admin header profile loading error:", error);
        if (!active) return;

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      }
    };

    loadAdminProfile();

    const handleProfileUpdate = (event) => {
      if (event.detail) {
        setAdminProfile(event.detail);
      }
    };

    window.addEventListener("admin-profile-updated", handleProfileUpdate);

    return () => {
      active = false;
      window.removeEventListener("admin-profile-updated", handleProfileUpdate);
    };
  }, [navigate]);

  const currentPath = location.pathname.replace(/\/+$/, "") || "/";
  const pageTitle = ADMIN_PAGE_TITLES[currentPath] || "Admin Panel";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="admin-layout">

      {/* Mobile Header */}
      <header className="admin-mobile-header">
        <button
          type="button"
          className="admin-menu-button"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={22} />
        </button>

        <Link
          to="/admin/dashboard"
          className="admin-mobile-brand"
          aria-label="Craftie DIY Admin Dashboard"
        >
          <img src={craftieLogo} alt="" />
          <span>Craftie</span>
          <strong>DIY</strong>
        </Link>
        <span className="admin-mobile-page-title">{pageTitle}</span>
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "admin-sidebar-open" : ""
        }`}
      >

        {/* Brand */}
        <div className="admin-sidebar-brand">
          <Link
            to="/admin/dashboard"
            className="admin-sidebar-brand-link"
            aria-label="Craftie DIY Admin Dashboard"
            onClick={() => setSidebarOpen(false)}
          >
            <img src={craftieLogo} alt="" />
            <span>Craftie</span>
            <strong>DIY</strong>
          </Link>

          <button
            type="button"
            className="admin-close-button"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Admin label */}
        <div className="admin-sidebar-label">
          ADMIN PANEL
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav">

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `admin-nav-link ${
                    isActive ? "admin-nav-link-active" : ""
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={19} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}

        </nav>

        {/* Bottom section */}
        <div className="admin-sidebar-bottom">

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={19} />

            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* Main Area */}
      <main className="admin-main">

        {/* Desktop Topbar */}
        <AdminHeader
          title={pageTitle}
          profile={adminProfile}
          logo={craftieLogo}
        />

        {/* Page Content */}
        <section className="admin-content">
          <Outlet />
        </section>

      </main>

    </div>
  );
}

export default AdminLayout;
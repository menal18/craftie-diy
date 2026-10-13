

import { useEffect, useState } from "react";
import {
  Users,
  Package,
  ShoppingBag,
  IndianRupee,
  Clock3,
  CheckCircle2,
  XCircle,
  Layers3,
  CreditCard,
  RefreshCw,
  LogOut,
  ArrowUpRight,
  UserRound,
  Boxes,
  ClipboardList,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getAdminDashboard } from "../../services/adminService";
import { useCart } from "../../context/CartContext";

import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { clearCart } = useCart();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminDashboard();

      setDashboard(response?.dashboard || null);
    } catch (error) {
      console.error("Admin dashboard error:", error);

      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          state: {
            from: "/admin/dashboard",
          },
        });

        return;
      }

      if (error?.response?.status === 403) {
        setError("You do not have permission to access the admin dashboard.");
        return;
      }

      setError(error?.response?.data?.message || "Unable to load dashboard.");
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
      <main className="admin-dashboard-page">
        <div className="admin-loading-screen">
          <div className="admin-loading-icon">
            <RefreshCw size={28} />
          </div>

          <h2>Loading dashboard</h2>
          <p>Preparing your store overview...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="admin-dashboard-page">
        <div className="admin-dashboard-container">
          <div className="admin-error-card">
            <div className="admin-error-icon">
              <XCircle size={30} />
            </div>

            <div>
              <h2>Unable to load dashboard</h2>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="admin-retry-button"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const users = dashboard?.users || {};
  const products = dashboard?.products || {};
  const categories = dashboard?.categories || {};
  const orders = dashboard?.orders || {};
  const customOrders = dashboard?.custom_orders || {};
  const payments = dashboard?.payments || {};
  const revenue = dashboard?.revenue || {};

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        {/* ================= HEADER ================= */}

        <header className="admin-dashboard-header">
          <div className="admin-heading-area">
            <div className="admin-heading-label">
              <span className="admin-heading-dot"></span>
              CRAFTIEDIY ADMIN
            </div>

            <h1>Dashboard</h1>

            <p>Welcome back. Here's what's happening with your store today.</p>
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-refresh-button"
              onClick={loadDashboard}
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="admin-logout-button"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* ================= PRIMARY STATS ================= */}

        <section className="admin-primary-grid">
          {/* Revenue */}

          <div className="admin-primary-card revenue-card">
            <div className="admin-card-top">
              <div className="admin-primary-icon">
                <IndianRupee size={21} />
              </div>

              <span className="admin-card-badge">REVENUE</span>
            </div>

            <div className="admin-primary-content">
              <span>Total Revenue</span>

              <h2>
                ₹{Number(revenue.total_revenue || 0).toLocaleString("en-IN")}
              </h2>

              <p>
                <CheckCircle2 size={14} />
                From paid orders
              </p>
            </div>
          </div>

          {/* Orders */}

          <div className="admin-primary-card">
            <div className="admin-card-top">
              <div className="admin-primary-icon">
                <ShoppingBag size={21} />
              </div>

              <span className="admin-card-badge">ORDERS</span>
            </div>

            <div className="admin-primary-content">
              <span>Total Orders</span>

              <h2>{orders.total_orders || 0}</h2>

              <p>
                <Clock3 size={14} />
                {orders.pending_orders || 0} pending
              </p>
            </div>
          </div>

          {/* Customers */}

          <div className="admin-primary-card">
            <div className="admin-card-top">
              <div className="admin-primary-icon">
                <Users size={21} />
              </div>

              <span className="admin-card-badge">CUSTOMERS</span>
            </div>

            <div className="admin-primary-content">
              <span>Total Customers</span>

              <h2>{users.total_customers || 0}</h2>

              <p>
                <UserRound size={14} />
                {users.total_users || 0} total users
              </p>
            </div>
          </div>

          {/* Products */}

          <div className="admin-primary-card">
            <div className="admin-card-top">
              <div className="admin-primary-icon">
                <Package size={21} />
              </div>

              <span className="admin-card-badge">CATALOG</span>
            </div>

            <div className="admin-primary-content">
              <span>Total Products</span>

              <h2>{products.total_products || 0}</h2>

              <p>
                <CheckCircle2 size={14} />
                {products.active_products || 0} active
              </p>
            </div>
          </div>
        </section>

        {/* ================= SECTION HEADER ================= */}

        <section className="admin-dashboard-section">
          <div className="admin-section-header">
            <div>
              <span className="admin-section-label">STORE OVERVIEW</span>

              <h2>Business Statistics</h2>

              <p>Monitor orders, catalog, payments and custom requests.</p>
            </div>
          </div>

          {/* ================= OVERVIEW CARDS ================= */}

          <div className="admin-overview-grid">
            {/* Orders */}

            <article className="admin-overview-card">
              <div className="overview-header">
                <div className="overview-title">
                  <div className="overview-icon">
                    <ShoppingBag size={18} />
                  </div>

                  <div>
                    <span>ORDERS</span>
                    <h3>Order Status</h3>
                  </div>
                </div>

                <ArrowUpRight size={18} className="overview-arrow" />
              </div>

              <div className="overview-stat-list">
                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <span className="status-dot pending"></span>
                    <span>Pending</span>
                  </div>

                  <strong>{orders.pending_orders || 0}</strong>
                </div>

                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <span className="status-dot completed"></span>
                    <span>Completed</span>
                  </div>

                  <strong>{orders.completed_orders || 0}</strong>
                </div>

                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <span className="status-dot cancelled"></span>
                    <span>Cancelled</span>
                  </div>

                  <strong>{orders.cancelled_orders || 0}</strong>
                </div>
              </div>
            </article>

            {/* Catalog */}

            <article className="admin-overview-card">
              <div className="overview-header">
                <div className="overview-title">
                  <div className="overview-icon">
                    <Layers3 size={18} />
                  </div>

                  <div>
                    <span>CATALOG</span>
                    <h3>Products & Categories</h3>
                  </div>
                </div>

                <ArrowUpRight size={18} className="overview-arrow" />
              </div>

              <div className="overview-stat-list">
                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <Package size={15} />
                    <span>Products</span>
                  </div>

                  <strong>{products.total_products || 0}</strong>
                </div>

                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <CheckCircle2 size={15} />
                    <span>Active Products</span>
                  </div>

                  <strong>{products.active_products || 0}</strong>
                </div>

                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <Layers3 size={15} />
                    <span>Categories</span>
                  </div>

                  <strong>{categories.total_categories || 0}</strong>
                </div>
              </div>
            </article>

            {/* Payments */}

            <article className="admin-overview-card">
              <div className="overview-header">
                <div className="overview-title">
                  <div className="overview-icon">
                    <CreditCard size={18} />
                  </div>

                  <div>
                    <span>PAYMENTS</span>
                    <h3>Payment Overview</h3>
                  </div>
                </div>

                <ArrowUpRight size={18} className="overview-arrow" />
              </div>

              <div className="overview-stat-list">
                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <WalletCards size={15} />
                    <span>Total Payments</span>
                  </div>

                  <strong>{payments.total_payments || 0}</strong>
                </div>

                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <CheckCircle2 size={15} />
                    <span>Paid</span>
                  </div>

                  <strong>{payments.paid_payments || 0}</strong>
                </div>

                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <Clock3 size={15} />
                    <span>Pending</span>
                  </div>

                  <strong>{payments.pending_payments || 0}</strong>
                </div>

                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <XCircle size={15} />
                    <span>Failed</span>
                  </div>

                  <strong>{payments.failed_payments || 0}</strong>
                </div>
              </div>
            </article>

            {/* Custom Orders */}

            <article className="admin-overview-card">
              <div className="overview-header">
                <div className="overview-title">
                  <div className="overview-icon">
                    <Boxes size={18} />
                  </div>

                  <div>
                    <span>CUSTOM ORDERS</span>
                    <h3>Custom Requests</h3>
                  </div>
                </div>

                <ArrowUpRight size={18} className="overview-arrow" />
              </div>

              <div className="overview-stat-list">
                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <ClipboardList size={15} />
                    <span>All Requests</span>
                  </div>

                  <strong>{customOrders.total_custom_orders || 0}</strong>
                </div>

                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <Clock3 size={15} />
                    <span>Pending</span>
                  </div>

                  <strong>{customOrders.pending_custom_orders || 0}</strong>
                </div>

                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <CreditCard size={15} />
                    <span>Quoted</span>
                  </div>

                  <strong>{customOrders.quoted_custom_orders || 0}</strong>
                </div>

                <div className="overview-stat-row">
                  <div className="overview-stat-name">
                    <CheckCircle2 size={15} />
                    <span>Accepted</span>
                  </div>

                  <strong>{customOrders.accepted_custom_orders || 0}</strong>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ================= QUICK ACTIONS ================= */}

        <section className="admin-dashboard-section">
          <div className="admin-section-header">
            <div>
              <span className="admin-section-label">MANAGEMENT</span>

              <h2>Quick Actions</h2>

              <p>Manage your CraftieDIY store from one place.</p>
            </div>
          </div>

          <div className="admin-action-grid">
            {/* Products */}

            <button
              type="button"
              className="admin-action-card"
              onClick={() => navigate("/admin/products")}
            >
              <div className="action-card-icon">
                <Package size={22} />
              </div>

              <div className="action-card-content">
                <h3>Manage Products</h3>

                <p>Add, edit and manage your product catalog.</p>
              </div>

              <ArrowUpRight size={19} className="action-card-arrow" />
            </button>

            {/* Orders */}

            <button
              type="button"
              className="admin-action-card"
              onClick={() => navigate("/admin/orders")}
            >
              <div className="action-card-icon">
                <ShoppingBag size={22} />
              </div>

              <div className="action-card-content">
                <h3>Manage Orders</h3>

                <p>View and update customer orders.</p>
              </div>

              <ArrowUpRight size={19} className="action-card-arrow" />
            </button>

            {/* Users */}

            <button
              type="button"
              className="admin-action-card"
              onClick={() => navigate("/admin/users")}
            >
              <div className="action-card-icon">
                <Users size={22} />
              </div>

              <div className="action-card-content">
                <h3>Manage Users</h3>

                <p>View customers and administrators.</p>
              </div>

              <ArrowUpRight size={19} className="action-card-arrow" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminDashboard;



import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Collections from "./pages/Collections";
import Bestsellers from "./pages/Bestsellers";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import Notifications from "./pages/Notifications";
import Account from "./pages/Account";
import Addresses from "./pages/Addressess";
import CustomOrderForm from "./pages/CustomOrderForm";

import About from "./pages/About";
import Contact from "./pages/Contact";

import Footer from "./components/Footer";

/* Admin */
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import AdminCustomOrders from "./pages/admin/AdminCustomOrders";
import AdminContactMessages from "./pages/admin/AdminContactMessages";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSettings from "./pages/admin/AdminSettings";
function AppContent() {
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="app-layout">
      {!isAdminPage && <Navbar />}

      <div className="main-content">
        <Routes>

        {/* =========================
            CUSTOMER ROUTES
        ========================= */}

        <Route path="/" element={<Home />} />

        <Route path="/shop" element={<Shop />} />

        <Route path="/collections" element={<Collections />} />

        <Route path="/bestsellers" element={<Bestsellers />} />

        <Route
          path="/product/:id"
          element={<ProductDetails />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/wishlist"
          element={<Wishlist />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/order-success"
          element={<OrderSuccess />}
        />

        <Route
          path="/orders"
          element={<Orders />}
        />

        <Route
          path="/notifications"
          element={<Notifications />}
        />

        <Route
          path="/account"
          element={<Account />}
        />

        <Route
          path="/addresses"
          element={<Addresses />}
        />

        <Route
  path="/custom-order"
  element={<CustomOrderForm />}
/>

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />


        {/* =========================
            ADMIN ROUTES
        ========================= */}

        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="products"
            element={<AdminProducts />}
          />

          <Route
            path="orders"
            element={<AdminOrders />}
          />

          <Route
            path="categories"
            element={<AdminCategories />}
          />
          <Route
  path="/admin/users"
  element={<AdminCustomers />}
/>
<Route
  path="/admin/reviews"
  element={<AdminReviews />}
/>

<Route
  path="/admin/promotions"
  element={<AdminPromotions />}
/>
<Route
  path="/admin/promo-codes"
  element={<AdminPromoCodes />}

/>

<Route
  path="/admin/custom-orders"
  element={<AdminCustomOrders />}
/>

<Route
  path="/admin/contact-messages"
  element={<AdminContactMessages />}


/>
<Route
  path="/admin/notifications"
  element={<AdminNotifications />}
/>
<Route
  path="/admin/settings"
  element={<AdminSettings />}
/>
        </Route>

        </Routes>
      </div>

      {!isAdminPage && <Footer />}
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
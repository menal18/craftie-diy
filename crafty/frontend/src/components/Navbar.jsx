

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import "./Navbar.css";

import { useCart } from "../context/CartContext";
import { searchProducts } from "../services/productService";

import craftieLogo from "../assets/Craftie-Diy-Logo.png";


function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchInputRef = useRef(null);
  const searchPanelRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const searchRequestRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const { cartCount } = useCart();

  const closeSearch = useCallback(() => {
    window.clearTimeout(searchTimeoutRef.current);
    searchRequestRef.current?.abort();
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setSearchLoading(false);
  }, []);


  /* =========================================
     CHECK LOGIN
  ========================================= */

  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("token")));
    };

    checkLogin();

    window.addEventListener("storage", checkLogin);

    return () => {
      window.removeEventListener("storage", checkLogin);
    };
  }, [location.pathname]);


  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        closeSearch();
      }
    };

    const closeOnOutsideClick = (event) => {
      const target = event.target;

      if (
        target instanceof Element &&
        !searchPanelRef.current?.contains(target) &&
        !target.closest(".navbar-search-trigger")
      ) {
        closeSearch();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [searchOpen, closeSearch]);

  useEffect(() => () => {
    window.clearTimeout(searchTimeoutRef.current);
    searchRequestRef.current?.abort();
  }, []);

  const toggleSearch = () => {
    setMobileMenu(false);
    if (searchOpen) {
      closeSearch();
      return;
    }

    setSearchOpen(true);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (searchResults.length > 0) {
      navigate(`/product/${searchResults[0].id}`);
      closeSearch();
    }
  };

  const handleSearchInputChange = (event) => {
    const value = event.target.value;
    setSearchQuery(value);

    window.clearTimeout(searchTimeoutRef.current);
    searchRequestRef.current?.abort();

    if (!value.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }

    const controller = new AbortController();
    searchRequestRef.current = controller;
    setSearchResults([]);
    setSearchLoading(true);
    setSearchError("");

    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const response = await searchProducts(value.trim(), {
          signal: controller.signal,
        });
        const products = Array.isArray(response)
          ? response
          : response.products || [];

        if (!controller.signal.aborted) {
          setSearchResults(products);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Product search error:", error);
          setSearchResults([]);
          setSearchError(
            error.response?.data?.message ||
              "Unable to search products. Please try again.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);
  };


  return (
    <>
      {/* =========================================
          ANNOUNCEMENT BAR
          ========================================= */}

          <div className="announcement-bar">
            <div className="announcement-track">
              <div className="announcement-content">
                <span className="announcement-copy">
                  Handmade with Love ✦ Unique Gifts for Every Occasion ✦ Discover Your Creativity ✦ Thoughtful Gifts, Beautifully Crafted ✦
                </span>
              </div>
              <div
                className="announcement-content"
                aria-hidden="true"
              >
                <span className="announcement-copy">
                  Handmade with Love ✦ Unique Gifts for Every Occasion ✦ Discover Your Creativity ✦ Thoughtful Gifts, Beautifully Crafted ✦
                </span>
              </div>
            </div>
          </div>


      {/* =========================================
          MAIN NAVBAR
      ========================================= */}

      <header className="navbar">

        <div className="navbar-container">


          {/* =====================================
              MOBILE MENU BUTTON
          ===================================== */}

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label={
              mobileMenu
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileMenu}
          >
            {mobileMenu ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>


          {/* =====================================
              LEFT NAVIGATION
          ===================================== */}

          <nav className="desktop-nav left-nav">

            <Link to="/shop">
              Shop
            </Link>

            <Link to="/collections">
              Collections
            </Link>

            <Link to="/bestsellers">
              Bestsellers
            </Link>

            <Link to={isLoggedIn ? "/custom-order" : "/login"}>
              Custom Order
            </Link>

          </nav>


          {/* =====================================
              OFFICIAL CLIENT LOGO
          ===================================== */}

          <Link
            to="/"
            className="brand-logo"
            aria-label="Craftie DIY Home"
          >
            <img
              src={craftieLogo}
              alt="Craftie DIY"
              className="brand-logo-image"
            />
          </Link>

          <button
            type="button"
            className="mobile-search-button navbar-search-trigger"
            aria-label="Search"
            aria-expanded={searchOpen}
            aria-controls="navbar-search-panel"
            onClick={toggleSearch}
          >
            <Search size={19} />
          </button>

          {/* =====================================
              RIGHT NAVIGATION
          ===================================== */}
          <nav className="desktop-nav right-nav">

            <Link to="/about">
              About
            </Link>

            <Link to="/contact">
              Contact
            </Link>


            {/* ACCOUNT */}

            <Link
              to={isLoggedIn ? "/account" : "/login"}
              className="nav-icon-link"
              aria-label="Account"
            >
              <User size={18} />
            </Link>


            {/* SEARCH */}

            <button
              type="button"
              className="nav-icon-button navbar-search-trigger"
              aria-label="Search"
              aria-expanded={searchOpen}
              aria-controls="navbar-search-panel"
              onClick={toggleSearch}
            >
              <Search size={18} />
            </button>


            {/* WISHLIST */}

            <Link
              to="/wishlist"
              className="nav-icon-link"
              aria-label="Wishlist"
            >
              <Heart size={18} />
            </Link>

            {/* CART */}

            <Link
              to="/cart"
              className="nav-icon-link cart-icon"
              aria-label="Cart"
            >
              <ShoppingBag size={19} />

              {isLoggedIn && cartCount > 0 && (
                <span className="cart-count">
                  {cartCount}
                </span>
              )}
            </Link>

          </nav>

        </div>

        {searchOpen && (
          <section
            className="navbar-search-panel"
            id="navbar-search-panel"
            ref={searchPanelRef}
            aria-label="Product search"
          >
            <form
              className="navbar-search-form"
              role="search"
              onSubmit={handleSearchSubmit}
            >
              <Search size={19} aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search handmade creations..."
                aria-label="Search handmade creations"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="navbar-search-clear"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchError("");
                    setSearchLoading(false);
                    window.clearTimeout(searchTimeoutRef.current);
                    searchRequestRef.current?.abort();
                    searchInputRef.current?.focus();
                  }}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                className="navbar-search-close"
                aria-label="Close search"
                onClick={closeSearch}
              >
                <X size={19} />
              </button>
            </form>

            <div className="navbar-search-results" aria-live="polite">
              {!searchQuery.trim() ? (
                <p className="navbar-search-message">
                  Start typing to search handmade creations.
                </p>
              ) : searchLoading ? (
                <p className="navbar-search-message" role="status">
                  Searching products...
                </p>
              ) : searchError ? (
                <p className="navbar-search-message navbar-search-error" role="alert">
                  {searchError}
                </p>
              ) : searchResults.length === 0 ? (
                <p className="navbar-search-message">
                  No products found.
                </p>
              ) : (
                searchResults.map((product) => (
                  <Link
                    className="navbar-search-result"
                    key={product.id}
                    to={`/product/${product.id}`}
                    onClick={closeSearch}
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt="" />
                    ) : (
                      <span className="navbar-search-image-placeholder">
                        <ShoppingBag size={19} aria-hidden="true" />
                      </span>
                    )}
                    <span className="navbar-search-result-name">
                      {product.name}
                    </span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                ))
              )}
            </div>
          </section>
        )}


        {/* =========================================
            MOBILE NAVIGATION
        ========================================= */}

        {mobileMenu && (
          <div className="mobile-nav">

            <Link
              to="/shop"
              onClick={() => setMobileMenu(false)}
            >
              Shop
            </Link>

            <Link
              to="/collections"
              onClick={() => setMobileMenu(false)}
            >
              Collections
            </Link>

            <Link
              to="/bestsellers"
              onClick={() => setMobileMenu(false)}
            >
              Bestsellers
            </Link>

            <Link
              to={isLoggedIn ? "/custom-order" : "/login"}
              onClick={() => setMobileMenu(false)}
            >
              Custom Order
            </Link>

            <Link
              to="/about"
              onClick={() => setMobileMenu(false)}
            >
              About
            </Link>

            <Link
              to="/contact"
              onClick={() => setMobileMenu(false)}
            >
              Contact
            </Link>

            <Link
              to={isLoggedIn ? "/account" : "/login"}
              onClick={() => setMobileMenu(false)}
            >
              My Account
            </Link>

            <Link
              to="/wishlist"
              className="mobile-nav-wishlist"
              onClick={() => setMobileMenu(false)}
            >
              <Heart size={17} aria-hidden="true" />
              Wishlist
            </Link>

          </div>
        )}

      </header>
    </>
  );
}

export default Navbar;
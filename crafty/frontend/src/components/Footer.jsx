import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import "./Footer.css";
import craftieLogo from "../assets/Craftie-Diy-Logo.png";

const Footer = () => {
  return (
    <footer className="site-footer">

      {/* Main Footer */}
      <div className="footer-main">

        {/* Brand */}
        <div className="footer-brand">
          {/* <Link to="/" className="footer-logo">
            Craftie<span>DIY</span>
          </Link> */}

          <Link to="/" className="footer-logo">
  <img
    src={craftieLogo}
    alt="Craftie DIY"
    className="footer-logo-image"
  />
</Link>

          <p className="footer-tagline">
            Handmade with love, creativity and a little bit of magic.
          </p>

          <p className="footer-description">
            Discover beautiful handmade creations, DIY inspiration and
            unique pieces crafted specially for you.
          </p>

          <a
            href="https://www.instagram.com/craftie_diy_/"
            target="_blank"
            rel="noreferrer"
            className="footer-instagram"
          >
            <span>@</span>
            Follow us on Instagram
          </a>
        </div>

        {/* Quick Links */}
        <div className="footer-column">
          <h3>Quick Links</h3>

          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
        </div>

        {/* Customer */}
        <div className="footer-column">
          <h3>Customer Care</h3>

          <Link to="/account">My Account</Link>
          <Link to="/addresses">My Addresses</Link>
          <Link to="/cart">Shopping Cart</Link>
          <Link to="/checkout">Checkout</Link>
          <Link to="/contact">Custom Orders</Link>
        </div>

        {/* Contact */}
        <div className="footer-column footer-contact">
          <h3>Get In Touch</h3>

          <div className="footer-contact-item">
            <Mail size={17} />
            <a href="mailto:sanoazra315@gmail.Com">
              sanoazra315@gmail.Com
            </a>
          </div>

          <div className="footer-contact-item">
            <Phone size={17} />
            <a href="tel:+91 93459 60354">
              +91 93459 60354
            </a>
          </div>

          <div className="footer-contact-item">
            <MapPin size={17} />
            <span>India</span>
          </div>

          <Link to="/contact" className="footer-contact-button">
            Contact Us
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Newsletter */}
      <div className="footer-newsletter">
        <div>
          <span className="footer-newsletter-label">
            STAY INSPIRED
          </span>

          <h3>
            Join our creative community
          </h3>

          <p>
            Get handmade inspiration, new creations and special updates.
          </p>
        </div>

        <form
          className="footer-newsletter-form"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <input
            type="email"
            placeholder="Your email address"
            required
          />

          <button type="submit">
            Subscribe
            <ArrowRight size={16} />
          </button>
        </form>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} CraftieDIY. All rights reserved.
        </p>

        <div className="footer-bottom-links">
          <Link to="/about">About</Link>
          <span>•</span>
          <Link to="/contact">Contact</Link>
          <span>•</span>
          <Link to="/shop">Shop</Link>
        </div>

        <p className="footer-made">
          Made with <span>♥</span> for handmade lovers
        </p>
      </div>

    </footer>
  );
};

export default Footer;
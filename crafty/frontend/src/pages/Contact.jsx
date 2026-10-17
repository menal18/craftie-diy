import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Sparkles,
  Heart,
} from "lucide-react";

import "./Contact.css";
import { sendContactMessage } from "../services/contactMessageService";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await sendContactMessage(formData);

      setSuccessMessage(
        response.message || "Your message has been sent successfully."
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact message error:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to send your message. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="contact-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="contact-hero">

        <div className="contact-hero-decoration contact-decoration-one">
          ✦
        </div>

        <div className="contact-hero-decoration contact-decoration-two">
          ♡
        </div>

        <div className="contact-hero-content">

          <span className="contact-eyebrow">
            WE WOULD LOVE TO HEAR FROM YOU
          </span>

          <h1>
            Let's create
            <br />
            something <em>beautiful.</em>
          </h1>

          <p>
            Have a question about a product, a special gift,
            or a custom creation? We'd love to hear from you.
          </p>

        </div>

      </section>


      {/* =====================================================
          CONTACT CONTENT
      ===================================================== */}

      <section className="contact-main">

        {/* LEFT SIDE */}

        <div className="contact-information">

          <div className="contact-section-label">
            <span>01</span>
            <div></div>
            <span>GET IN TOUCH</span>
          </div>

          <h2>
            We'd love to
            <br />
            <em>hear from you.</em>
          </h2>

          <p className="contact-intro">
            Whether you're looking for the perfect gift,
            have a question about an order, or want to
            discuss a personalised creation, feel free
            to reach out.
          </p>


          {/* CONTACT ITEMS */}

          <div className="contact-details">

            <div className="contact-detail-item">

              <div className="contact-detail-icon">
                <Mail size={19} />
              </div>

              <div>
                <span>Email</span>

                <a href="mailto:sanoazra315@gmail.Com">
                  sanoazra315@gmail.Com
                </a>
              </div>

            </div>


            <div className="contact-detail-item">

              <div className="contact-detail-icon">
                <Phone size={19} />
              </div>

              <div>
                <span>Phone</span>

                <a href="tel:+91 93459 60354">
                  +91 93459 60354
                </a>
              </div>

            </div>


            <div className="contact-detail-item">

              <div className="contact-detail-icon">
                <MapPin size={19} />
              </div>

              <div>
                <span>Location</span>

                <p>
                  India
                </p>
              </div>

            </div>


            <div className="contact-detail-item">

              <div className="contact-detail-icon">
                <div className="contact-instagram-symbol">
                  @
                </div>
              </div>

              <div>
                <span>Instagram</span>

                <a
                  href="https://www.instagram.com/craftie_diy_/"
                  target="_blank"
                  rel="noreferrer"
                >
                  @craftie_diy_
                </a>
              </div>

            </div>

          </div>


          {/* SMALL NOTE */}

          <div className="contact-note">

            <Sparkles size={17} />

            <p>
              Every message is read with care.
              We usually respond as soon as possible.
            </p>

          </div>

        </div>


        {/* RIGHT SIDE - FORM */}

        <div className="contact-form-wrapper">

          <div className="contact-form-paper">

            <div className="contact-form-top">

              <span>
                CRAFTIE DIY
              </span>

              <Heart
                size={17}
                fill="currentColor"
              />

            </div>


            <h3>
              Send us a message
            </h3>

            <p>
              Tell us a little about what you need.
            </p>


            {/* SUCCESS MESSAGE */}

            {successMessage ? (

              <div className="contact-success">

                <div className="contact-success-icon">
                  <Heart
                    size={25}
                    fill="currentColor"
                  />
                </div>

                <h3>
                  Thank you!
                </h3>

                <p>
                  {successMessage}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                >
                  Send another message
                </button>

              </div>

            ) : (

              <form
                className="contact-form"
                onSubmit={handleSubmit}
              >

                {/* ERROR MESSAGE */}

                {errorMessage && (
                  <div className="contact-error">
                    {errorMessage}
                  </div>
                )}


                {/* NAME */}

                <div className="contact-field">

                  <label htmlFor="name">
                    Your Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* EMAIL */}

                <div className="contact-field">

                  <label htmlFor="email">
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* PHONE */}

                <div className="contact-field">

                  <label htmlFor="phone">
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />

                </div>


                {/* MESSAGE */}

                <div className="contact-field">

                  <label htmlFor="message">
                    Your Message
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    placeholder="Tell us how we can help..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* SUBMIT */}

                <button
                  type="submit"
                  className="contact-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Sending..."
                    : "Send Message"}

                  {!isSubmitting && (
                    <ArrowRight size={17} />
                  )}
                </button>

              </form>

            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          CUSTOM ORDERS
      ===================================================== */}

      <section className="contact-custom">

        <div className="contact-custom-inner">

          <div className="contact-custom-icon">
            <Sparkles size={22} />
          </div>

          <span>
            SOMETHING PERSONAL?
          </span>

          <h2>
            Looking for a
            <br />
            <em>custom creation?</em>
          </h2>

          <p>
            If you have a special idea in mind, tell us about it.
            We'd love to explore how we can turn your idea into
            something meaningful.
          </p>

          <a
            href="mailto:hello@craftiediy.com"
            className="contact-custom-button"
          >
            Discuss Your Idea
            <ArrowRight size={16} />
          </a>

        </div>

      </section>


      {/* =====================================================
          BOTTOM MESSAGE
      ===================================================== */}

      <section className="contact-bottom">

        <div className="contact-bottom-content">

          <span>
            CRAFTIE DIY
          </span>

          <h2>
            Made with hands,
            <br />
            <em>sent with love.</em>
          </h2>

          <div className="contact-heart-line">

            <div></div>

            <Heart
              size={16}
              fill="currentColor"
            />

            <div></div>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Contact;
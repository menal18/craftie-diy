import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Sparkles,
  HandHeart,
  Gift,
  ArrowRight,
} from "lucide-react";

import craftieHero from "../assets/craftie-hero.jpg.png";
import craft from "../../src/assets/craft.jpg";
import  hook from "../../src/assets/hook-art.jpg";

import "./About.css";

function About() {
  useEffect(() => {
    const page = document.querySelector(".about-page");
    if (!page) return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      return undefined;
    }

    const sections = page.querySelectorAll(":scope > section");
    const textContent = page.querySelectorAll(
      "h1, h2, h3, p, .about-eyebrow, .about-section-label, .about-small-label, .about-instagram-content > span, .about-cta-content > span"
    );

    sections.forEach((section) => {
      section.classList.add("about-reveal-section");
    });
    textContent.forEach((element) => {
      element.classList.add("about-reveal-text");
    });

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("about-revealed");
            currentObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -24px 0px",
      }
    );

    page
      .querySelectorAll(".about-reveal-section, .about-reveal-text")
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="about-page">

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="about-hero">

        <div className="about-hero-content">

          <span className="about-eyebrow">
            THE CRAFTIEDIY STORY
          </span>

          <h1>
            Made with hands,
            <br />
            <em>created with heart.</em>
          </h1>

          <p>
            Thoughtful handmade creations, personalised gifts,
            and little details made to turn special moments
            into beautiful memories.
          </p>

          <Link
            to="/shop"
            className="about-primary-button"
          >
            Explore Collection
            <ArrowRight size={16} />
          </Link>

        </div>


        {/* HERO IMAGE */}
        <div className="about-hero-visual">

          <div className="about-hero-pink-circle"></div>

          <div className="about-hero-line-circle"></div>

          <div className="about-hero-image-card">

            <img
              src={craft}
              alt="CraftieDIY handmade creations"
            />

            <div className="about-tape"></div>

          </div>

          <div className="about-handwritten">
            Handmade
            <br />
            <em>with love</em>
            <span>♡</span>
          </div>

          <div className="about-flower flower-one">
            ❀
          </div>

          <div className="about-flower flower-two">
            ♡
          </div>

        </div>

      </section>


      {/* =====================================================
          OUR STORY
      ===================================================== */}
      <section className="about-story">

        <div className="about-section-label">
          <span>01</span>
          <div></div>
          <span>OUR STORY</span>
        </div>


        <div className="about-story-grid">

          <div className="about-story-heading">

            <h2>
              Creativity lives
              <br />
              in the <em>little things.</em>
            </h2>

            <div className="about-story-small">
              <span>CRAFTIE DIY</span>
              <span>EST. WITH LOVE</span>
            </div>

          </div>


          <div className="about-story-content">

            <p>
              CraftieDIY began with a simple love for creating
              beautiful things by hand and making ordinary
              moments feel a little more special.
            </p>

            <p>
              From personalised gifts and handmade keepsakes
              to creative pieces made for celebrations, every
              creation carries a little piece of creativity,
              patience, and care.
            </p>

            <p>
              We believe the smallest details can sometimes
              become the most meaningful memories.
            </p>

          </div>

        </div>


        {/* CRAFTIEDIY IMAGE */}
        <div className="about-story-image">

          <div className="about-story-image-frame">

            <img
              src={craftieHero}
              alt="CraftieDIY handmade collection"
            />

          </div>

          <div className="about-story-image-note">
            <span>CRAFTIE</span>
            <strong>DIY</strong>
            <small>
              CREATE • CRAFT • CELEBRATE
            </small>
          </div>

        </div>

      </section>


      {/* =====================================================
          INSTAGRAM
      ===================================================== */}
      <section className="about-instagram">

        <div className="about-instagram-content">

         <div className="about-instagram-icon">
  @
</div>

          <span>
            @craftie_diy_
          </span>

          <h2>
            Real creations.
            <br />
            <em>Real moments.</em>
          </h2>

          <p>
            Inspired by love, celebrations, creativity and
            the beautiful people who make every creation
            meaningful.
          </p>

          <a
            href="https://www.instagram.com/craftie_diy_/"
            target="_blank"
            rel="noreferrer"
            className="about-instagram-link"
          >
            Follow our journey
            <ArrowRight size={15} />
          </a>

        </div>

      </section>


      {/* =====================================================
          VALUES
      ===================================================== */}
      <section className="about-values">

        <div className="about-section-label">
          <span>02</span>
          <div></div>
          <span>WHAT WE BELIEVE</span>
        </div>


        <div className="about-values-heading">

          <h2>
            Made differently.
            <br />
            <em>Made meaningfully.</em>
          </h2>

          <p>
            Handmade creations are more than products.
            They carry creativity, attention, and a human touch.
          </p>

        </div>


        <div className="about-values-grid">

          {/* VALUE 1 */}
          <article className="about-value-card">

            <div className="about-value-icon">
              <HandHeart size={23} />
            </div>

            <span className="about-value-number">
              01
            </span>

            <h3>
              Handcrafted
            </h3>

            <p>
              Thoughtfully created with attention to detail
              and genuine care for every little element.
            </p>

          </article>


          {/* VALUE 2 */}
          <article className="about-value-card">

            <div className="about-value-icon">
              <Sparkles size={23} />
            </div>

            <span className="about-value-number">
              02
            </span>

            <h3>
              Unique
            </h3>

            <p>
              Every idea is designed to feel personal,
              creative, and different from the ordinary.
            </p>

          </article>


          {/* VALUE 3 */}
          <article className="about-value-card">

            <div className="about-value-icon">
              <Heart size={23} />
            </div>

            <span className="about-value-number">
              03
            </span>

            <h3>
              Made With Love
            </h3>

            <p>
              From the first idea to the final finishing
              touch, everything is created with care.
            </p>

          </article>


          {/* VALUE 4 */}
          <article className="about-value-card">

            <div className="about-value-icon">
              <Gift size={23} />
            </div>

            <span className="about-value-number">
              04
            </span>

            <h3>
              Made To Gift
            </h3>

            <p>
              Beautiful creations designed for birthdays,
              celebrations, love, and unforgettable moments.
            </p>

          </article>

        </div>

      </section>


      {/* =====================================================
          HANDMADE FEATURE
      ===================================================== */}
      <section className="about-handmade">

        <div className="about-handmade-image">

          <img
            src={hook}
            alt="CraftieDIY handmade creations"
          />

          <div className="about-handmade-note">

            <span>
              CRAFTIE
            </span>

            <strong>
              DIY
            </strong>

            <small>
              CREATE • CRAFT • CELEBRATE
            </small>

          </div>

        </div>


        <div className="about-handmade-content">

          <span className="about-small-label">
            THE BEAUTY OF HANDMADE
          </span>

          <h2>
            There is beauty
            <br />
            in something
            <br />
            <em>made by hand.</em>
          </h2>

          <p>
            Handmade pieces have a character of their own.
            They carry the little details, creativity,
            and care that make them feel personal.
          </p>

          <p>
            That is what CraftieDIY is all about —
            creating something beautiful, thoughtful,
            and worth remembering.
          </p>

          <Link
            to="/shop"
            className="about-text-link"
          >
            Discover our creations
            <ArrowRight size={15} />
          </Link>

        </div>

      </section>


      {/* =====================================================
          FINAL CTA
      ===================================================== */}
      <section className="about-cta">

        <div className="about-cta-decoration">
          ♡
        </div>

        <div className="about-cta-content">

          <span>
            CRAFTIE DIY
          </span>

          <h2>
            Something beautiful
            <br />
            is waiting for you.
          </h2>

          <p>
            Explore our collection of handmade creations
            and find something made especially for your
            beautiful moments.
          </p>

          <Link
            to="/shop"
            className="about-cta-button"
          >
            Shop The Collection
            <ArrowRight size={16} />
          </Link>

        </div>

      </section>

    </main>
  );
}

export default About;
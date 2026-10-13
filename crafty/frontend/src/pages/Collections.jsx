import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { Link } from "react-router-dom";

import { getCategories } from "../services/categoryService";
import "./Collections.css";

function Collections() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const loadCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getCategories();
        const categoryList = Array.isArray(response)
          ? response
          : response.categories || [];

        if (isCurrent) {
          setCategories(categoryList);
        }
      } catch (requestError) {
        console.error("Collections API error:", requestError);

        if (isCurrent) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load collections. Please try again.",
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <main className="collections-page">
      <header className="catalog-header">
        <span>CRAFTIEDIY COLLECTION</span>
        <h1>Our Collections</h1>
        <p>Explore thoughtfully curated categories of handmade creations.</p>
      </header>

      <section className="collections-content" aria-label="Product collections">
        {loading ? (
          <p className="catalog-state" role="status">Loading collections...</p>
        ) : error ? (
          <p className="catalog-state catalog-error" role="alert">{error}</p>
        ) : categories.length === 0 ? (
          <p className="catalog-state">No collections are available yet.</p>
        ) : (
          <div className="collections-grid">
            {categories.map((category) => (
              <Link
                className="collection-card"
                key={category.id}
                to={`/shop?category=${encodeURIComponent(category.id)}`}
              >
                {category.image_url ? (
                  <img src={category.image_url} alt={category.name} />
                ) : (
                  <div className="collection-placeholder" aria-hidden="true">
                    <Layers size={34} />
                  </div>
                )}
                <div className="collection-card-copy">
                  <h2>{category.name}</h2>
                  {category.description && <p>{category.description}</p>}
                  <span>Explore collection</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Collections;

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

import { getBestsellers } from "../services/productService";
import "./Collections.css";

function Bestsellers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const loadBestsellers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getBestsellers();
        const productList = Array.isArray(response)
          ? response
          : response.products || [];

        if (isCurrent) {
          setProducts(productList);
        }
      } catch (requestError) {
        console.error("Bestsellers API error:", requestError);

        if (isCurrent) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load bestsellers. Please try again.",
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    loadBestsellers();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <main className="bestsellers-page">
      <header className="catalog-header">
        <span>LOVED BY OUR CUSTOMERS</span>
        <h1>Bestsellers</h1>
        <p>Discover the creations customers have actually ordered most.</p>
      </header>

      <section className="bestsellers-content" aria-label="Best-selling products">
        {loading ? (
          <p className="catalog-state" role="status">Loading bestsellers...</p>
        ) : error ? (
          <p className="catalog-state catalog-error" role="alert">{error}</p>
        ) : products.length === 0 ? (
          <p className="catalog-state">
            No completed product sales are available yet.
          </p>
        ) : (
          <div className="bestsellers-grid">
            {products.map((product) => (
              <Link
                className="bestseller-card"
                key={product.id}
                to={`/product/${product.id}`}
              >
                <div className="bestseller-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <ShoppingBag size={34} aria-hidden="true" />
                  )}
                </div>
                <div className="bestseller-card-copy">
                  <span className="bestseller-category">
                    {product.category_name || "CraftieDIY"}
                  </span>
                  <h2>{product.name}</h2>
                  {product.description && <p>{product.description}</p>}
                  <div className="bestseller-card-footer">
                    <span>₹{Number(product.final_price ?? product.price).toFixed(2)}</span>
                    <span>
                      {product.sold_quantity} sold
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Bestsellers;

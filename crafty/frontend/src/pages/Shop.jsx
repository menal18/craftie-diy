// import { useEffect, useState } from "react";
// import { Heart, ShoppingBag, Search, SlidersHorizontal } from "lucide-react";
// import { Link, useSearchParams } from "react-router-dom";

// import { getProducts } from "../services/productService";
// import { getCategories } from "../services/categoryService";

// import "./Shop.css";

// function Shop() {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const categoryFromUrl = searchParams.get("category");

//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState([]);

//   const [search, setSearch] = useState("");
//   const selectedCategory = categoryFromUrl || "all";
//   const [sort, setSort] = useState("default");

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     let isCurrent = true;

//     Promise.all([getProducts(), getCategories()])
//       .then(([productsData, categoriesData]) => {
//         const productList = Array.isArray(productsData)
//           ? productsData
//           : productsData.products || [];

//         const categoryList = Array.isArray(categoriesData)
//           ? categoriesData
//           : categoriesData.categories || [];

//         if (isCurrent) {
//           setProducts(productList);
//           setCategories(categoryList);
//         }
//       })
//       .catch((err) => {
//         console.error("Shop API error:", err);
//         if (isCurrent) {
//           setError("Unable to load products. Please try again.");
//         }
//       })
//       .finally(() => {
//         if (isCurrent) {
//           setLoading(false);
//         }
//       });

//     return () => {
//       isCurrent = false;
//     };
//   }, []);

//   const filteredProducts = products
//     .filter((product) => {
//       const searchText = search.toLowerCase().trim();

//       if (!searchText) return true;

//       return (
//         product.name?.toLowerCase().includes(searchText) ||
//         product.description?.toLowerCase().includes(searchText)
//       );
//     })
//     .filter((product) => {
//       if (selectedCategory === "all") return true;

//       return String(product.category_id) === String(selectedCategory);
//     })
//     .sort((a, b) => {
//       if (sort === "price-low") {
//         return Number(a.price) - Number(b.price);
//       }

//       if (sort === "price-high") {
//         return Number(b.price) - Number(a.price);
//       }

//       if (sort === "name") {
//         return (a.name || "").localeCompare(b.name || "");
//       }

//       return 0;
//     });

//   const selectedCategoryName = categories.find(
//     (category) => String(category.id) === String(selectedCategory),
//   )?.name;

//   return (
//     <main className="shop-page">
//       {/* PAGE HEADER */}
//       <section className="shop-header">
//         <div className="shop-header-content">
//           <span>CRAFTIEDIY COLLECTION</span>

//           <h1>{selectedCategoryName || "Shop All Creations"}</h1>

//           <p>
//             Explore our collection of thoughtful handmade gifts and beautiful
//             handcrafted creations.
//           </p>
//         </div>
//       </section>

//       {/* SHOP CONTENT */}
//       <section className="shop-content">
//         {/* FILTER BAR */}
//         <div className="shop-toolbar">
//           <div className="shop-result-count">
//             <SlidersHorizontal size={16} />
//             <span>{filteredProducts.length} Products</span>
//           </div>

//           <div className="shop-search">
//             <Search size={17} />

//             <input
//               type="text"
//               placeholder="Search products..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>

//           <select
//             className="category-select"
//             value={selectedCategory}
//             onChange={(event) => {
//               const categoryId = event.target.value;
//               setSearchParams(
//                 categoryId === "all" ? {} : { category: categoryId },
//               );
//             }}
//           >
//             <option value="all">All Categories</option>

//             {categories.map((category) => (
//               <option key={category.id} value={category.id}>
//                 {category.name}
//               </option>
//             ))}
//           </select>

//           <select
//             className="sort-select"
//             value={sort}
//             onChange={(e) => setSort(e.target.value)}
//           >
//             <option value="default">Sort By</option>
//             <option value="price-low">Price: Low to High</option>
//             <option value="price-high">Price: High to Low</option>
//             <option value="name">Name</option>
//           </select>
//         </div>

//         {/* PRODUCTS */}
//         {loading ? (
//           <div className="shop-message">Loading products...</div>
//         ) : error ? (
//           <div className="shop-message shop-error">{error}</div>
//         ) : filteredProducts.length === 0 ? (
//           <div className="shop-message">No products found.</div>
//         ) : (
//           <div className="shop-grid">
//             {filteredProducts.map((product) => (
//               <article className="shop-product-card" key={product.id}>
//                 <Link
//                   to={`/product/${product.id}`}
//                   className="shop-product-image"
//                 >
//                   {product.image_url ? (
//                     <img src={product.image_url} alt={product.name} />
//                   ) : (
//                     <div className="shop-image-placeholder">
//                       <ShoppingBag size={32} />
//                     </div>
//                   )}

//                   <button
//                     type="button"
//                     className="shop-wishlist"
//                     aria-label={`Add ${product.name} to wishlist`}
//                     onClick={(event) => {
//                       event.preventDefault();
//                     }}
//                   >
//                     <Heart size={19} />
//                   </button>

//                   <div className="shop-view-product">View Product</div>
//                 </Link>

//                 <div className="shop-product-info">
//                   {product.category?.name && (
//                     <span className="shop-product-category">
//                       {product.category.name}
//                     </span>
//                   )}

//                   <h2>{product.name}</h2>

//                   {product.description && <p>{product.description}</p>}

//                   <div className="shop-product-bottom">
//                     <strong>₹{Number(product.price).toFixed(2)}</strong>

//                     <button type="button" className="shop-cart-button">
//                       Add to Cart
//                     </button>
//                   </div>
//                 </div>
//               </article>
//             ))}
//           </div>
//         )}
//       </section>
//     </main>
//   );
// }

// export default Shop;


import { useEffect, useState } from "react";
import {
  Heart,
  ShoppingBag,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { addToCart } from "../services/cartService";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../services/wishlistService";

import { useCart } from "../context/CartContext";

import "./Shop.css";

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryFromUrl = searchParams.get("category");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const selectedCategory = categoryFromUrl || "all";
  const [sort, setSort] = useState("default");

  const [wishlistIds, setWishlistIds] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { refreshCart } = useCart();

  /* =========================================
     LOAD PRODUCTS + CATEGORIES
  ========================================= */

  useEffect(() => {
    let isCurrent = true;

    const loadShopData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        const productList = Array.isArray(productsData)
          ? productsData
          : productsData.products || [];

        const categoryList = Array.isArray(categoriesData)
          ? categoriesData
          : categoriesData.categories || [];

        if (isCurrent) {
          setProducts(productList);
          setCategories(categoryList);
        }
      } catch (err) {
        console.error("Shop API error:", err);

        if (isCurrent) {
          setError(
            err.response?.data?.message ||
              "Unable to load products. Please try again.",
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    loadShopData();

    return () => {
      isCurrent = false;
    };
  }, []);

  /* =========================================
     LOAD USER WISHLIST
  ========================================= */

  useEffect(() => {
    const loadWishlist = async () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(
        localStorage.getItem("user") || "null",
      );

      if (!token || user?.role?.toLowerCase() === "admin") {
        setWishlistIds(new Set());
        return;
      }

      try {
        setWishlistLoading(true);

        const data = await getWishlist();

        const items = Array.isArray(data)
          ? data
          : data.items || data.wishlist || [];

        const ids = new Set(
          items.map((item) => {
            return Number(
              item.product_id ??
                item.product?.id ??
                item.id,
            );
          }),
        );

        setWishlistIds(ids);
      } catch (err) {
        console.error("Wishlist loading error:", err);
        setWishlistIds(new Set());
      } finally {
        setWishlistLoading(false);
      }
    };

    loadWishlist();
  }, []);

  /* =========================================
     LOGIN CHECK
  ========================================= */

  const requireCustomerLogin = () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(
      localStorage.getItem("user") || "null",
    );

    if (!token) {
      navigate("/login", {
        state: {
          from: "/shop",
        },
      });

      return false;
    }

    if (user?.role?.toLowerCase() === "admin") {
      setMessage("Admin accounts cannot use the customer cart.");
      return false;
    }

    return true;
  };

  /* =========================================
     ADD TO CART
  ========================================= */

  const handleAddToCart = async (event, product) => {
    event.preventDefault();
    event.stopPropagation();

    if (!requireCustomerLogin()) {
      return;
    }

    const stock = Number(product.stock_quantity ?? 0);

    if (stock <= 0) {
      setMessage("This product is currently out of stock.");
      return;
    }

    try {
      setActionLoadingId(product.id);
      setMessage("");

      const response = await addToCart(product.id, 1);

      await refreshCart();

      setMessage(
        response.message ||
          `${product.name} added to cart successfully.`,
      );
    } catch (err) {
      console.error("Add to cart error:", err);

      setMessage(
        err.response?.data?.message ||
          "Unable to add product to cart.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  /* =========================================
     WISHLIST
  ========================================= */

  const handleWishlist = async (event, product) => {
    event.preventDefault();
    event.stopPropagation();

    if (!requireCustomerLogin()) {
      return;
    }

    try {
      setActionLoadingId(product.id);
      setMessage("");

      const productId = Number(product.id);
      const isWishlisted = wishlistIds.has(productId);

      if (isWishlisted) {
        const response = await removeFromWishlist(productId);

        setWishlistIds((previous) => {
          const updated = new Set(previous);
          updated.delete(productId);
          return updated;
        });

        setMessage(
          response.message ||
            `${product.name} removed from wishlist.`,
        );
      } else {
        const response = await addToWishlist(productId);

        setWishlistIds((previous) => {
          const updated = new Set(previous);
          updated.add(productId);
          return updated;
        });

        setMessage(
          response.message ||
            `${product.name} added to wishlist.`,
        );
      }
    } catch (err) {
      console.error("Wishlist error:", err);

      setMessage(
        err.response?.data?.message ||
          "Unable to update wishlist.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  /* =========================================
     FILTER + SORT
  ========================================= */

  const filteredProducts = products
    .filter((product) => {
      const searchText = search.toLowerCase().trim();

      if (!searchText) {
        return true;
      }

      return (
        product.name?.toLowerCase().includes(searchText) ||
        product.description
          ?.toLowerCase()
          .includes(searchText)
      );
    })
    .filter((product) => {
      if (selectedCategory === "all") {
        return true;
      }

      return (
        String(product.category_id) ===
        String(selectedCategory)
      );
    })
    .filter((product) => {
      /*
       * Customer shop should only show active products.
       * The backend should already return active products,
       * but this protects the customer UI as well.
       */
      return product.is_active !== false;
    })
    .sort((a, b) => {
      if (sort === "price-low") {
        return Number(a.price) - Number(b.price);
      }

      if (sort === "price-high") {
        return Number(b.price) - Number(a.price);
      }

      if (sort === "name") {
        return (a.name || "").localeCompare(
          b.name || "",
        );
      }

      return 0;
    });

  const selectedCategoryName = categories.find(
    (category) =>
      String(category.id) ===
      String(selectedCategory),
  )?.name;

  /* =========================================
     RENDER
  ========================================= */

  return (
    <main className="shop-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <section className="shop-header">
        <div className="shop-header-content">
          <span>CRAFTIEDIY COLLECTION</span>

          <h1>
            {selectedCategoryName ||
              "Shop All Creations"}
          </h1>

          <p>
            Explore our collection of thoughtful
            handmade gifts and beautiful handcrafted
            creations.
          </p>
        </div>
      </section>


      {/* =====================================
          SHOP CONTENT
      ===================================== */}

      <section className="shop-content">

        {/* ===================================
            TOOLBAR
        =================================== */}

        <div className="shop-toolbar">

          <div className="shop-result-count">
            <SlidersHorizontal size={16} />
            <span>
              {filteredProducts.length} Products
            </span>
          </div>


          {/* SEARCH */}

          <div className="shop-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>


          {/* CATEGORY */}

          <select
            className="category-select"
            value={selectedCategory}
            onChange={(event) => {
              const categoryId =
                event.target.value;

              setSearchParams(
                categoryId === "all"
                  ? {}
                  : { category: categoryId },
              );
            }}
          >
            <option value="all">
              All Categories
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>


          {/* SORT */}

          <select
            className="sort-select"
            value={sort}
            onChange={(event) =>
              setSort(event.target.value)
            }
          >
            <option value="default">
              Sort By
            </option>

            <option value="price-low">
              Price: Low to High
            </option>

            <option value="price-high">
              Price: High to Low
            </option>

            <option value="name">
              Name
            </option>
          </select>
        </div>


        {/* ===================================
            MESSAGE
        =================================== */}

        {message && (
          <div className="shop-action-message">
            {message}
          </div>
        )}


        {/* ===================================
            PRODUCTS
        =================================== */}

        {loading ? (
          <div className="shop-message">
            Loading products...
          </div>
        ) : error ? (
          <div className="shop-message shop-error">
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="shop-message">
            No products found.
          </div>
        ) : (
          <div className="shop-grid">

            {filteredProducts.map((product) => {
              const productId = Number(product.id);

              const isWishlisted =
                wishlistIds.has(productId);

              const isActionLoading =
                actionLoadingId === productId;

              const stock = Number(
                product.stock_quantity ?? 0,
              );

              const isOutOfStock = stock <= 0;

              return (
                <article
                  className="shop-product-card"
                  key={product.id}
                >

                  {/* PRODUCT IMAGE */}

                  <Link
                    to={`/product/${product.id}`}
                    className="shop-product-image"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                      />
                    ) : (
                      <div className="shop-image-placeholder">
                        <ShoppingBag size={32} />
                      </div>
                    )}


                    {/* WISHLIST */}

                    <button
                      type="button"
                      className={`shop-wishlist ${
                        isWishlisted
                          ? "wishlisted"
                          : ""
                      }`}
                      aria-label={
                        isWishlisted
                          ? `Remove ${product.name} from wishlist`
                          : `Add ${product.name} to wishlist`
                      }
                      onClick={(event) =>
                        handleWishlist(
                          event,
                          product,
                        )
                      }
                      disabled={
                        wishlistLoading ||
                        isActionLoading
                      }
                    >
                      <Heart
                        size={19}
                        fill={
                          isWishlisted
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>


                    {/* VIEW PRODUCT */}

                    <div className="shop-view-product">
                      View Product
                    </div>

                  </Link>
                </article>
              );
            })}

          </div>
        )}
      </section>
    </main>
  );
}

export default Shop;
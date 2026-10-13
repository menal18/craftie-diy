// // import { useEffect, useState } from "react";
// // import { ArrowRight, Sparkles, Heart, ShoppingBag } from "lucide-react";
// // import { Link } from "react-router-dom";

// // import { getProducts } from "../services/productService";
// // import { getCategories } from "../services/categoryService";

// // import "./Home.css";

// // function Home() {
// //   const [products, setProducts] = useState([]);
// //   const [categories, setCategories] = useState([]);

// //   const [loadingProducts, setLoadingProducts] = useState(true);
// //   const [loadingCategories, setLoadingCategories] = useState(true);

// //   const [productError, setProductError] = useState("");
// //   const [categoryError, setCategoryError] = useState("");

// //   useEffect(() => {
// //     loadProducts();
// //     loadCategories();
// //   }, []);

// //   const loadProducts = async () => {
// //     try {
// //       setLoadingProducts(true);

// //       const data = await getProducts();

// //       // Supports either:
// //       // [ ...products ]
// //       // or { products: [...] }
// //       const productList = Array.isArray(data)
// //         ? data
// //         : data.products || [];

// //       setProducts(productList);
// //     } catch (error) {
// //       console.error("Products API error:", error);
// //       setProductError("Unable to load products.");
// //     } finally {
// //       setLoadingProducts(false);
// //     }
// //   };

// //   const loadCategories = async () => {
// //     try {
// //       setLoadingCategories(true);

// //       const data = await getCategories();

// //       const categoryList = Array.isArray(data)
// //         ? data
// //         : data.categories || [];

// //       setCategories(categoryList);
// //     } catch (error) {
// //       console.error("Categories API error:", error);
// //       setCategoryError("Unable to load categories.");
// //     } finally {
// //       setLoadingCategories(false);
// //     }
// //   };

// //   return (
// //     <main className="home">

// //       {/* HERO */}
// //       <section className="hero-section">

// //         <div className="hero-content">

// //           <div className="hero-label">
// //             <Sparkles size={15} />
// //             CRAFTED WITH LOVE
// //           </div>

// //           <h1>
// //             Little things,
// //             <br />
// //             <em>made special.</em>
// //           </h1>

// //           <p>
// //             Discover thoughtfully handcrafted gifts,
// //             personalized creations, and beautiful pieces
// //             made to make every moment memorable.
// //           </p>

// //           <Link to="/shop" className="primary-button">
// //             Discover Collection
// //             <ArrowRight size={17} />
// //           </Link>

// //         </div>

// //         <div className="hero-image-wrapper">
// //           <img
// //             src="https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1400&q=85"
// //             alt="Handmade crafts"
// //           />
// //         </div>

// //       </section>


// //       {/* SHOP BY COLLECTION */}
// //       <section className="collection-section">

// //         <div className="collection-heading">

// //           <span>EXPLORE OUR WORLD</span>

// //           <h2>Shop by Collection</h2>

// //           <div className="heading-decoration">
// //             <span></span>
// //             ✦
// //             <span></span>
// //           </div>

// //         </div>


// //         {loadingCategories ? (
// //           <div className="home-loading">
// //             Loading collections...
// //           </div>
// //         ) : categoryError ? (
// //           <div className="home-error">
// //             {categoryError}
// //           </div>
// //         ) : (
// //           <div className="collection-grid">

// //             {categories.map((category) => (

// //               <Link
// //                 to={`/shop?category=${category.id}`}
// //                 className="collection-card"
// //                 key={category.id}
// //               >

// //                 {category.image_url ? (
// //                   <img
// //                     src={category.image_url}
// //                     alt={category.name}
// //                   />
// //                 ) : (
// //                   <div className="collection-placeholder">
// //                     <Sparkles size={30} />
// //                   </div>
// //                 )}

// //                 <div className="collection-overlay">

// //                   <div>
// //                     <h3>{category.name}</h3>

// //                     {category.description && (
// //                       <p>{category.description}</p>
// //                     )}
// //                   </div>

// //                   <span className="collection-button">
// //                     Shop Now
// //                     <ArrowRight size={14} />
// //                   </span>

// //                 </div>

// //               </Link>

// //             ))}

// //           </div>
// //         )}

// //       </section>


// //       {/* FEATURED PRODUCTS */}
// //       <section className="featured-section">

// //         <div className="featured-heading">

// //           <div>
// //             <span>CURATED FOR YOU</span>
// //             <h2>Featured Creations</h2>
// //           </div>

// //           <Link to="/shop" className="view-all-link">
// //             View All Products
// //             <ArrowRight size={15} />
// //           </Link>

// //         </div>


// //         {loadingProducts ? (
// //           <div className="home-loading">
// //             Loading products...
// //           </div>
// //         ) : productError ? (
// //           <div className="home-error">
// //             {productError}
// //           </div>
// //         ) : products.length === 0 ? (
// //           <div className="home-empty">
// //             No products available.
// //           </div>
// //         ) : (
// //           <div className="featured-grid">

// //             {products.slice(0, 4).map((product) => (

// //               <article
// //                 className="featured-card"
// //                 key={product.id}
// //               >

// //                 <Link
// //                   to={`/product/${product.id}`}
// //                   className="featured-image"
// //                 >

// //                   {product.image_url ? (
// //                     <img
// //                       src={product.image_url}
// //                       alt={product.name}
// //                     />
// //                   ) : (
// //                     <div className="product-placeholder">
// //                       <ShoppingBag size={30} />
// //                     </div>
// //                   )}

// //                   <button
// //                     type="button"
// //                     className="product-wishlist"
// //                     onClick={(event) => {
// //                       event.preventDefault();
// //                     }}
// //                     aria-label="Add to wishlist"
// //                   >
// //                     <Heart size={18} />
// //                   </button>

// //                   <div className="quick-view">
// //                     View Product
// //                   </div>

// //                 </Link>


// //                 <div className="featured-info">

// //                   {product.category?.name && (
// //                     <span>
// //                       {product.category.name}
// //                     </span>
// //                   )}

// //                   <h3>{product.name}</h3>

// //                   <div className="featured-bottom">

// //                     <strong>
// //                       ₹{Number(product.price).toFixed(2)}
// //                     </strong>

// //                     <button
// //                       type="button"
// //                       className="add-cart"
// //                     >
// //                       Add to Cart
// //                     </button>

// //                   </div>

// //                 </div>

// //               </article>

// //             ))}

// //           </div>
// //         )}

// //       </section>

// //     </main>
// //   );
// // }

// // export default Home;


// import { useEffect, useState } from "react";
// import { ArrowRight, Sparkles, Heart, ShoppingBag } from "lucide-react";
// import { Link } from "react-router-dom";

// import { getProducts } from "../services/productService";
// import { getCategories } from "../services/categoryService";
// import art from "../assets/art.jpg";
// import "./Home.css";

// function Home() {
//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState([]);

//   const [loadingProducts, setLoadingProducts] = useState(true);
//   const [loadingCategories, setLoadingCategories] = useState(true);

//   const [productError, setProductError] = useState("");
//   const [categoryError, setCategoryError] = useState("");

//   useEffect(() => {
//     loadProducts();
//     loadCategories();
//   }, []);

//   const loadProducts = async () => {
//     try {
//       setLoadingProducts(true);

//       const data = await getProducts();

//       // Supports either:
//       // [ ...products ]
//       // or { products: [...] }
//       const productList = Array.isArray(data)
//         ? data
//         : data.products || [];

//       setProducts(productList);
//     } catch (error) {
//       console.error("Products API error:", error);
//       setProductError("Unable to load products.");
//     } finally {
//       setLoadingProducts(false);
//     }
//   };

//   const loadCategories = async () => {
//     try {
//       setLoadingCategories(true);

//       const data = await getCategories();

//       const categoryList = Array.isArray(data)
//         ? data
//         : data.categories || [];

//       setCategories(categoryList);
//     } catch (error) {
//       console.error("Categories API error:", error);
//       setCategoryError("Unable to load categories.");
//     } finally {
//       setLoadingCategories(false);
//     }
//   };

//   return (
//     <main className="home">

//       {/* HERO */}
//       <section className="hero-section">

//         <div className="hero-content">

//           <div className="hero-label">
//             <Sparkles size={15} />
//             CRAFTED WITH LOVE
//           </div>

//           <h1>
//             Little things,
//             <br />
//             <em>made special.</em>
//           </h1>

//           <p>
//             Discover thoughtfully handcrafted gifts,
//             personalized creations, and beautiful pieces
//             made to make every moment memorable.
//           </p>

//           <Link to="/shop" className="primary-button">
//             Discover Collection
//             <ArrowRight size={17} />
//           </Link>

//         </div>

//         {/* <div className="hero-image-wrapper">
//           <div className="hero-image-frame">
//             <span className="hero-frame-corner tl" />
//             <span className="hero-frame-corner tr" />
//             <span className="hero-frame-corner bl" />
//             <span className="hero-frame-corner br" />
//             <img
//               src="https://images.unsplash.com/photo-1644745547471-6452aa04fb38?auto=format&fit=crop&w=1400&q=85"
//               alt="Handmade gift, wrapped and ready to give"
//             />
//           </div>
//         </div> */}
// {/* 
// <div className="hero-visual-wrapper">
//   <div className="hero-visual-frame">
//     <span className="hero-frame-corner tl" />
//     <span className="hero-frame-corner tr" />
//     <span className="hero-frame-corner bl" />
//     <span className="hero-frame-corner br" />

//     <div className="hero-visual-content">
//       <Sparkles size={38} className="hero-visual-icon" />
//       <p className="hero-visual-text">
//         Handcrafted
//         <br />
//         with&nbsp;Love
//       </p>
//       <span className="hero-visual-rule" />
//     </div>
//   </div>
// </div> */}

// <div className="hero-image-wrapper">
//   <div className="hero-image-frame">

//     <span className="hero-frame-corner tl" />
//     <span className="hero-frame-corner tr" />
//     <span className="hero-frame-corner bl" />
//     <span className="hero-frame-corner br" />

//     <img
//       src={art}
//       alt="Handcrafted embroidery artwork"
//       className="hero-image"
//     />

//   </div>
// </div>
//       </section>


//       {/* SHOP BY COLLECTION */}
//       <section className="collection-section">

//         <div className="collection-heading">

//           <span>EXPLORE OUR WORLD</span>

//           <h2>Shop by Collection</h2>

//           <div className="heading-decoration">
//             <span></span>
//             ✦
//             <span></span>
//           </div>

//         </div>


//         {loadingCategories ? (
//           <div className="home-loading">
//             Loading collections...
//           </div>
//         ) : categoryError ? (
//           <div className="home-error">
//             {categoryError}
//           </div>
//         ) : (
//           <div className="collection-grid">

//             {categories.map((category) => (

//               <Link
//                 to={`/shop?category=${category.id}`}
//                 className="collection-card"
//                 key={category.id}
//               >

//                 {category.image_url ? (
//                   <img
//                     src={category.image_url}
//                     alt={category.name}
//                   />
//                 ) : (
//                   <div className="collection-placeholder">
//                     <Sparkles size={30} />
//                   </div>
//                 )}

//                 <div className="collection-overlay">

//                   <div>
//                     <h3>{category.name}</h3>

//                     {category.description && (
//                       <p>{category.description}</p>
//                     )}
//                   </div>

//                   <span className="collection-button">
//                     Shop Now
//                     <ArrowRight size={14} />
//                   </span>

//                 </div>

//               </Link>

//             ))}

//           </div>
//         )}

//       </section>


//       {/* FEATURED PRODUCTS */}
//       <section className="featured-section">

//         <div className="featured-heading">

//           <div>
//             <span>CURATED FOR YOU</span>
//             <h2>Featured Creations</h2>
//           </div>

//           <Link to="/shop" className="view-all-link">
//             View All Products
//             <ArrowRight size={15} />
//           </Link>

//         </div>


//         {loadingProducts ? (
//           <div className="home-loading">
//             Loading products...
//           </div>
//         ) : productError ? (
//           <div className="home-error">
//             {productError}
//           </div>
//         ) : products.length === 0 ? (
//           <div className="home-empty">
//             No products available.
//           </div>
//         ) : (
//           <div className="featured-grid">

//             {products.slice(0, 4).map((product) => (

//               <article
//                 className="featured-card"
//                 key={product.id}
//               >

//                 <Link
//                   to={`/product/${product.id}`}
//                   className="featured-image"
//                 >

//                   {product.image_url ? (
//                     <img
//                       src={product.image_url}
//                       alt={product.name}
//                     />
//                   ) : (
//                     <div className="product-placeholder">
//                       <ShoppingBag size={30} />
//                     </div>
//                   )}

//                   <button
//                     type="button"
//                     className="product-wishlist"
//                     onClick={(event) => {
//                       event.preventDefault();
//                     }}
//                     aria-label="Add to wishlist"
//                   >
//                     <Heart size={18} />
//                   </button>

//                   <div className="quick-view">
//                     View Product
//                   </div>

//                 </Link>


//                 <div className="featured-info">

//                   {product.category?.name && (
//                     <span>
//                       {product.category.name}
//                     </span>
//                   )}

//                   <h3>{product.name}</h3>

//                   <div className="featured-bottom">

//                     <strong>
//                       ₹{Number(product.price).toFixed(2)}
//                     </strong>

//                     <button
//                       type="button"
//                       className="add-cart"
//                     >
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

// export default Home;

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Heart,
  ShoppingBag,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { getProducts } from "../services/productService";
import { getCategories } from "../services/categoryService";
import { addToCart } from "../services/cartService";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../services/wishlistService";

import { useCart } from "../context/CartContext";

import art from "../assets/art.jpg";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [wishlistIds, setWishlistIds] = useState(new Set());

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  const [productError, setProductError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const [addingCartId, setAddingCartId] = useState(null);
  const [wishlistLoadingId, setWishlistLoadingId] = useState(null);

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadWishlist();
  }, []);

  /* =========================================
     LOAD PRODUCTS
  ========================================= */

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductError("");

      const data = await getProducts();

      const productList = Array.isArray(data)
        ? data
        : data.products || [];

      setProducts(productList);
    } catch (error) {
      console.error("Products API error:", error);
      setProductError("Unable to load products.");
    } finally {
      setLoadingProducts(false);
    }
  };

  /* =========================================
     LOAD CATEGORIES
  ========================================= */

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      setCategoryError("");

      const data = await getCategories();

      const categoryList = Array.isArray(data)
        ? data
        : data.categories || [];

      setCategories(categoryList);
    } catch (error) {
      console.error("Categories API error:", error);
      setCategoryError("Unable to load collections.");
    } finally {
      setLoadingCategories(false);
    }
  };

  /* =========================================
     LOAD USER WISHLIST
  ========================================= */

  const loadWishlist = async () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    // Guests and admins don't use customer wishlist
    if (!token || user?.role?.toLowerCase() === "admin") {
      setWishlistIds(new Set());
      setLoadingWishlist(false);
      return;
    }

    try {
      setLoadingWishlist(true);

      const data = await getWishlist();

      const wishlistItems = Array.isArray(data)
        ? data
        : data.wishlist || data.items || [];

      const ids = new Set(
        wishlistItems
          .map((item) => item.product_id ?? item.product?.id)
          .filter(Boolean)
          .map(Number)
      );

      setWishlistIds(ids);
    } catch (error) {
      console.error("Wishlist API error:", error);
      setWishlistIds(new Set());
    } finally {
      setLoadingWishlist(false);
    }
  };

  /* =========================================
     LOGIN CHECK
  ========================================= */

  const requireLogin = () => {
    if (!isLoggedIn) {
      navigate("/login", {
        state: {
          from: "/",
        },
      });

      return false;
    }

    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    if (user?.role?.toLowerCase() === "admin") {
      return false;
    }

    return true;
  };

  /* =========================================
     ADD TO CART
  ========================================= */

  const handleAddToCart = async (product) => {
    if (!requireLogin()) {
      return;
    }

    if (!product?.id) {
      return;
    }

    if (
      product.stock_quantity !== undefined &&
      Number(product.stock_quantity) <= 0
    ) {
      alert("This product is currently out of stock.");
      return;
    }

    try {
      setAddingCartId(product.id);

      await addToCart(product.id, 1);

      await refreshCart();

      alert(`${product.name} added to cart.`);
    } catch (error) {
      console.error("Add to cart error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to add product to cart."
      );
    } finally {
      setAddingCartId(null);
    }
  };

  /* =========================================
     TOGGLE WISHLIST
  ========================================= */

  const handleWishlistToggle = async (event, product) => {
    event.preventDefault();
    event.stopPropagation();

    if (!requireLogin()) {
      return;
    }

    if (!product?.id) {
      return;
    }

    const productId = Number(product.id);
    const isWishlisted = wishlistIds.has(productId);

    try {
      setWishlistLoadingId(productId);

      if (isWishlisted) {
        await removeFromWishlist(productId);

        setWishlistIds((previous) => {
          const updated = new Set(previous);
          updated.delete(productId);
          return updated;
        });
      } else {
        await addToWishlist(productId);

        setWishlistIds((previous) => {
          const updated = new Set(previous);
          updated.add(productId);
          return updated;
        });
      }
    } catch (error) {
      console.error("Wishlist error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to update wishlist."
      );
    } finally {
      setWishlistLoadingId(null);
    }
  };

  return (
    <main className="home">

      {/* =========================================
          HERO
      ========================================= */}

      <section className="hero-section">

        <div className="hero-content">

          <div className="hero-label">
            <Sparkles size={15} />
            CRAFTED WITH LOVE
          </div>

          <h1>
            Little things,
            <br />
            <em>made special.</em>
          </h1>

          <p>
            Discover thoughtfully handcrafted gifts,
            personalized creations, and beautiful pieces
            made to make every moment memorable.
          </p>

          <Link
            to="/shop"
            className="primary-button"
          >
            Discover Collection
            <ArrowRight size={17} />
          </Link>

        </div>

        <div className="hero-image-wrapper">

          <div className="hero-image-frame">

            <span className="hero-frame-corner tl" />
            <span className="hero-frame-corner tr" />
            <span className="hero-frame-corner bl" />
            <span className="hero-frame-corner br" />

            <img
              src={art}
              alt="Handcrafted embroidery artwork"
              className="hero-image"
            />

          </div>

        </div>

      </section>


      {/* =========================================
          SHOP BY COLLECTION
      ========================================= */}

      <section className="collection-section">

        <div className="collection-heading">

          <span>EXPLORE OUR WORLD</span>

          <h2>Shop by Collection</h2>

          <div className="heading-decoration">
            <span></span>
            ✦
            <span></span>
          </div>

        </div>

        {loadingCategories ? (

          <div className="home-loading">
            Loading collections...
          </div>

        ) : categoryError ? (

          <div className="home-error">
            {categoryError}
          </div>

        ) : categories.length === 0 ? (

          <div className="home-empty">
            No collections available.
          </div>

        ) : (

          <div className="collection-grid">

            {categories.map((category) => (

              <Link
                to={`/shop?category=${category.id}`}
                className="collection-card"
                key={category.id}
              >

                {category.image_url ? (

                  <img
                    src={category.image_url}
                    alt={category.name}
                  />

                ) : (

                  <div className="collection-placeholder">
                    <Sparkles size={30} />
                  </div>

                )}

                <div className="collection-overlay">

                  <div>

                    <h3>
                      {category.name}
                    </h3>

                    {category.description && (
                      <p>
                        {category.description}
                      </p>
                    )}

                  </div>

                  <span className="collection-button">

                    Shop Now

                    <ArrowRight size={14} />

                  </span>

                </div>

              </Link>

            ))}

          </div>

        )}

      </section>


      {/* =========================================
          FEATURED PRODUCTS
      ========================================= */}

      <section className="featured-section">

        <div className="featured-heading">

          <div>

            <span>
              CURATED FOR YOU
            </span>

            <h2>
              Featured Creations
            </h2>

          </div>

          <Link
            to="/shop"
            className="view-all-link"
          >
            View All Products
            <ArrowRight size={15} />
          </Link>

        </div>


        {loadingProducts ? (

          <div className="home-loading">
            Loading products...
          </div>

        ) : productError ? (

          <div className="home-error">
            {productError}
          </div>

        ) : products.length === 0 ? (

          <div className="home-empty">
            No products available.
          </div>

        ) : (

          <div className="featured-grid">

            {products
              .filter(
                (product) =>
                  product.is_active !== false
              )
              .slice(0, 4)
              .map((product) => {

                const productId = Number(product.id);

                const isWishlisted =
                  wishlistIds.has(productId);

                const isAdding =
                  addingCartId === productId;

                const isWishlistLoading =
                  wishlistLoadingId === productId;

                return (

                  <article
                    className="featured-card"
                    key={product.id}
                  >

                    {/* PRODUCT IMAGE */}

                    <Link
                      to={`/product/${product.id}`}
                      className="featured-image"
                    >

                      {product.image_url ? (

                        <img
                          src={product.image_url}
                          alt={product.name}
                        />

                      ) : (

                        <div className="product-placeholder">
                          <ShoppingBag size={30} />
                        </div>

                      )}

                      {/* WISHLIST */}

                      <button
                        type="button"
                        className={`product-wishlist ${
                          isWishlisted
                            ? "wishlisted"
                            : ""
                        }`}
                        onClick={(event) =>
                          handleWishlistToggle(
                            event,
                            product
                          )
                        }
                        disabled={
                          isWishlistLoading
                        }
                        aria-label={
                          isWishlisted
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                      >

                        <Heart
                          size={18}
                          fill={
                            isWishlisted
                              ? "currentColor"
                              : "none"
                          }
                        />

                      </button>

                      <div className="quick-view">
                        View Product
                      </div>

                    </Link>


                    {/* PRODUCT INFO */}

                    <div className="featured-info">

                      {product.category?.name && (
                        <span>
                          {product.category.name}
                        </span>
                      )}

                      <h3>
                        {product.name}
                      </h3>


                      <div className="featured-bottom">

                        <strong>
                          ₹
                          {Number(
                            product.price
                          ).toFixed(2)}
                        </strong>

                        <button
                          type="button"
                          className="add-cart"
                          onClick={() =>
                            handleAddToCart(product)
                          }
                          disabled={isAdding}
                        >

                          {isAdding
                            ? "Adding..."
                            : "Add to Cart"}

                        </button>

                      </div>

                    </div>

                  </article>

                );
              })}

          </div>

        )}

      </section>

    </main>
  );
}

export default Home;
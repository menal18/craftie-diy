// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   ArrowLeft,
//   Check,
//   CreditCard,
//   MapPin,
//   Plus,
//   ShoppingBag,
//   Smartphone,
//   Truck,
// } from "lucide-react";

// import { getCart } from "../services/cartService";
// import {
//   getAddresses,
//   createAddress,
// } from "../services/addressService";
// import {
//   createOrder,
//   previewPromoCode,
// } from "../services/checkoutService";
// import { createOrder } from "../services/checkoutService";

// import "./Checkout.css";

// const Checkout = () => {
//   const navigate = useNavigate();

//   const [cart, setCart] = useState(null);
//   const [addresses, setAddresses] = useState([]);

//   const [selectedAddressId, setSelectedAddressId] = useState(null);
//   const [paymentMethod, setPaymentMethod] = useState("COD");

//   const [showAddressForm, setShowAddressForm] = useState(false);

//   const [notes, setNotes] = useState("");

//   const [promoCode, setPromoCode] = useState("");
// const [appliedPromoCode, setAppliedPromoCode] = useState("");
// const [promoDiscount, setPromoDiscount] = useState(0);
// const [promoMessage, setPromoMessage] = useState("");
// const [promoLoading, setPromoLoading] = useState(false);

//   const [loading, setLoading] = useState(true);
//   const [placingOrder, setPlacingOrder] = useState(false);

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [addressForm, setAddressForm] = useState({
//     full_name: "",
//     phone: "",
//     address_line1: "",
//     address_line2: "",
//     city: "",
//     state: "",
//     postal_code: "",
//     country: "India",
//     address_type: "home",
//     is_default: false,
//   });

//   useEffect(() => {
//     loadCheckoutData();
//   }, []);

//   const loadCheckoutData = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const [cartResponse, addressResponse] = await Promise.all([
//         getCart(),
//         getAddresses(),
//       ]);

//       setCart(cartResponse);

//       const addressList = addressResponse?.addresses || [];

//       setAddresses(addressList);

//       const defaultAddress = addressList.find(
//         (address) => address.is_default
//       );

//       if (defaultAddress) {
//         setSelectedAddressId(defaultAddress.id);
//       } else if (addressList.length > 0) {
//         setSelectedAddressId(addressList[0].id);
//       }
//     } catch (err) {
//       console.error("Checkout loading error:", err);

//       setError(
//         err?.response?.data?.message ||
//           "Unable to load checkout details."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddressChange = (e) => {
//     const { name, value, type, checked } = e.target;

//     setAddressForm((previous) => ({
//       ...previous,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleCreateAddress = async (e) => {
//     e.preventDefault();

//     try {
//       setError("");
//       setSuccess("");

//       const response = await createAddress(addressForm);

//       const newAddress = response?.address;

//       if (!newAddress) {
//         throw new Error("Address was not returned by the server.");
//       }

//       const updatedAddresses = [
//         ...addresses,
//         newAddress,
//       ];

//       setAddresses(updatedAddresses);

//       setSelectedAddressId(newAddress.id);

//       setShowAddressForm(false);

//       setAddressForm({
//         full_name: "",
//         phone: "",
//         address_line1: "",
//         address_line2: "",
//         city: "",
//         state: "",
//         postal_code: "",
//         country: "India",
//         address_type: "home",
//         is_default: false,
//       });

//       setSuccess("Address added successfully.");
//     } catch (err) {
//       console.error("Create address error:", err);

//       setError(
//         err?.response?.data?.message ||
//           "Unable to add address."
//       );
//     }
//   };

//   const getCartItems = () => {
//     if (!cart) {
//       return [];
//     }

//     return cart.items || [];
//   };

//   const getItemProduct = (item) => {
//     return item?.product || {};
//   };

//   const getProductName = (item) => {
//     const product = getItemProduct(item);

//     return (
//       item?.product_name ||
//       product?.name ||
//       "Product"
//     );
//   };

//   const getProductImage = (item) => {
//     const product = getItemProduct(item);

//     return (
//       item?.image_url ||
//       product?.image_url ||
//       ""
//     );
//   };

//   const getItemPrice = (item) => {
//     const product = getItemProduct(item);

//     return Number(
//       item?.unit_price ??
//         item?.price ??
//         product?.price ??
//         0
//     );
//   };

//   const getItemQuantity = (item) => {
//     return Number(item?.quantity || 1);
//   };

//   const getItemSubtotal = (item) => {
//     const price = getItemPrice(item);
//     const quantity = getItemQuantity(item);

//     return Number(
//       item?.subtotal ??
//         price * quantity
//     );
//   };

//   const getSubtotal = () => {
//     if (cart?.subtotal !== undefined) {
//       return Number(cart.subtotal || 0);
//     }

//     return getCartItems().reduce(
//       (total, item) => total + getItemSubtotal(item),
//       0
//     );
//   };

//   const getDeliveryCharge = () => {
//     return Number(cart?.delivery_charge || 0);
//   };

//   const getDiscount = () => {
//     return Number(cart?.discount || 0);
//   };

//   const getTotal = () => {
//     if (cart?.total !== undefined) {
//       return Number(cart.total || 0);
//     }

//     return (
//       getSubtotal() +
//       getDeliveryCharge() -
//       getDiscount()
//     );
//   };

//   const formatPrice = (value) => {
//     return `₹${Number(value || 0).toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     })}`;
//   };

//   const handleApplyPromoCode = async () => {
//   const code = promoCode.trim().toUpperCase();

//   setPromoMessage("");

//   if (!code) {
//     setPromoMessage("Please enter a promo code.");
//     return;
//   }

//   try {
//     setPromoLoading(true);

//     const response = await previewPromoCode(
//       code,
//       getSubtotal() - getDiscount()
//     );

//     const discount = Number(
//       response?.discount_amount ??
//       response?.promo_code_discount ??
//       response?.discount ??
//       0
//     );

//     setAppliedPromoCode(code);
//     setPromoDiscount(discount);

//     setPromoMessage(
//       response?.message || "Promo code applied successfully."
//     );
//   } catch (err) {
//     console.error("Promo code error:", err);

//     setAppliedPromoCode("");
//     setPromoDiscount(0);

//     setPromoMessage(
//       err?.response?.data?.message ||
//       "Invalid promo code."
//     );
//   } finally {
//     setPromoLoading(false);
//   }
// };

//   const handlePlaceOrder = async () => {
//     setError("");
//     setSuccess("");

//     if (!selectedAddressId) {
//       setError("Please select a delivery address.");
//       return;
//     }

//     if (!paymentMethod) {
//       setError("Please select a payment method.");
//       return;
//     }

//     if (getCartItems().length === 0) {
//       setError("Your cart is empty.");
//       return;
//     }

//     try {
//       setPlacingOrder(true);

//       const response = await createOrder({
//         addressId: selectedAddressId,
//         paymentMethod,
//         notes,
//       });

//       const order = response?.order;

//       if (!order) {
//         throw new Error(
//           "Order was created but order details were not returned."
//         );
//       }

//       navigate("/order-success", {
//         state: {
//           order,
//         },
//       });
//     } catch (err) {
//       console.error("Place order error:", err);

//       setError(
//         err?.response?.data?.message ||
//           "Unable to place your order."
//       );
//     } finally {
//       setPlacingOrder(false);
//     }
//   };

//   if (loading) {
//     return (
//       <main className="checkout-page">
//         <div className="checkout-loading">
//           <div className="checkout-spinner"></div>
//           <p>Preparing your checkout...</p>
//         </div>
//       </main>
//     );
//   }

//   if (error && !cart) {
//     return (
//       <main className="checkout-page">
//         <div className="checkout-error-page">
//           <h2>Unable to load checkout</h2>
//           <p>{error}</p>

//           <button
//             className="checkout-back-btn"
//             onClick={() => navigate("/cart")}
//           >
//             <ArrowLeft size={18} />
//             Back to Cart
//           </button>
//         </div>
//       </main>
//     );
//   }

//   const cartItems = getCartItems();

//   if (cartItems.length === 0) {
//     return (
//       <main className="checkout-page">
//         <div className="checkout-empty">
//           <div className="checkout-empty-icon">
//             <ShoppingBag size={42} />
//           </div>

//           <h2>Your cart is empty</h2>

//           <p>
//             Add some beautiful handmade products before
//             continuing to checkout.
//           </p>

//           <button
//             className="checkout-shop-btn"
//             onClick={() => navigate("/shop")}
//           >
//             Continue Shopping
//           </button>
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="checkout-page">

//       <div className="checkout-container">

//         {/* Header */}

//         <div className="checkout-header">
//           <button
//             className="checkout-back-link"
//             onClick={() => navigate("/cart")}
//           >
//             <ArrowLeft size={18} />
//             Back to Cart
//           </button>

//           <div>
//             <span className="checkout-eyebrow">
//               CRAFTIEDIY
//             </span>

//             <h1>Checkout</h1>

//             <p>
//               Complete your order securely and easily.
//             </p>
//           </div>
//         </div>

//         {error && (
//           <div className="checkout-alert checkout-alert-error">
//             {error}
//           </div>
//         )}

//         {success && (
//           <div className="checkout-alert checkout-alert-success">
//             <Check size={18} />
//             {success}
//           </div>
//         )}

//         <div className="checkout-layout">

//           {/* LEFT */}

//           <section className="checkout-main">

//             {/* ADDRESS */}

//             <div className="checkout-card">

//               <div className="checkout-section-heading">

//                 <div className="checkout-heading-icon">
//                   <MapPin size={20} />
//                 </div>

//                 <div>
//                   <span>01</span>
//                   <h2>Delivery Address</h2>
//                   <p>
//                     Where should we deliver your order?
//                   </p>
//                 </div>

//               </div>

//               {addresses.length > 0 ? (
//                 <div className="address-list">

//                   {addresses.map((address) => (
//                     <button
//                       type="button"
//                       key={address.id}
//                       className={`address-card ${
//                         selectedAddressId === address.id
//                           ? "selected"
//                           : ""
//                       }`}
//                       onClick={() =>
//                         setSelectedAddressId(address.id)
//                       }
//                     >

//                       <div className="address-radio">
//                         {selectedAddressId === address.id && (
//                           <span></span>
//                         )}
//                       </div>

//                       <div className="address-content">

//                         <div className="address-top">

//                           <strong>
//                             {address.full_name}
//                           </strong>

//                           {address.is_default && (
//                             <span className="default-badge">
//                               Default
//                             </span>
//                           )}

//                         </div>

//                         <p>
//                           {address.address_line1}
//                         </p>

//                         {address.address_line2 && (
//                           <p>
//                             {address.address_line2}
//                           </p>
//                         )}

//                         <p>
//                           {address.city},{" "}
//                           {address.state}{" "}
//                           {address.postal_code}
//                         </p>

//                         <p>
//                           {address.country}
//                         </p>

//                         <span className="address-phone">
//                           {address.phone}
//                         </span>

//                       </div>

//                     </button>
//                   ))}

//                 </div>
//               ) : (
//                 <div className="no-address">
//                   <MapPin size={24} />

//                   <div>
//                     <strong>
//                       No delivery address found
//                     </strong>

//                     <p>
//                       Add an address to continue.
//                     </p>
//                   </div>
//                 </div>
//               )}

//               <button
//                 type="button"
//                 className="add-address-btn"
//                 onClick={() =>
//                   setShowAddressForm(!showAddressForm)
//                 }
//               >
//                 <Plus size={18} />

//                 {showAddressForm
//                   ? "Close Address Form"
//                   : "Add New Address"}
//               </button>

//               {showAddressForm && (
//                 <form
//                   className="address-form"
//                   onSubmit={handleCreateAddress}
//                 >

//                   <div className="form-grid">

//                     <div className="form-group">
//                       <label>Full Name</label>

//                       <input
//                         type="text"
//                         name="full_name"
//                         value={addressForm.full_name}
//                         onChange={handleAddressChange}
//                         placeholder="Enter full name"
//                         required
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label>Phone</label>

//                       <input
//                         type="tel"
//                         name="phone"
//                         value={addressForm.phone}
//                         onChange={handleAddressChange}
//                         placeholder="Enter phone number"
//                         required
//                       />
//                     </div>

//                     <div className="form-group full-width">
//                       <label>Address Line 1</label>

//                       <input
//                         type="text"
//                         name="address_line1"
//                         value={addressForm.address_line1}
//                         onChange={handleAddressChange}
//                         placeholder="House / Flat / Street"
//                         required
//                       />
//                     </div>

//                     <div className="form-group full-width">
//                       <label>
//                         Address Line 2
//                         <span>Optional</span>
//                       </label>

//                       <input
//                         type="text"
//                         name="address_line2"
//                         value={addressForm.address_line2}
//                         onChange={handleAddressChange}
//                         placeholder="Apartment, landmark, etc."
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label>City</label>

//                       <input
//                         type="text"
//                         name="city"
//                         value={addressForm.city}
//                         onChange={handleAddressChange}
//                         placeholder="City"
//                         required
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label>State</label>

//                       <input
//                         type="text"
//                         name="state"
//                         value={addressForm.state}
//                         onChange={handleAddressChange}
//                         placeholder="State"
//                         required
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label>Postal Code</label>

//                       <input
//                         type="text"
//                         name="postal_code"
//                         value={addressForm.postal_code}
//                         onChange={handleAddressChange}
//                         placeholder="Postal code"
//                         required
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label>Country</label>

//                       <input
//                         type="text"
//                         name="country"
//                         value={addressForm.country}
//                         onChange={handleAddressChange}
//                         placeholder="Country"
//                         required
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label>Address Type</label>

//                       <select
//                         name="address_type"
//                         value={addressForm.address_type}
//                         onChange={handleAddressChange}
//                       >
//                         <option value="home">
//                           Home
//                         </option>

//                         <option value="work">
//                           Work
//                         </option>

//                         <option value="other">
//                           Other
//                         </option>
//                       </select>
//                     </div>

//                   </div>

//                   <label className="default-checkbox">

//                     <input
//                       type="checkbox"
//                       name="is_default"
//                       checked={addressForm.is_default}
//                       onChange={handleAddressChange}
//                     />

//                     <span>
//                       Make this my default address
//                     </span>

//                   </label>

//                   <button
//                     type="submit"
//                     className="save-address-btn"
//                   >
//                     Save Address
//                   </button>

//                 </form>
//               )}

//             </div>

//             {/* PAYMENT */}

//             <div className="checkout-card">

//               <div className="checkout-section-heading">

//                 <div className="checkout-heading-icon">
//                   <CreditCard size={20} />
//                 </div>

//                 <div>
//                   <span>02</span>
//                   <h2>Payment Method</h2>
//                   <p>
//                     Choose how you would like to pay.
//                   </p>
//                 </div>

//               </div>

//               <div className="payment-options">

//                 <button
//                   type="button"
//                   className={`payment-option ${
//                     paymentMethod === "COD"
//                       ? "selected"
//                       : ""
//                   }`}
//                   onClick={() =>
//                     setPaymentMethod("COD")
//                   }
//                 >
//                   <div className="payment-icon">
//                     <Truck size={22} />
//                   </div>

//                   <div className="payment-info">
//                     <strong>
//                       Cash on Delivery
//                     </strong>

//                     <span>
//                       Pay when your order arrives
//                     </span>
//                   </div>

//                   <div className="payment-radio">
//                     {paymentMethod === "COD" && (
//                       <span></span>
//                     )}
//                   </div>
//                 </button>

//                 <button
//                   type="button"
//                   className={`payment-option ${
//                     paymentMethod === "CARD"
//                       ? "selected"
//                       : ""
//                   }`}
//                   onClick={() =>
//                     setPaymentMethod("CARD")
//                   }
//                 >
//                   <div className="payment-icon">
//                     <CreditCard size={22} />
//                   </div>

//                   <div className="payment-info">
//                     <strong>
//                       Card Payment
//                     </strong>

//                     <span>
//                       Pay securely using your card
//                     </span>
//                   </div>

//                   <div className="payment-radio">
//                     {paymentMethod === "CARD" && (
//                       <span></span>
//                     )}
//                   </div>
//                 </button>

//                 <button
//                   type="button"
//                   className={`payment-option ${
//                     paymentMethod === "UPI"
//                       ? "selected"
//                       : ""
//                   }`}
//                   onClick={() =>
//                     setPaymentMethod("UPI")
//                   }
//                 >
//                   <div className="payment-icon">
//                     <Smartphone size={22} />
//                   </div>

//                   <div className="payment-info">
//                     <strong>
//                       UPI
//                     </strong>

//                     <span>
//                       Pay using your UPI app
//                     </span>
//                   </div>

//                   <div className="payment-radio">
//                     {paymentMethod === "UPI" && (
//                       <span></span>
//                     )}
//                   </div>
//                 </button>

//                 <button
//                   type="button"
//                   className={`payment-option ${
//                     paymentMethod === "STRIPE"
//                       ? "selected"
//                       : ""
//                   }`}
//                   onClick={() =>
//                     setPaymentMethod("STRIPE")
//                   }
//                 >
//                   <div className="payment-icon">
//                     <CreditCard size={22} />
//                   </div>

//                   <div className="payment-info">
//                     <strong>
//                       Stripe
//                     </strong>

//                     <span>
//                       Secure online payment
//                     </span>
//                   </div>

//                   <div className="payment-radio">
//                     {paymentMethod === "STRIPE" && (
//                       <span></span>
//                     )}
//                   </div>
//                 </button>

//               </div>

//             </div>

//             {/* NOTES */}

//             <div className="checkout-card">

//               <div className="checkout-section-heading compact">

//                 <div className="checkout-heading-icon">
//                   <ShoppingBag size={20} />
//                 </div>

//                 <div>
//                   <span>03</span>
//                   <h2>Order Notes</h2>
//                   <p>
//                     Add any special delivery instructions.
//                   </p>
//                 </div>

//               </div>

//               <textarea
//                 value={notes}
//                 onChange={(e) =>
//                   setNotes(e.target.value)
//                 }
//                 placeholder="Example: Please leave the package at the front desk..."
//                 rows="4"
//               />

//             </div>

//           </section>

//           {/* RIGHT */}

//           <aside className="checkout-sidebar">

//             <div className="order-summary">

//               <div className="summary-header">
//                 <div>
//                   <span>YOUR ORDER</span>
//                   <h2>Order Summary</h2>
//                 </div>

//                 <ShoppingBag size={22} />
//               </div>

//               <div className="summary-items">

//                 {cartItems.map((item, index) => {

//                   const imageUrl =
//                     getProductImage(item);

//                   return (
//                     <div
//                       className="summary-item"
//                       key={
//                         item.id ||
//                         item.product_id ||
//                         index
//                       }
//                     >

//                       <div className="summary-product-image">

//                         {imageUrl ? (
//                           <img
//                             src={imageUrl}
//                             alt={getProductName(item)}
//                           />
//                         ) : (
//                           <ShoppingBag size={20} />
//                         )}

//                         <span>
//                           {getItemQuantity(item)}
//                         </span>

//                       </div>

//                       <div className="summary-product-info">

//                         <strong>
//                           {getProductName(item)}
//                         </strong>

//                         <span>
//                           {formatPrice(
//                             getItemPrice(item)
//                           )}{" "}
//                           ×{" "}
//                           {getItemQuantity(item)}
//                         </span>

//                       </div>

//                       <strong className="summary-item-price">
//                         {formatPrice(
//                           getItemSubtotal(item)
//                         )}
//                       </strong>

//                     </div>
//                   );
//                 })}

//               </div>

//               <div className="summary-divider"></div>

//               <div className="summary-row">
//                 <span>Subtotal</span>

//                 <strong>
//                   {formatPrice(getSubtotal())}
//                 </strong>
//               </div>

//               <div className="summary-row">
//                 <span>Delivery</span>

//                 <strong>
//                   {getDeliveryCharge() === 0
//                     ? "FREE"
//                     : formatPrice(
//                         getDeliveryCharge()
//                       )}
//                 </strong>
//               </div>

//               {getDiscount() > 0 && (
//                 <div className="summary-row discount-row">
//                   <span>Discount</span>

//                   <strong>
//                     -{formatPrice(getDiscount())}
//                   </strong>
//                 </div>
//               )}

//               <div className="summary-total">
//                 <span>Total</span>

//                 <strong>
//                   {formatPrice(getTotal())}
//                 </strong>
//               </div>

//               <button
//                 type="button"
//                 className="place-order-btn"
//                 onClick={handlePlaceOrder}
//                 disabled={
//                   placingOrder ||
//                   !selectedAddressId
//                 }
//               >
//                 {placingOrder ? (
//                   <>
//                     <span className="button-spinner"></span>
//                     Placing Order...
//                   </>
//                 ) : (
//                   <>
//                     Place Order
//                     <Check size={19} />
//                   </>
//                 )}
//               </button>

//               {!selectedAddressId && (
//                 <p className="checkout-hint">
//                   Please select a delivery address.
//                 </p>
//               )}

//               <div className="secure-checkout">

//                 <Check size={16} />

//                 <span>
//                   Your order details are securely
//                   processed.
//                 </span>

//               </div>

//             </div>

//           </aside>

//         </div>

//       </div>

//     </main>
//   );
// };

// export default Checkout;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CreditCard,
  MapPin,
  Plus,
  ShoppingBag,
  Smartphone,
  Truck,
  Tag,
  X,
} from "lucide-react";

import { getCart } from "../services/cartService";
import { getAddresses, createAddress } from "../services/addressService";

import { createOrder, previewPromoCode } from "../services/checkoutService";

import "./Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [showAddressForm, setShowAddressForm] = useState(false);

  const [notes, setNotes] = useState("");

  // Promo code
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [addressForm, setAddressForm] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    address_type: "home",
    is_default: false,
  });

  useEffect(() => {
    loadCheckoutData();
  }, []);

  // --------------------------------------------------
  // LOAD CHECKOUT DATA
  // --------------------------------------------------

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      setError("");

      const [cartResponse, addressResponse] = await Promise.all([
        getCart(),
        getAddresses(),
      ]);

      setCart(cartResponse);

      const addressList = addressResponse?.addresses || [];

      setAddresses(addressList);

      const defaultAddress = addressList.find((address) => address.is_default);

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (addressList.length > 0) {
        setSelectedAddressId(addressList[0].id);
      }
    } catch (err) {
      console.error("Checkout loading error:", err);

      setError(
        err?.response?.data?.message || "Unable to load checkout details.",
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // ADDRESS
  // --------------------------------------------------

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;

    setAddressForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");

      const response = await createAddress(addressForm);

      const newAddress = response?.address;

      if (!newAddress) {
        throw new Error("Address was not returned by the server.");
      }

      const updatedAddresses = [...addresses, newAddress];

      setAddresses(updatedAddresses);
      setSelectedAddressId(newAddress.id);

      setShowAddressForm(false);

      setAddressForm({
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        address_type: "home",
        is_default: false,
      });

      setSuccess("Address added successfully.");
    } catch (err) {
      console.error("Create address error:", err);

      setError(err?.response?.data?.message || "Unable to add address.");
    }
  };

  // --------------------------------------------------
  // CART HELPERS
  // --------------------------------------------------

  const getCartItems = () => {
    if (!cart) {
      return [];
    }

    return cart.items || [];
  };

  const getItemProduct = (item) => {
    return item?.product || {};
  };

  const getProductName = (item) => {
    const product = getItemProduct(item);

    return item?.product_name || product?.name || "Product";
  };

  const getProductImage = (item) => {
    const product = getItemProduct(item);

    return item?.image_url || product?.image_url || "";
  };

  const getItemPrice = (item) => {
    const product = getItemProduct(item);

    return Number(item?.unit_price ?? item?.price ?? product?.price ?? 0);
  };

  const getItemQuantity = (item) => {
    return Number(item?.quantity || 1);
  };

  const getItemSubtotal = (item) => {
    const price = getItemPrice(item);
    const quantity = getItemQuantity(item);

    return Number(item?.subtotal ?? price * quantity);
  };

  // Original subtotal from backend
  const getSubtotal = () => {
    if (cart?.subtotal !== undefined) {
      return Number(cart.subtotal || 0);
    }

    return getCartItems().reduce(
      (total, item) => total + getItemSubtotal(item),
      0,
    );
  };

  // Product promotion discount
  const getProductDiscount = () => {
    return Number(cart?.promotion_discount ?? cart?.discount ?? 0);
  };

  // Amount after product promotion
  const getPromotionalSubtotal = () => {
    return Math.max(0, getSubtotal() - getProductDiscount());
  };

  const getDeliveryCharge = () => {
    return Number(cart?.delivery_charge || 0);
  };

  // Total discount = product promotion + promo code
  const getTotalDiscount = () => {
    return getProductDiscount() + Number(promoDiscount || 0);
  };

  // Final frontend preview total
  const getCheckoutTotal = () => {
    return Math.max(
      0,
      getSubtotal() + getDeliveryCharge() - getTotalDiscount(),
    );
  };

  const formatPrice = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // --------------------------------------------------
  // PROMO CODE
  // --------------------------------------------------

  const handleApplyPromoCode = async () => {
    const code = promoCode.trim().toUpperCase();

    setPromoMessage("");

    if (!code) {
      setPromoMessage("Please enter a promo code.");
      return;
    }

    if (appliedPromoCode) {
      setPromoMessage("A promo code is already applied.");
      return;
    }

    try {
      setPromoLoading(true);
      setError("");

      /*
       * Promo code should be calculated against
       * the price after product promotion.
       */
      const promotionalSubtotal = getPromotionalSubtotal();

      const response = await previewPromoCode(code, promotionalSubtotal);
      const preview = response?.promo_code ?? response;

      const discount = Number(
        preview?.discount_amount ??
          preview?.promo_code_discount ??
          preview?.discount ??
          response?.discount_amount ??
          response?.promo_code_discount ??
          0,
      );

      if (discount <= 0) {
        setPromoMessage(
          response?.message || "This promo code does not provide a discount.",
        );
        return;
      }

      setAppliedPromoCode(code);
      setPromoDiscount(discount);

      setPromoCode(code);

      setPromoMessage(response?.message || "Promo code applied successfully.");
    } catch (err) {
      console.error("Promo code error:", err);

      setAppliedPromoCode("");
      setPromoDiscount(0);

      setPromoMessage(err?.response?.data?.message || "Invalid promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromoCode("");
    setPromoDiscount(0);
    setPromoMessage("");
    setPromoCode("");
  };

  // --------------------------------------------------
  // PLACE ORDER
  // --------------------------------------------------

  const handlePlaceOrder = async () => {
    setError("");
    setSuccess("");

    if (!selectedAddressId) {
      setError("Please select a delivery address.");
      return;
    }

    if (!paymentMethod) {
      setError("Please select a payment method.");
      return;
    }

    if (getCartItems().length === 0) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await createOrder({
        addressId: selectedAddressId,
        paymentMethod,
        notes,
        promoCode: appliedPromoCode || null,
      });

      const order = response?.order;

      if (!order) {
        throw new Error(
          "Order was created but order details were not returned.",
        );
      }

      navigate("/order-success", {
        state: {
          order,
        },
      });
    } catch (err) {
      console.error("Place order error:", err);

      setError(err?.response?.data?.message || "Unable to place your order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="checkout-page">
        <div className="checkout-loading">
          <div className="checkout-spinner"></div>

          <p>Preparing your checkout...</p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // ERROR PAGE
  // --------------------------------------------------

  if (error && !cart) {
    return (
      <main className="checkout-page">
        <div className="checkout-error-page">
          <h2>Unable to load checkout</h2>

          <p>{error}</p>

          <button
            className="checkout-back-btn"
            onClick={() => navigate("/cart")}
          >
            <ArrowLeft size={18} />
            Back to Cart
          </button>
        </div>
      </main>
    );
  }

  const cartItems = getCartItems();

  // --------------------------------------------------
  // EMPTY CART
  // --------------------------------------------------

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-empty">
          <div className="checkout-empty-icon">
            <ShoppingBag size={42} />
          </div>

          <h2>Your cart is empty</h2>

          <p>
            Add some beautiful handmade products before continuing to checkout.
          </p>

          <button
            className="checkout-shop-btn"
            onClick={() => navigate("/shop")}
          >
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        {/* HEADER */}

        <div className="checkout-header">
          <button
            className="checkout-back-link"
            onClick={() => navigate("/cart")}
          >
            <ArrowLeft size={18} />
            Back to Cart
          </button>

          <div>
            <span className="checkout-eyebrow">CRAFTIEDIY</span>

            <h1>Checkout</h1>

            <p>Complete your order securely and easily.</p>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="checkout-alert checkout-alert-error">{error}</div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="checkout-alert checkout-alert-success">
            <Check size={18} />
            {success}
          </div>
        )}

        <div className="checkout-layout">
          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <section className="checkout-main">
            {/* ADDRESS */}

            <div className="checkout-card">
              <div className="checkout-section-heading">
                <div className="checkout-heading-icon">
                  <MapPin size={20} />
                </div>

                <div>
                  <span>01</span>

                  <h2>Delivery Address</h2>

                  <p>Where should we deliver your order?</p>
                </div>
              </div>

              {addresses.length > 0 ? (
                <div className="address-list">
                  {addresses.map((address) => (
                    <button
                      type="button"
                      key={address.id}
                      className={`address-card ${
                        selectedAddressId === address.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedAddressId(address.id)}
                    >
                      <div className="address-radio">
                        {selectedAddressId === address.id && <span></span>}
                      </div>

                      <div className="address-content">
                        <div className="address-top">
                          <strong>{address.full_name}</strong>

                          {address.is_default && (
                            <span className="default-badge">Default</span>
                          )}
                        </div>

                        <p>{address.address_line1}</p>

                        {address.address_line2 && (
                          <p>{address.address_line2}</p>
                        )}

                        <p>
                          {address.city}, {address.state} {address.postal_code}
                        </p>

                        <p>{address.country}</p>

                        <span className="address-phone">{address.phone}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="no-address">
                  <MapPin size={24} />

                  <div>
                    <strong>No delivery address found</strong>

                    <p>Add an address to continue.</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="add-address-btn"
                onClick={() => setShowAddressForm(!showAddressForm)}
              >
                <Plus size={18} />

                {showAddressForm ? "Close Address Form" : "Add New Address"}
              </button>

              {showAddressForm && (
                <form className="address-form" onSubmit={handleCreateAddress}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name</label>

                      <input
                        type="text"
                        name="full_name"
                        value={addressForm.full_name}
                        onChange={handleAddressChange}
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone</label>

                      <input
                        type="tel"
                        name="phone"
                        value={addressForm.phone}
                        onChange={handleAddressChange}
                        placeholder="Enter phone number"
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Address Line 1</label>

                      <input
                        type="text"
                        name="address_line1"
                        value={addressForm.address_line1}
                        onChange={handleAddressChange}
                        placeholder="House / Flat / Street"
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>
                        Address Line 2<span>Optional</span>
                      </label>

                      <input
                        type="text"
                        name="address_line2"
                        value={addressForm.address_line2}
                        onChange={handleAddressChange}
                        placeholder="Apartment, landmark, etc."
                      />
                    </div>

                    <div className="form-group">
                      <label>City</label>

                      <input
                        type="text"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        placeholder="City"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>State</label>

                      <input
                        type="text"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressChange}
                        placeholder="State"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Postal Code</label>

                      <input
                        type="text"
                        name="postal_code"
                        value={addressForm.postal_code}
                        onChange={handleAddressChange}
                        placeholder="Postal code"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Country</label>

                      <input
                        type="text"
                        name="country"
                        value={addressForm.country}
                        onChange={handleAddressChange}
                        placeholder="Country"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Address Type</label>

                      <select
                        name="address_type"
                        value={addressForm.address_type}
                        onChange={handleAddressChange}
                      >
                        <option value="home">Home</option>

                        <option value="work">Work</option>

                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <label className="default-checkbox">
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={addressForm.is_default}
                      onChange={handleAddressChange}
                    />

                    <span>Make this my default address</span>
                  </label>

                  <button type="submit" className="save-address-btn">
                    Save Address
                  </button>
                </form>
              )}
            </div>

            {/* PAYMENT */}

            <div className="checkout-card">
              <div className="checkout-section-heading">
                <div className="checkout-heading-icon">
                  <CreditCard size={20} />
                </div>

                <div>
                  <span>02</span>

                  <h2>Payment Method</h2>

                  <p>Choose how you would like to pay.</p>
                </div>
              </div>

              <div className="payment-options">
                {/* COD */}

                <button
                  type="button"
                  className={`payment-option ${
                    paymentMethod === "COD" ? "selected" : ""
                  }`}
                  onClick={() => setPaymentMethod("COD")}
                >
                  <div className="payment-icon">
                    <Truck size={22} />
                  </div>

                  <div className="payment-info">
                    <strong>Cash on Delivery</strong>

                    <span>Pay when your order arrives</span>
                  </div>

                  <div className="payment-radio">
                    {paymentMethod === "COD" && <span></span>}
                  </div>
                </button>

                {/* CARD */}

                <button
                  type="button"
                  className={`payment-option ${
                    paymentMethod === "CARD" ? "selected" : ""
                  }`}
                  onClick={() => setPaymentMethod("CARD")}
                >
                  <div className="payment-icon">
                    <CreditCard size={22} />
                  </div>

                  <div className="payment-info">
                    <strong>Card Payment</strong>

                    <span>Pay securely using your card</span>
                  </div>

                  <div className="payment-radio">
                    {paymentMethod === "CARD" && <span></span>}
                  </div>
                </button>

                {/* UPI */}

                <button
                  type="button"
                  className={`payment-option ${
                    paymentMethod === "UPI" ? "selected" : ""
                  }`}
                  onClick={() => setPaymentMethod("UPI")}
                >
                  <div className="payment-icon">
                    <Smartphone size={22} />
                  </div>

                  <div className="payment-info">
                    <strong>UPI</strong>

                    <span>Pay using your UPI app</span>
                  </div>

                  <div className="payment-radio">
                    {paymentMethod === "UPI" && <span></span>}
                  </div>
                </button>

                {/* STRIPE */}

                <button
                  type="button"
                  className={`payment-option ${
                    paymentMethod === "STRIPE" ? "selected" : ""
                  }`}
                  onClick={() => setPaymentMethod("STRIPE")}
                >
                  <div className="payment-icon">
                    <CreditCard size={22} />
                  </div>

                  <div className="payment-info">
                    <strong>Stripe</strong>

                    <span>Secure online payment</span>
                  </div>

                  <div className="payment-radio">
                    {paymentMethod === "STRIPE" && <span></span>}
                  </div>
                </button>
              </div>
            </div>

            {/* NOTES */}

            <div className="checkout-card">
              <div className="checkout-section-heading compact">
                <div className="checkout-heading-icon">
                  <ShoppingBag size={20} />
                </div>

                <div>
                  <span>03</span>

                  <h2>Order Notes</h2>

                  <p>Add any special delivery instructions.</p>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: Please leave the package at the front desk..."
                rows="4"
              />
            </div>
          </section>

          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <aside className="checkout-sidebar">
            <div className="order-summary">
              <div className="summary-header">
                <div>
                  <span>YOUR ORDER</span>

                  <h2>Order Summary</h2>
                </div>

                <ShoppingBag size={22} />
              </div>

              {/* ITEMS */}

              <div className="summary-items">
                {cartItems.map((item, index) => {
                  const imageUrl = getProductImage(item);

                  return (
                    <div
                      className="summary-item"
                      key={item.id || item.product_id || index}
                    >
                      <div className="summary-product-image">
                        {imageUrl ? (
                          <img src={imageUrl} alt={getProductName(item)} />
                        ) : (
                          <ShoppingBag size={20} />
                        )}

                        <span>{getItemQuantity(item)}</span>
                      </div>

                      <div className="summary-product-info">
                        <strong>{getProductName(item)}</strong>

                        <span>
                          {formatPrice(getItemPrice(item))} ×{" "}
                          {getItemQuantity(item)}
                        </span>
                      </div>

                      <strong className="summary-item-price">
                        {formatPrice(getItemSubtotal(item))}
                      </strong>
                    </div>
                  );
                })}
              </div>

              <div className="summary-divider"></div>

              {/* PROMO CODE */}

              <div className="promo-section">
                <div className="promo-title">
                  <Tag size={17} />

                  <span>Have a promo code?</span>
                </div>

                {!appliedPromoCode ? (
                  <div className="promo-input-row">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());

                        if (promoMessage) {
                          setPromoMessage("");
                        }
                      }}
                      placeholder="Enter promo code"
                      disabled={promoLoading || placingOrder}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();

                          handleApplyPromoCode();
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      disabled={
                        promoLoading || !promoCode.trim() || placingOrder
                      }
                    >
                      {promoLoading ? "..." : "Apply"}
                    </button>
                  </div>
                ) : (
                  <div className="applied-promo">
                    <div>
                      <strong>{appliedPromoCode}</strong>

                      <span>Promo code applied</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemovePromoCode}
                      disabled={placingOrder}
                      aria-label="Remove promo code"
                    >
                      <X size={17} />
                    </button>
                  </div>
                )}

                {promoMessage && (
                  <p
                    className={`promo-message ${
                      promoDiscount > 0 ? "success" : "error"
                    }`}
                  >
                    {promoMessage}
                  </p>
                )}
              </div>

              <div className="summary-divider"></div>

              {/* SUBTOTAL */}

              <div className="summary-row">
                <span>Subtotal</span>

                <strong>{formatPrice(getSubtotal())}</strong>
              </div>

              {/* PRODUCT PROMOTION */}

              {getProductDiscount() > 0 && (
                <div className="summary-row discount-row">
                  <span>Product Discount</span>

                  <strong>-{formatPrice(getProductDiscount())}</strong>
                </div>
              )}

              {/* PROMO CODE DISCOUNT */}

              {promoDiscount > 0 && (
                <div className="summary-row discount-row promo-discount-row">
                  <span>Promo Code Discount</span>

                  <strong>-{formatPrice(promoDiscount)}</strong>
                </div>
              )}

              {/* DELIVERY */}

              <div className="summary-row">
                <span>Delivery</span>

                <strong>
                  {getDeliveryCharge() === 0
                    ? "FREE"
                    : formatPrice(getDeliveryCharge())}
                </strong>
              </div>

              {/* TOTAL */}

              <div className="summary-total">
                <span>Total</span>

                <strong>{formatPrice(getCheckoutTotal())}</strong>
              </div>

              {/* PLACE ORDER */}

              <button
                type="button"
                className="place-order-btn"
                onClick={handlePlaceOrder}
                disabled={placingOrder || !selectedAddressId}
              >
                {placingOrder ? (
                  <>
                    <span className="button-spinner"></span>
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order
                    <Check size={19} />
                  </>
                )}
              </button>

              {!selectedAddressId && (
                <p className="checkout-hint">
                  Please select a delivery address.
                </p>
              )}

              <div className="secure-checkout">
                <Check size={16} />

                <span>Your order details are securely processed.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Checkout;

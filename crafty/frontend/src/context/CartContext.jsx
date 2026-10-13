import { createContext, useContext, useEffect, useState } from "react";
import { getCart } from "../services/cartService";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  const clearCart = () => {
    setCartItems([]);
    setCartCount(0);
    localStorage.removeItem("craftie_cart");
  };

  const refreshCart = async () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || user?.role === "admin") {
      clearCart();
      return;
    }

    try {
      const cart = await getCart();
      const items = cart?.items || [];

      setCartItems(items);
      setCartCount(
        Number(
          cart?.total_items ??
            items.reduce(
              (total, item) => total + Number(item.quantity || 0),
              0,
            ),
        ),
      );
    } catch (error) {
      clearCart();
      throw error;
    }
  };

  useEffect(() => {
    refreshCart().catch(() => {});

    const handleAuthChange = () => {
      refreshCart().catch(() => {});
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}

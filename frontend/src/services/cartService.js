
import api from "./api";

const CART_CODE_KEY = "api_store_cart_code";

// Get or create cart code
export const getCartCode = () => {
  let cartCode = localStorage.getItem(CART_CODE_KEY);

  if (!cartCode) {
    cartCode =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `cart-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(CART_CODE_KEY, cartCode);
  }

  return cartCode;
};

// Notify cart updates
const notifyCartUpdated = () => {
  window.dispatchEvent(new Event("cartUpdated"));
};

// Add product to cart
export const addToCart = async (productId) => {
  const response = await api.post("/cart/add/", {
    cart_code: getCartCode(),
    product_id: productId,
  });

  notifyCartUpdated();
  return response.data;
};

// Get cart
export const getCart = async () => {
  const response = await api.get(`/cart/${getCartCode()}/`);
  return response.data;
};

// Update cart item quantity
export const updateCartItem = async (itemId, quantity) => {
  const response = await api.put("/cart/update/", {
    item_id: itemId,
    quantity,
  });

  notifyCartUpdated();
  return response.data;
};

// Remove cart item
export const removeCartItem = async (itemId) => {
  const response = await api.delete(`/cartitems/delete/${itemId}/`);

  notifyCartUpdated();
  return response.data;
};

// Checkout - COD and Stripe
export const checkoutCart = async ({
  name,
  email,
  phone,
  address,
  payment_method = "cod",
}) => {
  const response = await api.post("/checkout/", {
    cart_code: getCartCode(),
    name,
    email,
    phone,
    address,
    payment_method,
  });

  notifyCartUpdated();
  return response.data;
};

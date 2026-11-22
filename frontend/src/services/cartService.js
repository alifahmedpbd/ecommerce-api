
import api from './api'

const CART_CODE_KEY = 'api_store_cart_code'

// Get or create cart code
export const getCartCode = () => {
  let cartCode = localStorage.getItem(CART_CODE_KEY)

  if (!cartCode) {
    cartCode = crypto.randomUUID()
    localStorage.setItem(CART_CODE_KEY, cartCode)
  }

  return cartCode
}

// Add product to cart
export const addToCart = async (productId) => {
  const response = await api.post('/cart/add/', {
    cart_code: getCartCode(),
    product_id: productId,
  })

  window.dispatchEvent(new Event("cartUpdated"));

  return response.data
}

// Get cart
export const getCart = async () => {
  const response = await api.get(`/cart/${getCartCode()}/`)
  return response.data
}

// Update cart item quantity
export const updateCartItem = async (itemId, quantity) => {
  const response = await api.put('/cart/update/', {
    item_id: itemId,
    quantity,
  })

  return response.data
}

// Remove cart item
export const removeCartItem = async (itemId) => {
  const response = await api.delete(`/cartitems/delete/${itemId}/`)
  return response.data
}

// Checkout
export const checkoutCart = async (email) => {
  const response = await api.post('/checkout/', {
    cart_code: getCartCode(),
    email,
  })

  return response.data
}

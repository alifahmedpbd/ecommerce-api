
import api from './api'

export const getWishlist = async () => {
  const response = await api.get('/wishlist/')
  return response.data
}

export const toggleWishlist = async (email, productId) => {
  const response = await api.post('/wishlist/add/', {
    email,
    product_id: productId,
  })
  return response.data
}


import api from './api'

export const getProductReviews = async (slug) => {
  const response = await api.get(`/products/${slug}/reviews/`)
  return response.data
}

export const addReview = async (data) => {
  const response = await api.post('/reviews/add/', data)
  return response.data
}

export const updateReview = async (id, data) => {
  const response = await api.put(`/reviews/update/${id}/`, data)
  return response.data
}

export const deleteReview = async (id) => {
  const response = await api.delete(`/reviews/delete/${id}/`)
  return response.data
}

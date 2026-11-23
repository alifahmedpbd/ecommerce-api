
import api from './api'

export const getProducts = async () => {
  const response = await api.get('/products/')
  return response.data.results ?? response.data
}

export const getCategories = async () => {
  const response = await api.get('/categories/')
  return response.data.results ?? response.data
}

export const getProductDetails = async (slug) => {
  const response = await api.get(`/products/${slug}/`)
  return response.data
}

// Collect products from all categories and featured products
export const getShopProducts = async () => {
  const categories = await getCategories()

  const categoryResults = await Promise.allSettled(
    categories.map(async (category) => {
      const response = await api.get(`/categories/${category.slug}/`)
      const data = response.data

      return (data.products || []).map((product) => ({
        ...product,
        category_slug: category.slug,
        category_name: category.name,
      }))
    })
  )

  const categoryProducts = categoryResults
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value)

  const featuredProducts = await getProducts()

  const allProducts = [...categoryProducts, ...featuredProducts]

  // Remove duplicate products using product ID
  return Array.from(
    new Map(allProducts.map((product) => [product.id, product])).values()
  )
}


export const searchProducts = async (query) => {
  const response = await api.get('/products/search/', {
    params: { query },
  })
  return response.data
}


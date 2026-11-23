
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Trash2 } from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import {
  getWishlist,
  toggleWishlist,
} from '../../services/wishlistService'

export default function Wishlist() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [fetching, setFetching] = useState(true)
  const [removingId, setRemovingId] = useState(null)

  const loadWishlist = async () => {
    try {
      const data = await getWishlist()
      const list = Array.isArray(data)
        ? data
        : data?.results || data?.data || []

      setItems(list)
    } catch (error) {
      console.error('Wishlist loading error:', error)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (loading) return

    if (!user) {
      navigate('/login')
      return
    }

    loadWishlist()
  }, [user, loading])

  const handleRemove = async (productId) => {
    try {
      setRemovingId(productId)
      await toggleWishlist(user.email, productId)
      setItems(current =>
        current.filter(item => item.product?.id !== productId)
      )
    } catch (error) {
      console.error('Wishlist remove error:', error)
      alert('Unable to remove this product.')
    } finally {
      setRemovingId(null)
    }
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading wishlist...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <section className="bg-[#171717] text-white py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-5">
          <p className="text-emerald-400 text-xs font-bold tracking-widest">
            YOUR COLLECTION
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-2">
            My Wishlist
          </h1>
          <p className="text-gray-400 text-sm mt-3">
            Products you have saved for later.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-5 py-10">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <Heart size={42} className="mx-auto text-gray-300" />
            <h2 className="font-bold text-xl mt-4">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Save products you love and find them here.
            </p>
            <Link
              to="/shop"
              className="inline-block mt-5 bg-[#047857] text-white px-6 py-3 rounded-lg text-sm font-semibold"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">
              {items.length} saved products
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {items.map(item => {
                const product = item.product

                if (!product) return null

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                  >
                    <Link to={`/products/${product.slug}`}>
                      <div className="aspect-square bg-[#FAFAF9]">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            No Image
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-3 sm:p-4">
                      <Link to={`/products/${product.slug}`}>
                        <h3 className="font-semibold text-sm text-[#171717] line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-[#047857] font-bold mt-2">
                        ৳ {Number(product.price).toLocaleString('en-BD')}
                      </p>

                      <div className="flex gap-2 mt-4">
                        <Link
                          to={`/products/${product.slug}`}
                          className="flex-1 text-center bg-[#047857] hover:bg-[#065f46] text-white rounded-lg py-2 text-xs font-semibold"
                        >
                          View Product
                        </Link>

                        <button
                          onClick={() => handleRemove(product.id)}
                          disabled={removingId === product.id}
                          className="px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

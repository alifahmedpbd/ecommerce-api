
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getWishlist, toggleWishlist } from '../../services/wishlistService'

export default function ProductCard({ product }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsWishlisted(false)
      return
    }

    const checkWishlist = async () => {
      try {
        const data = await getWishlist()

        const items = Array.isArray(data)
          ? data
          : data?.results || data?.data || []

        setIsWishlisted(
          items.some(item => item.product?.id === product.id)
        )
      } catch (error) {
        console.error('Wishlist fetch error:', error)
      }
    }

    checkWishlist()
  }, [user, product.id])

  const handleWishlist = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!user) {
      navigate('/login')
      return
    }

    if (wishlistLoading) return

    try {
      setWishlistLoading(true)

      await toggleWishlist(user.email, product.id)

      setIsWishlisted(prev => !prev)

      // Update Navbar Wishlist Count
      window.dispatchEvent(new Event('wishlistUpdated'))

    } catch (error) {
      console.error('Wishlist update error:', error)
      alert('Wishlist update failed. Please try again.')
    } finally {
      setWishlistLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition group min-w-0">

      <div className="relative">
        <Link to={`/products/${product.slug}`}>
          <div className="bg-[#FAFAF9] aspect-square overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                No Image
              </div>
            )}
          </div>
        </Link>

        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishlistLoading}
          aria-label="Toggle wishlist"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center hover:scale-110 transition disabled:opacity-50"
        >
          <Heart
            size={19}
            className={
              isWishlisted
                ? 'fill-red-500 text-red-500'
                : 'text-gray-600'
            }
          />
        </button>
      </div>

      <div className="p-3 sm:p-4">

        {product.category_name && (
          <p className="text-[10px] sm:text-xs text-[#047857] mb-1">
            {product.category_name}
          </p>
        )}

        <Link to={`/products/${product.slug}`}>
          <h3 className="text-xs sm:text-sm font-semibold text-[#171717] line-clamp-2 min-h-9">
            {product.name}
          </h3>
        </Link>

        <p className="text-sm sm:text-base font-bold text-[#047857] mt-2">
          ৳ {Number(product.price).toLocaleString('en-BD')}
        </p>

        <Link
          to={`/products/${product.slug}`}
          className="mt-3 flex justify-center items-center gap-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-lg py-2 text-xs sm:text-sm font-medium transition"
        >
          <ShoppingCart size={15} />
          View Product
        </Link>

      </div>
    </div>
  )
}

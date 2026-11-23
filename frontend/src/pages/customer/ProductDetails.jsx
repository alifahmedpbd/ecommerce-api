
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ShoppingCart,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle,
  Star,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

import { getProductDetails } from '../../services/productService'
import { addToCart } from '../../services/cartService'
import {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
} from '../../services/reviewService'
import { useAuth } from '../../context/AuthContext'

export default function ProductDetails() {
  const { slug } = useParams()
  const { user, loading: authLoading } = useAuth()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)

  const [adding, setAdding] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [editingId, setEditingId] = useState(null)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')

  const loadProduct = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getProductDetails(slug)
      setProduct(data)
    } catch (err) {
      console.error('Product details error:', err)
      setError('Product could not be found.')
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      setReviewsLoading(true)
      const data = await getProductReviews(slug)
      setReviews(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      console.error('Reviews error:', err)
      setReviewError('Could not load reviews.')
    } finally {
      setReviewsLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
    loadReviews()
  }, [slug])

  const handleAddToCart = async () => {
    if (!product) return

    try {
      setAdding(true)
      setError('')
      setMessage('')

      await addToCart(product.id)
      setMessage('Product successfully added to your cart!')
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Could not add this product to cart.'
      )
    } finally {
      setAdding(false)
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      setReviewError('Please login to submit a review.')
      return
    }

    if (!reviewText.trim()) {
      setReviewError('Please write your review.')
      return
    }

    try {
      setSubmitting(true)
      setReviewError('')
      setReviewMessage('')

      if (editingId) {
        await updateReview(editingId, {
          rating,
          review: reviewText,
        })
        setReviewMessage('Review updated successfully!')
      } else {
        await addReview({
          product_id: product.id,
          email: user.email,
          rating,
          review: reviewText,
        })
        setReviewMessage('Review submitted successfully!')
      }

      setReviewText('')
      setRating(5)
      setEditingId(null)

      await loadReviews()
    } catch (err) {
      setReviewError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Could not submit review. You may have already reviewed this product.'
      )
    } finally {
      setSubmitting(false)
    }
  }

const handleEdit = (review) => {
  setEditingId(review.id)
  setRating(Number(review.rating))
  setReviewText(review.review || '')
  setReviewError('')
  setReviewMessage('')

  document.getElementById('review-form')?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })
}

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      setReviewError('')
      await deleteReview(id)
      setReviewMessage('Review deleted successfully!')
      if (editingId === id) {
        setEditingId(null)
        setReviewText('')
        setRating(5)
      }
      await loadReviews()
    } catch (err) {
      setReviewError(
        err.response?.data?.message || 'Could not delete review.'
      )
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setReviewText('')
    setRating(5)
    setReviewError('')
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Loading product...
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-5 text-center">
        <h2 className="text-2xl font-bold text-[#171717]">Product Not Found</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <Link to="/shop" className="mt-5 bg-[#047857] text-white px-6 py-3 rounded-lg">
          Back to Shop
        </Link>
      </div>
    )
  }

  const hasStockInfo = product.stock !== undefined && product.stock !== null
  const inStock = !hasStockInfo || Number(product.stock) > 0

  const averageRating = reviews.length
    ? reviews.reduce((sum, item) => sum + Number(item.rating), 0) / reviews.length
    : 0

  return (
    <main className="bg-[#FAFAF9] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#047857] mb-6">
          <ArrowLeft size={17} />
          Back to Shop
        </Link>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 bg-white rounded-2xl border border-gray-100 p-4 sm:p-7 lg:p-10">

          <div className="bg-[#FAFAF9] rounded-xl overflow-hidden aspect-square flex items-center justify-center">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <p className="text-gray-400">No Image Available</p>
            )}
          </div>

          <div className="flex flex-col justify-center py-2">
            <p className="text-xs font-bold tracking-widest text-[#047857] uppercase">
              API Store Collection
            </p>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#171717] mt-3">
              {product.name}
            </h1>

            <p className="text-2xl sm:text-3xl font-bold text-[#047857] mt-5">
              ৳ {Number(product.price).toLocaleString('en-BD')}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <Star size={18} className="fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">
                ({reviews.length} reviews)
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2">
              {inStock ? (
                <>
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {hasStockInfo ? `${product.stock} items available` : 'Available'}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-red-600">Out of Stock</span>
              )}
            </div>

            <div className="border-t border-gray-100 my-6" />

            <h2 className="font-bold text-[#171717] mb-2">Product Description</h2>

            <p className="text-sm sm:text-base text-gray-600 leading-7 whitespace-pre-line">
              {product.description || 'No description available for this product.'}
            </p>

            {message && (
              <p className="mt-5 bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                {message}
              </p>
            )}

            {error && (
              <p className="mt-5 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </p>
            )}

            <button
              onClick={handleAddToCart}
              disabled={adding || !inStock}
              className="mt-7 w-full flex justify-center items-center gap-2 bg-[#047857] hover:bg-[#065f46] disabled:bg-gray-400 text-white py-3.5 rounded-lg font-semibold transition"
            >
              <ShoppingCart size={19} />
              {adding ? 'Adding to Cart...' : inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>

            <div className="grid grid-cols-3 gap-2 mt-7 pt-6 border-t border-gray-100">
              <ServiceInfo icon={<Truck />} title="Delivery" text="Fast" />
              <ServiceInfo icon={<ShieldCheck />} title="Payment" text="Secure" />
              <ServiceInfo icon={<RotateCcw />} title="Returns" text="Easy" />
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        <section className="mt-10 bg-white border border-gray-100 rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-[#047857] uppercase">
                Customer Feedback
              </p>
              <h2 className="text-2xl font-bold text-[#171717] mt-2">
                Customer Reviews
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Honest feedback from our customers
              </p>
            </div>

            <div className="bg-[#FAFAF9] rounded-xl px-5 py-3">
              <p className="text-3xl font-bold text-[#171717]">
                {averageRating.toFixed(1)} <span className="text-yellow-400">★</span>
              </p>
              <p className="text-xs text-gray-500">{reviews.length} reviews</p>
            </div>
          </div>

          {/* Review Form */}
          <div id="review-form" className="mt-8 border border-gray-100 rounded-xl p-5">
            <h3 className="font-bold text-[#171717]">
              {editingId ? 'Edit Your Review' : 'Write a Review'}
            </h3>

            {authLoading ? (
              <p className="text-sm text-gray-500 mt-3">Checking login...</p>
            ) : !user ? (
              <p className="text-sm text-gray-600 mt-3">
                Please <Link to="/login" className="text-[#047857] font-semibold">login</Link> to write a review.
              </p>
            ) : (
              <form onSubmit={handleReviewSubmit} className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>

                <div className="flex gap-2 mb-5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-label={`Rate ${value} stars`}
                      className="focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={value <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review
                </label>

                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  placeholder="Share your experience with this product..."
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-[#047857] resize-y"
                />

                {reviewError && (
                  <p className="mt-3 text-sm text-red-600">{reviewError}</p>
                )}

                {reviewMessage && (
                  <p className="mt-3 text-sm text-green-700">{reviewMessage}</p>
                )}

                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#047857] hover:bg-[#065f46] disabled:bg-gray-400 text-white px-6 py-3 rounded-lg text-sm font-semibold"
                  >
                    {submitting
                      ? 'Please wait...'
                      : editingId ? 'Update Review' : 'Submit Review'}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="border border-gray-200 px-5 py-3 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Review List */}
          <div className="mt-8">
            <h3 className="font-bold text-[#171717] text-lg mb-5">
              All Reviews ({reviews.length})
            </h3>

            {reviewsLoading ? (
              <p className="text-sm text-gray-500">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 bg-[#FAFAF9] rounded-xl">
                <Star size={32} className="mx-auto text-gray-300" />
                <p className="font-semibold text-gray-700 mt-3">No reviews yet</p>
                <p className="text-sm text-gray-500 mt-1">Be the first to review this product.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((item) => {
                  const isOwner = user && item.user?.id === user.id

                  return (
                    <article key={item.id} className="border-b border-gray-100 pb-5 last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#171717]">
                            {item.user?.username || 'Customer'}
                          </p>

                          <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= item.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'}
                              />
                            ))}
                          </div>

                          <p className="text-xs text-gray-400 mt-2">
                            {item.created
                              ? new Date(item.created).toLocaleDateString()
                              : ''}
                          </p>
                        </div>

                        {isOwner && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              title="Edit review"
                              className="p-2 text-gray-500 hover:text-[#047857] hover:bg-green-50 rounded-lg"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() => handleDelete(item.id)}
                              title="Delete review"
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 leading-7 mt-3 whitespace-pre-line">
                        {item.review}
                      </p>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function ServiceInfo({ icon, title, text }) {
  return (
    <div className="text-center">
      <div className="flex justify-center text-[#047857] mb-2">
        {icon}
      </div>
      <p className="text-xs font-semibold text-[#171717]">{title}</p>
      <p className="text-[10px] text-gray-500 mt-1">{text}</p>
    </div>
  )
}

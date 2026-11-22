
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ShoppingCart,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle,
} from 'lucide-react'

import { getProductDetails } from '../../services/productService'
import { addToCart } from '../../services/cartService'

export default function ProductDetails() {
  const { slug } = useParams()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)
        setError('')
        setMessage('')

        const data = await getProductDetails(slug)
        setProduct(data)
      } catch (err) {
        console.error('Product details error:', err)
        setError('Product could not be found.')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
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
      console.error('Add to cart error:', err)
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Could not add this product to cart. Please try again.'
      )
    } finally {
      setAdding(false)
    }
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
        <Link
          to="/shop"
          className="mt-5 bg-[#047857] text-white px-6 py-3 rounded-lg"
        >
          Back to Shop
        </Link>
      </div>
    )
  }

  const hasStockInfo = product.stock !== undefined && product.stock !== null
  const inStock = !hasStockInfo || Number(product.stock) > 0

  return (
    <main className="bg-[#FAFAF9] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#047857] mb-6"
        >
          <ArrowLeft size={17} />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 bg-white rounded-2xl border border-gray-100 p-4 sm:p-7 lg:p-10">

          {/* Product Image */}
          <div className="bg-[#FAFAF9] rounded-xl overflow-hidden aspect-square flex items-center justify-center">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <p className="text-gray-400">No Image Available</p>
            )}
          </div>

          {/* Product Information */}
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

            <div className="mt-5 flex items-center gap-2">
              {inStock ? (
                <>
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {hasStockInfo
                      ? `${product.stock} items available`
                      : 'Available'}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-red-600">
                  Out of Stock
                </span>
              )}
            </div>

            <div className="border-t border-gray-100 my-6" />

            <h2 className="font-bold text-[#171717] mb-2">
              Product Description
            </h2>

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
              {adding
                ? 'Adding to Cart...'
                : inStock
                  ? 'Add to Cart'
                  : 'Out of Stock'}
            </button>

            <div className="grid grid-cols-3 gap-2 mt-7 pt-6 border-t border-gray-100">
              <ServiceInfo icon={<Truck />} title="Delivery" text="Fast" />
              <ServiceInfo icon={<ShieldCheck />} title="Payment" text="Secure" />
              <ServiceInfo icon={<RotateCcw />} title="Returns" text="Easy" />
            </div>
          </div>
        </div>
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

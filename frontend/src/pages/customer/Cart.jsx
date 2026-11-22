
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
} from 'lucide-react'

import {
  getCart,
  updateCartItem,
  removeCartItem,
  checkoutCart,
} from '../../services/cartService'

export default function Cart() {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)

  const loadCart = async () => {
    try {
      setLoading(true)
      const data = await getCart()
      setCart(data)
      setError('')
    } catch (err) {
      console.error(err)
      setCart(null)
      setError(
        err.response?.data?.error || 'Unable to load your cart.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  const handleQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return

    try {
      setUpdating(item.id)
      setError('')
      await updateCartItem(item.id, newQuantity)
      await loadCart()
    } catch (err) {
      console.error(err)
      setError('Could not update product quantity.')
    } finally {
      setUpdating(null)
    }
  }

  const handleRemove = async (itemId) => {
    try {
      setUpdating(itemId)
      setError('')
      await removeCartItem(itemId)
      await loadCart()
    } catch (err) {
      console.error(err)
      setError('Could not remove this product.')
    } finally {
      setUpdating(null)
    }
  }

  const handleCheckout = async (e) => {
    e.preventDefault()

    try {
      setCheckingOut(true)
      setError('')
      setMessage('')

      const data = await checkoutCart(email)

      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        setError('Checkout URL was not returned by the server.')
      }
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Checkout failed. Please try again.'
      )
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Loading your cart...
      </div>
    )
  }

  const items = cart?.cartitems || []
  const total = Number(cart?.cart_total || 0)

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-8 sm:py-12">

        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-[#047857]">
            YOUR SHOPPING BAG
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#171717] mt-2">
            Shopping Cart
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Review your items before checkout.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-5 text-sm">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-14 text-center">
            <ShoppingBag size={55} className="mx-auto text-gray-300" />
            <h2 className="text-xl font-bold mt-5">
              Your cart is empty
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Looks like you haven't added anything yet.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 mt-6 bg-[#047857] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#065f46]"
            >
              <ShoppingCart size={17} />
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* Cart Items */}
            <section className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="font-bold text-[#171717]">
                    Cart Items
                  </h2>
                  <span className="text-xs text-gray-500">
                    {items.length} items
                  </span>
                </div>

                <div className="space-y-5">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="flex gap-3 sm:gap-5 border-b border-gray-100 pb-5 last:border-0 last:pb-0"
                    >
                      <div className="w-20 h-20 sm:w-28 sm:h-28 bg-[#FAFAF9] rounded-lg overflow-hidden shrink-0">
                        {item.product?.image && (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product?.slug}`}
                          className="font-semibold text-sm sm:text-base text-[#171717] hover:text-[#047857] line-clamp-2"
                        >
                          {item.product?.name}
                        </Link>

                        <p className="text-sm text-[#047857] font-bold mt-2">
                          ৳ {Number(item.product?.price || 0).toLocaleString('en-BD')}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button
                              onClick={() => handleQuantity(item, item.quantity - 1)}
                              disabled={updating === item.id || item.quantity <= 1}
                              className="p-2 disabled:opacity-40"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="text-sm font-semibold min-w-8 text-center">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => handleQuantity(item, item.quantity + 1)}
                              disabled={updating === item.id}
                              className="p-2 disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={updating === item.id}
                            className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs font-medium disabled:opacity-40"
                          >
                            <Trash2 size={15} />
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="hidden sm:block text-right shrink-0">
                        <p className="text-xs text-gray-400">Subtotal</p>
                        <p className="font-bold text-[#171717] mt-2">
                          ৳ {Number(item.sub_total || 0).toLocaleString('en-BD')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-[#047857] text-sm font-semibold"
              >
                <ArrowLeft size={17} />
                Continue Shopping
              </Link>
            </section>

            {/* Order Summary */}
            <aside className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 h-fit">
              <h2 className="text-lg font-bold text-[#171717]">
                Order Summary
              </h2>

              <div className="flex justify-between mt-6 text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">
                  ৳ {total.toLocaleString('en-BD')}
                </span>
              </div>

              <div className="flex justify-between mt-4 text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-[#047857] font-semibold">
                  Calculated at checkout
                </span>
              </div>

              <div className="border-t border-gray-100 my-5" />

              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold text-[#047857]">
                  ৳ {total.toLocaleString('en-BD')}
                </span>
              </div>

              <form onSubmit={handleCheckout} className="mt-6">
                <label className="block text-sm font-semibold mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm outline-none focus:border-[#047857]"
                />

                <button
                  type="submit"
                  disabled={checkingOut}
                  className="w-full mt-4 bg-[#047857] hover:bg-[#065f46] disabled:bg-gray-400 text-white rounded-lg py-3.5 font-semibold text-sm flex justify-center items-center gap-2 transition"
                >
                  {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
                  {!checkingOut && <ArrowRight size={17} />}
                </button>
              </form>

              <p className="text-[11px] text-gray-400 text-center mt-4">
                Secure checkout powered by Stripe.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

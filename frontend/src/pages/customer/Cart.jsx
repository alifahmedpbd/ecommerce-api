
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  UserRound,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CreditCard,
  Truck,
  Check,
  Package,
  LockKeyhole,
} from "lucide-react";

import {
  getCart,
  updateCartItem,
  removeCartItem,
  checkoutCart,
} from "../../services/cartService";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setCart(data);
      setError("");
    } catch (err) {
      console.error(err);
      setCart(null);
      setError(err.response?.data?.error || "Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdating(item.id);
      setError("");
      await updateCartItem(item.id, newQuantity);
      await loadCart();
    } catch (err) {
      console.error(err);
      setError("Could not update product quantity.");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      setUpdating(itemId);
      setError("");
      await removeCartItem(itemId);
      await loadCart();
    } catch (err) {
      console.error(err);
      setError("Could not remove this product.");
    } finally {
      setUpdating(null);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      setError("Please complete all required information.");
      return;
    }

    try {
      setCheckingOut(true);
      setError("");
      setMessage("");

      const data = await checkoutCart({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        payment_method: paymentMethod,
      });

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      if (data.order_id) {
        setMessage(
          `Your order has been placed successfully! Order ID: ${data.order_id}`
        );

        setName("");
        setEmail("");
        setPhone("");
        setAddress("");
        setPaymentMethod("cod");

        await loadCart();
      } else {
        setError(data.message || "Unable to complete checkout.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Checkout failed. Please try again."
      );
    } finally {
      setCheckingOut(false);
    }
  };

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("en-BD");

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-[#FAFAF9] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#047857] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 mt-4">
          Preparing your checkout...
        </p>
      </div>
    );
  }

  const items = cart?.cartitems || [];
  const total = Number(cart?.cart_total || 0);
  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const inputClass =
    "w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-sm text-[#171717] placeholder:text-gray-400 outline-none transition focus:border-[#047857] focus:ring-4 focus:ring-emerald-50";

  const selectedPayment =
    "border-[#047857] bg-emerald-50/50 ring-1 ring-[#047857]";

  return (
    <main className="min-h-screen bg-[#FAFAF9] text-[#171717]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-7 sm:py-10">

        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#047857]">
              API STORE / CHECKOUT
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
              Complete Your Order
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Enter your details and get your order delivered.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#047857] hover:text-[#065f46]"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </div>

        {/* Checkout Progress */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#047857] text-white flex items-center justify-center shadow-md">
                <Check size={19} />
              </div>
              <span className="text-xs font-semibold text-[#047857]">
                Cart
              </span>
            </div>

            <div className="h-[2px] bg-[#047857] flex-1 mx-3 mb-6" />

            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#047857] text-white flex items-center justify-center shadow-md">
                <ShoppingBag size={18} />
              </div>
              <span className="text-xs font-bold text-[#171717]">
                Checkout
              </span>
            </div>

            <div className="h-[2px] bg-gray-200 flex-1 mx-3 mb-6" />

            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">
                <CreditCard size={18} />
              </div>
              <span className="text-xs text-gray-500">
                Payment
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="max-w-7xl mx-auto mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="max-w-7xl mx-auto mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-[#047857]">
            {message}
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 sm:p-16 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <ShoppingBag size={34} className="text-[#047857]" />
            </div>
            <h2 className="text-2xl font-bold mt-5">
              Your Cart Is Empty
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Add some products before proceeding to checkout.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 mt-6 bg-[#047857] hover:bg-[#065f46] text-white px-7 py-3 rounded-xl text-sm font-semibold transition"
            >
              <ShoppingCart size={17} />
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-7 items-start">

            {/* LEFT: Checkout Form */}
            <section className="xl:col-span-8">
              <form
                id="checkout-form"
                onSubmit={handleCheckout}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Form Header */}
                <div className="px-5 sm:px-7 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Package size={25} className="text-[#047857]" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">
                        Checkout
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Complete your order with ease
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#047857]">
                    <ShieldCheck size={22} />
                    <div>
                      <p className="font-semibold">Secure Checkout</p>
                      <p className="text-gray-500">Your information is protected</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-7 space-y-7">

                  {/* Contact Information */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-7 h-7 rounded-full bg-[#047857] text-white text-sm font-bold flex items-center justify-center">
                        1
                      </span>
                      <h3 className="font-bold text-lg">
                        Contact Information
                      </h3>
                    </div>

                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className={`${inputClass} pl-12`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-1">
                      We'll send your order confirmation and tracking details here.
                    </p>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-7 h-7 rounded-full bg-[#047857] text-white text-sm font-bold flex items-center justify-center">
                        2
                      </span>
                      <h3 className="font-bold text-lg">
                        Shipping Address
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <UserRound
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full Name"
                          className={`${inputClass} pl-12`}
                        />
                      </div>

                      <div className="relative">
                        <Phone
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Phone Number"
                          className={`${inputClass} pl-12`}
                        />
                      </div>

                      <div className="relative sm:col-span-2">
                        <MapPin
                          size={18}
                          className="absolute left-4 top-4 text-gray-500"
                        />
                        <textarea
                          required
                          rows={3}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Complete Address (House No, Road, Area, City, Postal Code)"
                          className={`${inputClass} pl-12 resize-none`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-7 h-7 rounded-full bg-[#047857] text-white text-sm font-bold flex items-center justify-center">
                        3
                      </span>
                      <h3 className="font-bold text-lg">
                        Payment Method
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("stripe")}
                        className={`relative border rounded-xl p-4 text-left transition ${
                          paymentMethod === "stripe"
                            ? selectedPayment
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <CreditCard
                            size={27}
                            className="text-[#047857]"
                          />
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            paymentMethod === "stripe"
                              ? "border-[#047857]"
                              : "border-gray-300"
                          }`}>
                            {paymentMethod === "stripe" && (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#047857]" />
                            )}
                          </span>
                        </div>
                        <p className="font-bold text-sm mt-3">
                          Credit / Debit Card
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Secure payment with Stripe
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cod")}
                        className={`relative border rounded-xl p-4 text-left transition ${
                          paymentMethod === "cod"
                            ? selectedPayment
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Truck
                            size={27}
                            className="text-[#047857]"
                          />
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            paymentMethod === "cod"
                              ? "border-[#047857]"
                              : "border-gray-300"
                          }`}>
                            {paymentMethod === "cod" && (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#047857]" />
                            )}
                          </span>
                        </div>
                        <p className="font-bold text-sm mt-3">
                          Cash on Delivery
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Pay when you receive your order
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Place Order */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={checkingOut}
                      className="w-full bg-[#047857] hover:bg-[#065f46] disabled:bg-gray-400 text-white rounded-xl py-4 font-bold text-base flex items-center justify-center gap-3 transition shadow-lg shadow-emerald-900/10"
                    >
                      <LockKeyhole size={18} />
                      {checkingOut
                        ? "Processing Your Order..."
                        : "Place Order"}
                      {!checkingOut && <ArrowRight size={19} />}
                    </button>

                    <p className="text-[11px] text-gray-400 text-center mt-3">
                      By placing this order, you agree to our Terms & Conditions.
                    </p>
                  </div>
                </div>
              </form>
            </section>

            {/* RIGHT: Order Summary */}
            <aside className="xl:col-span-4 xl:sticky xl:top-6 space-y-4">

              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                {/* Summary Header */}
                <div className="bg-[#047857] text-white px-5 py-6 relative overflow-hidden">
                  <div className="absolute -right-8 -top-12 w-40 h-40 rounded-full bg-white/10" />
                  <div className="absolute right-16 -bottom-16 w-32 h-32 rounded-full bg-black/10" />

                  <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center">
                      <ShoppingBag size={27} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        Order Summary
                      </h2>
                      <p className="text-xs text-emerald-100 mt-1">
                        Review your order details
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cart Products */}
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm">Your Products</h3>
                    <span className="text-xs text-gray-400">
                      {itemCount} items
                    </span>
                  </div>

                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 pb-4 border-b border-gray-100 last:border-0"
                      >
                        <div className="w-16 h-16 rounded-xl bg-[#FAFAF9] overflow-hidden shrink-0">
                          {item.product?.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={22} className="text-gray-300" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.product?.slug}`}
                            className="font-semibold text-sm line-clamp-2 hover:text-[#047857]"
                          >
                            {item.product?.name}
                          </Link>

                          <p className="text-xs text-gray-500 mt-1">
                            Qty: {item.quantity}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantity(item, item.quantity - 1)
                              }
                              disabled={updating === item.id || item.quantity <= 1}
                              className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                            >
                              <Minus size={11} />
                            </button>

                            <span className="text-xs font-semibold">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleQuantity(item, item.quantity + 1)
                              }
                              disabled={updating === item.id}
                              className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                            >
                              <Plus size={11} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemove(item.id)}
                              disabled={updating === item.id}
                              className="ml-auto text-gray-400 hover:text-red-500 transition"
                              aria-label="Remove product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <p className="font-bold text-sm whitespace-nowrap">
                          ৳ {formatPrice(item.sub_total)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Price Details */}
                  <div className="space-y-4 mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-semibold">
                        ৳ {formatPrice(total)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <Truck size={16} />
                        Shipping
                      </span>
                      <span className="text-[#047857] font-semibold text-xs">
                        Calculated at checkout
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 my-5" />

                  <div className="bg-emerald-50 rounded-xl p-4 flex justify-between items-center">
                    <span className="font-bold">Total Amount</span>
                    <span className="text-xl sm:text-2xl font-bold text-[#047857]">
                      ৳ {formatPrice(total)}
                    </span>
                  </div>

                  {/* Secure Payment */}
                  <div className="mt-5 bg-[#FAFAF9] rounded-xl p-4 flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <ShieldCheck size={22} className="text-[#047857]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Secure Checkout</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Your information is safe with API Store.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <Truck size={21} className="text-[#047857]" />
                  <p className="text-xs font-bold mt-2">Safe Delivery</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    To your doorstep
                  </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <ShieldCheck size={21} className="text-[#047857]" />
                  <p className="text-xs font-bold mt-2">Secure Payment</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Protected checkout
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Bottom Trust Section */}
        {items.length > 0 && (
          <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
              <div className="flex items-center justify-center gap-3">
                <ShieldCheck size={23} className="text-[#047857]" />
                <div className="text-left">
                  <p className="text-sm font-bold">Secure Shopping</p>
                  <p className="text-xs text-gray-400">Protected information</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Package size={23} className="text-[#047857]" />
                <div className="text-left">
                  <p className="text-sm font-bold">Order Tracking</p>
                  <p className="text-xs text-gray-400">Track your delivery</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Truck size={23} className="text-[#047857]" />
                <div className="text-left">
                  <p className="text-sm font-bold">Reliable Delivery</p>
                  <p className="text-xs text-gray-400">Delivered with care</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

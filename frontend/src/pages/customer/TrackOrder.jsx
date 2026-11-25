
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PackageSearch,
  Search,
  LoaderCircle,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  MapPin,
  CalendarDays,
} from "lucide-react";
import api from "../../services/api";

export default function TrackOrder() {
  const [searchParams] = useSearchParams();

  const [trackingId, setTrackingId] = useState(
    searchParams.get("tracking_id") || ""
  );
  const [phoneLast4, setPhoneLast4] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrackOrder = async (e) => {
    e.preventDefault();

    setError("");
    setOrder(null);

    const id = trackingId.trim().toUpperCase();
    const phone = phoneLast4.replace(/\D/g, "");

    if (!id) {
      setError("Please enter your Tracking ID.");
      return;
    }

    if (phone.length !== 4) {
      setError("Please enter the last 4 digits of your phone number.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        `/track-order/${encodeURIComponent(id)}/`,
        { phone_last4: phone }
      );

      setOrder(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Order not found. Please check your Tracking ID and phone number."
      );
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { key: "pending", label: "Order Placed", icon: Package },
    { key: "processing", label: "Processing", icon: PackageSearch },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  const statusOrder = ["pending", "processing", "shipped", "delivered"];
  const currentIndex = statusOrder.indexOf(order?.status);

  const isCancelled = ["cancelled", "failed"].includes(order?.status);

  return (
    <div className="min-h-screen bg-[#FAFAF9] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-9">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <PackageSearch size={32} />
          </div>

          <p className="text-sm font-semibold tracking-wider text-emerald-700">
            ORDER TRACKING
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            Track Your Order
          </h1>
          <p className="text-gray-500 mt-3">
            Enter your Tracking ID and the last 4 digits of your phone number.
          </p>
        </div>

        <form
          onSubmit={handleTrackOrder}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Tracking ID
              </label>
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                placeholder="Example: TRK-270520025994"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Last 4 Digits of Phone Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={phoneLast4}
                onChange={(e) =>
                  setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="1234"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-700"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#047857] hover:bg-emerald-800 text-white rounded-xl py-3 font-semibold disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle size={19} className="animate-spin" />
              ) : (
                <Search size={19} />
              )}
              {loading ? "Searching..." : "Track Order"}
            </button>
          </div>
        </form>

        {order && (
          <div className="mt-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            <div className="flex flex-wrap justify-between items-start gap-3 border-b border-gray-100 pb-5">
              <div>
                <p className="text-sm text-gray-500">Tracking ID</p>
                <h2 className="text-xl font-bold mt-1 break-all">
                  {order.tracking_id}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Order #{order.order_id}
                </p>
              </div>

              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${
                  isCancelled
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {order.status}
              </span>
            </div>

            {isCancelled ? (
              <div className="my-6 flex items-center gap-3 bg-red-50 text-red-700 rounded-xl p-4">
                <XCircle size={24} />
                <div>
                  <p className="font-semibold">Order {order.status}</p>
                  <p className="text-sm">
                    This order is no longer being processed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8">
                <h3 className="font-bold mb-7">Order Progress</h3>

                <div className="space-y-6">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const completed = currentIndex >= index;
                    const active = currentIndex === index;

                    return (
                      <div key={step.key} className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            completed
                              ? "bg-emerald-700 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <Icon size={19} />
                        </div>

                        <div>
                          <p
                            className={`font-semibold ${
                              completed ? "text-gray-900" : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          {active && (
                            <p className="text-xs text-emerald-700 mt-1">
                              Current status
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-5 grid sm:grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Customer Name</p>
                <p className="font-semibold">{order.customer_name}</p>
              </div>

              <div>
                <p className="text-gray-400 mb-1">Phone Number</p>
                <p className="font-semibold">{order.customer_phone}</p>
              </div>

              <div>
                <p className="text-gray-400 mb-1 flex items-center gap-1">
                  <MapPin size={14} /> Shipping Address
                </p>
                <p className="font-medium whitespace-pre-line">
                  {order.shipping_address}
                </p>
              </div>

              <div>
                <p className="text-gray-400 mb-1">Payment Method</p>
                <p className="font-semibold">
                  {order.payment_method === "stripe"
                    ? "Online Payment"
                    : "Cash on Delivery"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 mb-1">Total Amount</p>
                <p className="font-bold text-lg text-emerald-700">
                  {order.currency?.toUpperCase()} {order.amount}
                </p>
              </div>

              <div>
                <p className="text-gray-400 mb-1 flex items-center gap-1">
                  <CalendarDays size={14} /> Order Date
                </p>
                <p className="font-semibold">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleString()
                    : "Not available"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

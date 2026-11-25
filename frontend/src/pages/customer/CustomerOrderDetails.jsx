
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  UserRound,
  Phone,
  Mail,
  CreditCard,
  Truck,
  LoaderCircle,
} from "lucide-react";
import api from "../../services/api";

const statusSteps = [
  "pending",
  "processing",
  "shipped",
  "delivered",
];

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString();
};

const CustomerOrderDetails = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/orders/${id}/`);
        setOrder(response.data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          "Unable to load order details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderCircle className="animate-spin text-emerald-700" size={32} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm max-w-md w-full">
          <Package size={40} className="mx-auto text-stone-400 mb-4" />
          <h2 className="text-xl font-bold text-neutral-900">
            Order Not Found
          </h2>
          <p className="text-stone-500 mt-2">
            {error || "This order could not be found."}
          </p>
          <Link
            to="/dashboard"
            className="inline-block mt-6 bg-emerald-700 text-white px-6 py-3 rounded-xl"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = statusSteps.indexOf(order.status);

  const isCancelled = ["cancelled", "failed"].includes(order.status);

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              Order Details
            </h1>
            <p className="text-stone-500 mt-1">
              Order #{order.id}
            </p>
          </div>

          <span className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 font-semibold capitalize w-fit">
            {order.status}
          </span>
        </div>

        {/* Order Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 mb-6">
          <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Truck size={20} className="text-emerald-700" />
            Order Progress
          </h2>

          {isCancelled ? (
            <p className="text-red-600 font-semibold capitalize">
              Order {order.status}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {statusSteps.map((step, index) => (
                <div key={step} className="text-center">
                  <div
                    className={`h-2 rounded-full mb-3 ${
                      index <= currentStep
                        ? "bg-emerald-600"
                        : "bg-stone-200"
                    }`}
                  />
                  <p className={`text-xs sm:text-sm capitalize ${
                    index <= currentStep
                      ? "text-emerald-700 font-semibold"
                      : "text-stone-400"
                  }`}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Customer Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
            <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
              <UserRound size={20} className="text-emerald-700" />
              Customer Information
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <UserRound size={17} className="text-stone-400 shrink-0" />
                <div>
                  <p className="text-stone-400">Name</p>
                  <p className="font-medium">{order.customer_name || "N/A"}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail size={17} className="text-stone-400 shrink-0" />
                <div>
                  <p className="text-stone-400">Email</p>
                  <p className="font-medium break-all">{order.customer_email}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone size={17} className="text-stone-400 shrink-0" />
                <div>
                  <p className="text-stone-400">Phone</p>
                  <p className="font-medium">{order.customer_phone || "N/A"}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin size={17} className="text-stone-400 shrink-0" />
                <div>
                  <p className="text-stone-400">Shipping Address</p>
                  <p className="font-medium whitespace-pre-line">
                    {order.shipping_address || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
            <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
              <CreditCard size={20} className="text-emerald-700" />
              Payment Information
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-stone-400">Payment Method</p>
                <p className="font-medium uppercase">
                  {order.payment_method}
                </p>
              </div>

              <div>
                <p className="text-stone-400">Total Amount</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {order.currency?.toUpperCase()} {order.amount}
                </p>
              </div>

              <div>
                <p className="text-stone-400">Order Date</p>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>

              <div>
                <p className="text-stone-400">Tracking ID</p>
                <p className="font-semibold text-emerald-700 break-all">
                  {order.tracking_id || "Not available"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Products */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
            <Package size={20} className="text-emerald-700" />
            Ordered Products
          </h2>

          <div className="space-y-4">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 border-b border-stone-100 pb-4 last:border-0 last:pb-0"
              >
                {item.product?.image ? (
                  <img
                    src={
                      item.product.image.startsWith("http")
                        ? item.product.image
                        : `http://127.0.0.1:8000${item.product.image}`
                    }
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-xl bg-stone-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-stone-100 flex items-center justify-center">
                    <Package className="text-stone-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900">
                    {item.product?.name || "Product"}
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-sm font-semibold text-emerald-700 mt-1">
                    {order.currency?.toUpperCase()} {item.product?.price}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-200 mt-5 pt-5 flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-emerald-700">
              {order.currency?.toUpperCase()} {order.amount}
            </span>
          </div>
        </div>

        {order.tracking_id && (
          <div className="text-center mt-6">
            <Link
              to="/track-order"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl font-semibold"
            >
              <Truck size={18} />
              Track This Order
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerOrderDetails;

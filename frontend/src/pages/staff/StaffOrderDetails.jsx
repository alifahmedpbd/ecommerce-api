
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, UserRound, Save } from "lucide-react";
import api from "../../services/api";

export default function StaffOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/staff/orders/${id}/`);
        setOrder(response.data);
        setNewStatus(response.data.status);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          "Unable to load order details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const saveChanges = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.patch(`/staff/orders/${id}/status/`, {
        status: newStatus,
      });

      setOrder((prev) => ({ ...prev, status: newStatus }));
      setMessage("Order status updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Unable to update order."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="p-10 text-center text-red-600">
        {error || "Order not found."}
      </div>
    );
  }

  const formatMoney = (value) =>
    `${order.currency?.toUpperCase() || ""} ${Number(value || 0).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-[#FAFAF9] p-5 lg:p-8">
      <div className="max-w-7xl mx-auto">

        <button
          onClick={() => navigate("/staff")}
          className="flex items-center gap-2 text-gray-600 hover:text-[#047857] mb-6"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </button>

        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#171717]">
              Order #{order.id}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-semibold">
            {order.status}
          </span>
        </div>

        {message && (
          <p className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mb-4 p-3 rounded-lg bg-red-50 text-red-600">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <div className="lg:col-span-2 space-y-5">

            <section className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#171717] text-white p-4 font-semibold flex items-center gap-2">
                <UserRound size={18} />
                Customer Information
              </div>

              <div className="p-5">
                <p className="text-sm text-gray-500">Customer Email</p>
                <p className="font-medium mt-1">
                  {order.customer_email}
                </p>

                <div className="border-t mt-5 pt-4">
                  <p className="text-sm text-gray-500">
                    Stripe Checkout ID
                  </p>
                  <p className="text-sm break-all mt-1">
                    {order.stripe_checkout_id}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#047857] text-white p-4 font-semibold flex items-center gap-2">
                <Package size={18} />
                Ordered Products
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4">Product</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Qty</th>
                      <th className="p-4">Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-4 font-medium">
                          {item.product?.name}
                        </td>
                        <td className="p-4">
                          {formatMoney(item.product?.price)}
                        </td>
                        <td className="p-4">{item.quantity}</td>
                        <td className="p-4 font-semibold">
                          {formatMoney(
                            Number(item.product?.price || 0) *
                            item.quantity
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>

          <aside>
            <section className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#047857] text-white p-4 font-semibold">
                Order Summary
              </div>

              <div className="p-5 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order Total</span>
                  <strong>{formatMoney(order.amount)}</strong>
                </div>

                <div className="border-t pt-4">
                  <label className="text-sm font-semibold block mb-2">
                    Order Status
                  </label>

                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <button
                  onClick={saveChanges}
                  disabled={saving || newStatus === order.status}
                  className="w-full bg-[#047857] text-white rounded-lg py-3 flex items-center justify-center gap-2 font-semibold hover:bg-emerald-800 disabled:opacity-50"
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </section>
          </aside>

        </div>
      </div>
    </div>
  );
}

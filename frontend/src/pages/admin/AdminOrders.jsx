
import { useEffect, useState } from "react";
import { Eye, XCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/staff/orders/");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err.response?.data || err);
      setError(
        err.response?.data?.error || "Orders load করা যায়নি।"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Update order status
  const updateStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      setError("");
      setSuccessMessage("");

      const response = await api.patch(
        `/staff/orders/${id}/status/`,
        { status }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.id === id
            ? { ...order, status: response.data.data.status }
            : order
        )
      );

      setSuccessMessage(`Order #${id} status updated successfully!`);
    } catch (err) {
      console.error(err.response?.data || err);
      setError(
        err.response?.data?.error || "Status update failed."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Cancel pending order
  const cancelOrder = async (id) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel Order #${id}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(id);
      setError("");
      setSuccessMessage("");

      const response = await api.patch(
        `/staff/orders/${id}/status/`,
        { status: "cancelled" }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.id === id
            ? { ...order, status: response.data.data.status }
            : order
        )
      );

      setSuccessMessage(`Order #${id} cancelled successfully!`);
    } catch (err) {
      console.error(err.response?.data || err);
      setError(
        err.response?.data?.error || "Unable to cancel order."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">
            Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage customer orders
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 bg-[#047857] text-white px-4 py-2.5 rounded-lg hover:bg-emerald-800 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
        {loading ? (
          <p className="p-6 text-center text-gray-500">
            Loading orders...
          </p>
        ) : (
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-4 text-left">Order</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Amount</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-gray-100">
                  <td className="p-4 font-semibold">
                    #{order.id}
                  </td>

                  <td className="p-4 text-gray-600">
                    {order.customer_email}
                  </td>

                  <td className="p-4">
                    {order.amount}{" "}
                    {order.currency?.toUpperCase()}
                  </td>

                  <td className="p-4">
                    <select
                      value={order.status}
                      disabled={
                        updatingId === order.id ||
                        ["cancelled", "delivered", "failed"].includes(
                          order.status
                        )
                      }
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value)
                      }
                      className="border border-gray-200 rounded-lg p-2 capitalize bg-white outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                    >
                      <option value={order.status}>
                        {order.status}
                      </option>

                      {order.status === "pending" && (
                        <option value="processing">Processing</option>
                      )}

                      {order.status === "processing" && (
                        <option value="shipped">Shipped</option>
                      )}

                      {order.status === "shipped" && (
                        <option value="delivered">Delivered</option>
                      )}
                    </select>

                    {updatingId === order.id && (
                      <p className="text-xs text-gray-400 mt-1">
                        Updating...
                      </p>
                    )}
                  </td>

                  <td className="p-4 text-gray-600">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString()
                      : "N/A"}
                  </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-[#047857] inline-flex items-center gap-1 hover:text-emerald-800"
                    >
                      <Eye size={17} />
                      View
                    </Link>

                    {order.status === "pending" && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        disabled={updatingId === order.id}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 ml-3 disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!orders.length && (
                <tr>
                  <td
                    colSpan="6"
                    className="p-6 text-center text-gray-500"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

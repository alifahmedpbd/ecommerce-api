
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const res = await api.get("/staff/orders/");
      setOrders(res.data);
    } catch (err) {
      setError("Orders load করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/staff/orders/${id}/status/`, { status });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, status } : order
        )
      );
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Status update failed."));
    }
  };

  return (
    <AdminLayout>
      <div className="mb-7">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage customer orders</p>
      </div>

      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      <div className="bg-white border rounded-xl overflow-x-auto">
        {loading ? <p className="p-6">Loading orders...</p> : (
          <table className="w-full min-w-[750px] text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-4 text-left">Order</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Amount</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-4 font-medium">#{order.id}</td>
                  <td className="p-4">{order.customer_email}</td>
                  <td className="p-4">{order.amount} {order.currency}</td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="border rounded-lg p-2 capitalize"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </td>
                  <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <Link
  to={`/admin/orders/${order.id}`}
  className="text-[#047857] inline-flex items-center gap-1"
>
  <Eye size={17} /> View
</Link>
                  </td>
                </tr>
              ))}
              {!orders.length && <tr><td colSpan="6" className="p-6 text-center text-gray-500">No orders found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

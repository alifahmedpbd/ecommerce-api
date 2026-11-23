
import { useEffect, useState } from "react";
import { Package, RefreshCw } from "lucide-react";
import api from "../../services/api";

import { useNavigate } from "react-router-dom";


export default function StaffDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/staff/orders/");
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Orders API error:", err.response?.data || err);
      setError(
        err.response?.data?.error ||
        "Unable to load orders. Check staff permissions."
      );
    } finally {
      setLoading(false);
    }
  };



const updateOrderStatus = async (orderId, newStatus) => {
  try {
    setUpdatingId(orderId);
    setSuccessMessage("");

    const response = await api.patch(
      `/staff/orders/${orderId}/status/`,
      { status: newStatus }
    );

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? { ...order, status: response.data.data.status }
          : order
      )
    );

    setSuccessMessage(`Order #${orderId} updated successfully!`);
  } catch (error) {
    console.error(error.response?.data || error);
    setError(
      error.response?.data?.error ||
      "Unable to update order status."
    );
  } finally {
    setUpdatingId(null);
  }
};


  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF9] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#171717]">
              Staff Dashboard
            </h1>
            <p className="text-gray-500 mt-2">
              Manage customer orders.
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 bg-[#047857] text-white px-4 py-2 rounded-lg hover:bg-emerald-800"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-3 rounded-lg">
              <Package className="text-emerald-700" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <h2 className="text-2xl font-bold">{orders.length}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="font-bold text-lg">Recent Orders</h2>
          </div>
          {successMessage && (
  <div className="mx-5 mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
    {successMessage}
  </div>
)}

          {loading ? (
            <p className="p-8 text-center text-gray-500">
              Loading orders...
            </p>
          ) : error ? (
            <p className="p-8 text-center text-red-600">{error}</p>
          ) : orders.length === 0 ? (
            <p className="p-8 text-center text-gray-500">
              No orders found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t">
                      <td className="p-4 font-semibold">
                        #{order.id}
                      </td>
                      <td className="p-4">
                        {order.customer_email || "N/A"}
                      </td>
                      <td className="p-4">
                        {order.amount} {order.currency}
                      </td>
                      <td className="p-4">
  <select
    value={order.status}
    disabled={updatingId === order.id}
    onChange={(e) =>
      updateOrderStatus(order.id, e.target.value)
    }
    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
  >
    <option value="pending">Pending</option>
    <option value="completed">Completed</option>
    <option value="failed">Failed</option>
  </select>

  {updatingId === order.id && (
    <span className="text-xs text-gray-500 ml-2">
      Updating...
    </span>
  )}
</td>
                      <td className="p-4">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                                            <button
  onClick={() => navigate(`/staff/orders/${order.id}`)}
  className="bg-[#171717] text-white px-4 py-2 rounded-full text-xs hover:bg-[#047857]"
>
  View
</button>

                    </tr>
                    
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

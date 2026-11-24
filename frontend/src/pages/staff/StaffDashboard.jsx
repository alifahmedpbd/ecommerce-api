
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Package,
  RefreshCw,
  LayoutDashboard,
  ShoppingBag,
  Store,
  Eye,
  XCircle,
} from "lucide-react";
import api from "../../services/api";

const menuItems = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    path: "/staff",
    end: true,
  },
];

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
      setError("");
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
    } catch (err) {
      console.error(err.response?.data || err);
      setError(
        err.response?.data?.error ||
        "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };


  const cancelOrder = async (orderId) => {
  const confirmed = window.confirm(
    `Are you sure you want to cancel Order #${orderId}?`
  );

  if (!confirmed) return;

  try {
    setUpdatingId(orderId);
    setError("");
    setSuccessMessage("");

    await api.patch(`/staff/orders/${orderId}/status/`, {
      status: "cancelled",
    });

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? { ...order, status: "cancelled" }
          : order
      )
    );

    setSuccessMessage(`Order #${orderId} cancelled successfully!`);
  } catch (err) {
    setError(
      err.response?.data?.error || "Unable to cancel order."
    );
  } finally {
    setUpdatingId(null);
  }
};


  useEffect(() => {
    fetchOrders();
  }, []);

  const getNextStatuses = (status) => {
    const transitions = {
      pending: ["processing"],
      processing: ["shipped"],
      shipped: ["delivered"],
    };

    return transitions[status] || [];
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="flex min-h-screen flex-col md:flex-row">

        {/* Sidebar */}
        <aside className="w-full md:w-60 shrink-0 bg-[#171717] text-white md:min-h-screen flex flex-col">

          <div className="px-6 py-7 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Store className="text-emerald-400" size={25} />

              <div>
                <h2 className="text-2xl font-bold">
                  API<span className="text-emerald-500">Store</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Staff Panel
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-6">
            <p className="text-[11px] uppercase tracking-widest text-gray-500 px-3 mb-3">
              Main Menu
            </p>

            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-[#047857] text-white"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={19} />
                  {item.label}
                </NavLink>
              );
            })}

            <div className="mt-2">
              <NavLink
                to="/staff"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition"
              >
                <ShoppingBag size={19} />
                Order Management
              </NavLink>
            </div>
          </nav>

          <div className="p-5 border-t border-white/10">
            <p className="text-xs text-gray-400">
              API Store Staff Panel
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">

          <div className="max-w-7xl mx-auto">

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#171717]">
                  Staff Dashboard
                </h1>
                <p className="text-gray-500 mt-2 text-sm">
                  Manage customer orders.
                </p>
              </div>

              <button
                onClick={fetchOrders}
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

            {/* Total Orders */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <Package className="text-emerald-700" size={24} />
                </div>

                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <h2 className="text-2xl font-bold text-[#171717]">
                    {orders.length}
                  </h2>
                </div>
              </div>
            </div>

            {successMessage && (
              <div className="mb-5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

              <div className="p-5 border-b flex items-center justify-between">
                <h2 className="font-bold text-lg text-[#171717]">
                  Recent Orders
                </h2>
                <span className="text-xs text-gray-500">
                  {orders.length} Orders
                </span>
              </div>

              {loading ? (
                <p className="p-8 text-center text-gray-500">
                  Loading orders...
                </p>
              ) : orders.length === 0 ? (
                <p className="p-8 text-center text-gray-500">
                  No orders found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-sm text-left">

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
                        <tr key={order.id} className="border-t border-gray-100">

                          <td className="p-4 font-semibold">
                            #{order.id}
                          </td>

                          <td className="p-4 text-gray-600">
                            {order.customer_email || "N/A"}
                          </td>

                          <td className="p-4">
                            {order.amount} {order.currency?.toUpperCase()}
                          </td>

                          <td className="p-4">
                            <select
                              value={order.status}
                              disabled={
                                updatingId === order.id ||
                                getNextStatuses(order.status).length === 0
                              }
                              onChange={(e) =>
                                updateOrderStatus(order.id, e.target.value)
                              }
                              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                            >
                              <option value={order.status}>
                                {order.status}
                              </option>

                              {getNextStatuses(order.status).map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>

                            {updatingId === order.id && (
                              <span className="text-xs text-gray-500 ml-2">
                                Updating...
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-gray-600">
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString()
                              : "N/A"}
                          </td>

                          <td className="p-4">
                            <button
                              onClick={() =>
                                navigate(`/staff/orders/${order.id}`)
                              }
                              className="inline-flex items-center gap-2 bg-[#171717] text-white px-4 py-2 rounded-lg text-xs hover:bg-[#047857] transition"
                            >
                              <Eye size={15} />
                              View
                            </button>

                              {order.status === "pending" && (
  <button
    onClick={() => cancelOrder(order.id)}
    disabled={updatingId === order.id}
    className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs hover:bg-red-100 transition ml-2 disabled:opacity-50"
  >
    <XCircle size={15} />
    Cancel
  </button>
)}

                          </td>

                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

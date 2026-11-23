
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tags,
  Star,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import api from "../../services/api";

const menuItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/admin" },
  { label: "Products", icon: Package, path: "/admin/products" },
  { label: "Categories", icon: Tags, path: "/admin/categories" },
  { label: "Orders", icon: ShoppingCart, path: "/admin/orders" },
  { label: "Staff", icon: Users, path: "/admin/staff" },
  { label: "Reviews", icon: Star, path: "/admin/reviews" },
];

const COLORS = ["#047857", "#D97706", "#DC2626"];

const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [overviewResponse, analyticsResponse] = await Promise.all([
        api.get("/dashboard/overview/"),
        api.get("/dashboard/analytics/"),
      ]);

      setOverview(overviewResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (err) {
      console.error("Admin dashboard error:", err.response?.data || err);
      setError(
        err.response?.data?.error ||
        "Unable to load dashboard. Check your admin permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = overview
    ? [
        {
          title: "Total Products",
          value: overview.total_products,
          icon: Package,
          color: "text-emerald-700",
          bg: "bg-emerald-50",
        },
        {
          title: "Total Orders",
          value: overview.total_orders,
          icon: ShoppingCart,
          color: "text-blue-700",
          bg: "bg-blue-50",
        },
        {
          title: "Total Customers",
          value: overview.total_customers,
          icon: Users,
          color: "text-violet-700",
          bg: "bg-violet-50",
        },
        {
          title: "Completed Revenue",
          value: money(overview.total_revenue),
          icon: DollarSign,
          color: "text-amber-700",
          bg: "bg-amber-50",
          prefix: "$",
        },
        {
          title: "Pending Orders",
          value: overview.pending_orders,
          icon: Clock,
          color: "text-orange-700",
          bg: "bg-orange-50",
        },
        {
          title: "Low Stock Products",
          value: overview.low_stock_count,
          icon: AlertTriangle,
          color: "text-red-700",
          bg: "bg-red-50",
        },
      ]
    : [];

  const revenueData =
    analytics?.monthly_revenue?.map((item) => ({
      month: new Date(`${item.month}-01`).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      revenue: Number(item.revenue || 0),
    })) || [];

  const statusData =
    analytics?.order_status?.map((item) => ({
      name: item.status,
      value: Number(item.total || 0),
    })) || [];

  const topProducts =
    analytics?.top_products?.map((item) => ({
      name: item.product__name,
      sold: Number(item.total_sold || 0),
    })) || [];

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[#171717] text-white">
          <div className="px-6 py-7 border-b border-white/10">
            <h2 className="text-2xl font-bold">
              API<span className="text-emerald-500">Store</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">Administration</p>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-gray-500 px-3 mb-3">
              Main Menu
            </p>

            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === 0;

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-[#047857] text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-5 border-t border-white/10">
            <p className="text-xs text-gray-400">
              API Store Admin Panel
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">

          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#171717]">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Monitor and manage your ecommerce store.
              </p>
            </div>

            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#047857] px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && !overview ? (
            <div className="rounded-xl bg-white p-12 text-center text-gray-500 shadow-sm">
              Loading dashboard...
            </div>
          ) : overview ? (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-7">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.title}
                      className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">
                            {stat.title}
                          </p>
                          <h2 className="mt-2 text-2xl font-bold text-[#171717]">
                            {stat.prefix || ""}
                            {stat.value}
                          </h2>
                        </div>

                        <div className={`rounded-xl p-3 ${stat.bg} ${stat.color}`}>
                          <Icon size={23} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-7">

                <section className="xl:col-span-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="text-[#047857]" size={20} />
                    <h2 className="font-bold text-[#171717]">
                      Monthly Revenue
                    </h2>
                  </div>

                  <div className="h-72">
                    {revenueData.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#047857" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value) => `$${money(value)}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#047857"
                            strokeWidth={3}
                            fill="url(#revenueGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-gray-400">
                        No revenue data available yet.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-[#171717] mb-5">
                    Order Status
                  </h2>

                  <div className="h-56">
                    {statusData.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={85}
                            innerRadius={48}
                            paddingAngle={3}
                          >
                            {statusData.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-gray-400">
                        No order data available.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {statusData.map((item, index) => (
                      <div
                        key={item.name}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="flex items-center gap-2 capitalize text-gray-600">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          {item.name}
                        </span>
                        <strong className="text-[#171717]">{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Top products */}
              <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm mb-7">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="text-[#047857]" size={20} />
                  <h2 className="font-bold text-[#171717]">
                    Top Selling Products
                  </h2>
                </div>

                <div className="h-64">
                  {topProducts.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts} margin={{ bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          angle={-12}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="sold"
                          name="Units sold"
                          fill="#047857"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                      No completed product sales yet.
                    </div>
                  )}
                </div>
              </section>

              {/* Recent orders and low stock */}
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">

                <section className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="font-bold text-[#171717]">Recent Orders</h2>
                    <Link
                      to="/admin/orders"
                      className="text-sm font-semibold text-[#047857] hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="p-4">Order</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.recent_orders?.length ? (
                          overview.recent_orders.map((order) => (
                            <tr key={order.id} className="border-t border-gray-100">
                              <td className="p-4 font-semibold">#{order.id}</td>
                              <td className="p-4 text-gray-600">
                                {order.customer_email || "N/A"}
                              </td>
                              <td className="p-4">
                                {order.amount} {order.currency}
                              </td>
                              <td className="p-4">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                  order.status === "completed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : order.status === "failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="p-6 text-center text-gray-400">
                              No orders found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-amber-600" size={19} />
                      <h2 className="font-bold text-[#171717]">
                        Low Stock Products
                      </h2>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                      {overview.low_stock_count} items
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="p-4">Product</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.low_stock_products?.length ? (
                          overview.low_stock_products.map((product) => (
                            <tr key={product.id} className="border-t border-gray-100">
                              <td className="p-4 font-medium text-[#171717]">
                                {product.name}
                              </td>
                              <td className="p-4">{product.price}</td>
                              <td className="p-4">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  product.stock === 0
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}>
                                  {product.stock}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="p-6 text-center text-gray-400">
                              No low stock products.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

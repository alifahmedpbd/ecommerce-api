
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Star,
  UserRound,
  LogOut,
  LoaderCircle,
  Save,
  Camera,
  CalendarDays,
  Hash,
  Eye,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function CustomerDashboard() {
  const { user, loading, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");

  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    profile_picture: null,
  });

  const [imagePreview, setImagePreview] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Load profile information
  useEffect(() => {
    if (!user) return;

    setProfileForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      profile_picture: null,
    });

    setImagePreview(user.profile_picture || "");
  }, [user]);

  // Fetch dashboard data
  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setDataLoading(true);
      setError("");

      const results = await Promise.allSettled([
        api.get("/orders/"),
        api.get("/wishlist/"),
        api.get("/my-reviews/"),
      ]);

      const getList = (data, key) => {
        if (Array.isArray(data)) return data;
        return data?.results || data?.[key] || [];
      };

      if (results[0].status === "fulfilled") {
        setOrders(getList(results[0].value.data, "orders"));
      }

      if (results[1].status === "fulfilled") {
        setWishlist(getList(results[1].value.data, "wishlist"));
      }

      if (results[2].status === "fulfilled") {
        setReviews(getList(results[2].value.data, "reviews"));
      }

      if (results.every((result) => result.status === "rejected")) {
        setError("Dashboard data could not be loaded. Please try again.");
      }

      setDataLoading(false);
    };

    fetchDashboardData();
  }, [user]);

  const cancelOrder = async (orderId) => {
  if (!window.confirm("Are you sure you want to cancel this order?")) {
    return;
  }

  try {
    setCancellingId(orderId);

    await api.patch(`/orders/${orderId}/cancel/`);

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: "cancelled" }
          : order
      )
    );
  } catch (error) {
    alert(
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Failed to cancel order."
    );
  } finally {
    setCancellingId(null);
  }
};

  // Update profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");
    setProfileSaving(true);

    try {
      const formData = new FormData();

      formData.append("first_name", profileForm.first_name);
      formData.append("last_name", profileForm.last_name);
      formData.append("email", profileForm.email);

      if (profileForm.profile_picture instanceof File) {
        formData.append("profile_picture", profileForm.profile_picture);
      }

      await api.patch("/profile/update/", formData);
      await refreshProfile();

      setSuccessMessage("Your profile has been updated successfully!");

      setProfileForm((prev) => ({
        ...prev,
        profile_picture: null,
      }));
    } catch (err) {
      console.error(err.response?.data || err);

      setErrorMessage(
        err.response?.data?.email?.[0] ||
          err.response?.data?.detail ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const menu = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "reviews", label: "My Reviews", icon: Star },
    { id: "profile", label: "My Profile", icon: UserRound },
  ];

  const getProductName = (item) =>
    item.product?.name ||
    item.product_name ||
    item.name ||
    "Product";

  const getAmount = (order) =>
    order.amount ?? order.total ?? order.order_total ?? 0;

  const formatDate = (date) => {
    if (!date) return "Date unavailable";
    return new Date(date).toLocaleString();
  };

  const formatStatus = (status) =>
    (status || "pending").replaceAll("_", " ");

  const statusColor = (status) => {
    const colors = {
      pending: "bg-amber-50 text-amber-700",
      processing: "bg-blue-50 text-blue-700",
      shipped: "bg-indigo-50 text-indigo-700",
      delivered: "bg-emerald-50 text-emerald-700",
      cancelled: "bg-red-50 text-red-700",
      failed: "bg-red-50 text-red-700",
    };

    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const displayName = user?.first_name || user?.username || "Customer";

  // Compact order card
  const OrderCard = ({ order }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <p className="font-bold text-lg">
            Order #{order.id}
          </p>

          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <CalendarDays size={14} />
            {formatDate(order.created_at)}
          </p>

          {order.tracking_id && (
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Hash size={14} />
              <span className="break-all">{order.tracking_id}</span>
            </p>
          )}
        </div>

        <div className="text-right">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(
              order.status
            )}`}
          >
            {formatStatus(order.status)}
          </span>

          <p className="font-bold text-lg mt-3">
            {(order.currency || "USD").toUpperCase()} {getAmount(order)}
          </p>

          <p className="text-xs text-gray-500 mt-1 uppercase">
            {order.payment_method === "stripe"
              ? "Online Payment"
              : order.payment_method === "cod"
                ? "Cash on Delivery"
                : order.payment_method || "Payment unavailable"}
          </p>
        </div>
      </div>

<div className="border-t border-gray-100 mt-5 pt-4 flex justify-between items-center gap-3">
  <p className="text-sm text-gray-500">
    {order.items?.length || 0} product(s)
  </p>

  <div className="flex items-center gap-2">
    <Link
      to={`/dashboard/orders/${order.id}`}
      className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
    >
      <Eye size={16} />
      View Details
    </Link>

    {order.status === "pending" && (
      <button
        onClick={() => cancelOrder(order.id)}
        disabled={cancellingId === order.id}
        className="inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
      >
        {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
      </button>
    )}
  </div>
</div>


    </div>
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderCircle
          className="animate-spin text-emerald-700"
          size={32}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Dashboard Header */}
        <div className="mb-8">
          <p className="text-sm text-emerald-700 font-semibold">
            CUSTOMER ACCOUNT
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            My Dashboard
          </h1>

          <p className="text-gray-500 mt-2">
            Welcome back, {displayName}!
          </p>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-7">

          {/* Sidebar */}
          <aside className="bg-white rounded-2xl border border-gray-100 p-5 h-fit">
            <div className="flex items-center gap-3 pb-5 border-b">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="font-bold truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <nav className="mt-5 space-y-2">
              {menu.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSuccessMessage("");
                      setErrorMessage("");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                      activeTab === item.id
                        ? "bg-emerald-700 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={19} />
                    {item.label}
                  </button>
                );
              })}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={19} />
                Logout
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            {dataLoading ? (
              <div className="bg-white rounded-2xl p-12 flex justify-center">
                <LoaderCircle
                  className="animate-spin text-emerald-700"
                  size={32}
                />
              </div>
            ) : (
              <>
                {error && (
                  <p className="bg-red-50 text-red-600 p-4 rounded-xl mb-5">
                    {error}
                  </p>
                )}

                {/* Overview */}
                {activeTab === "overview" && (
                  <>
                    <div className="grid sm:grid-cols-3 gap-4 mb-7">
                      {[
                        {
                          label: "Total Orders",
                          value: orders.length,
                          icon: ShoppingBag,
                        },
                        {
                          label: "Wishlist Items",
                          value: wishlist.length,
                          icon: Heart,
                        },
                        {
                          label: "My Reviews",
                          value: reviews.length,
                          icon: Star,
                        },
                      ].map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.label}
                            className="bg-white rounded-2xl border border-gray-100 p-6"
                          >
                            <Icon
                              className="text-emerald-700 mb-4"
                              size={25}
                            />

                            <p className="text-gray-500 text-sm">
                              {item.label}
                            </p>

                            <h2 className="text-3xl font-bold mt-1">
                              {item.value}
                            </h2>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                          Recent Orders
                        </h2>

                        <button
                          onClick={() => setActiveTab("orders")}
                          className="text-sm text-emerald-700 font-semibold"
                        >
                          View All
                        </button>
                      </div>

                      {orders.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
                          No orders yet.

                          <div className="mt-4">
                            <Link
                              to="/shop"
                              className="text-emerald-700 font-semibold"
                            >
                              Start Shopping
                            </Link>
                          </div>
                        </div>
                      ) : (
                        orders.slice(0, 3).map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                          />
                        ))
                      )}
                    </div>
                  </>
                )}

                {/* My Orders */}
                {activeTab === "orders" && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-bold">
                        My Orders
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        View your order history and details.
                      </p>
                    </div>

                    {orders.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                        <ShoppingBag
                          className="mx-auto text-gray-400 mb-3"
                          size={36}
                        />

                        <p className="text-gray-500">
                          You haven't placed any orders yet.
                        </p>

                        <Link
                          to="/shop"
                          className="inline-block mt-4 bg-emerald-700 text-white px-5 py-2.5 rounded-xl"
                        >
                          Start Shopping
                        </Link>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* Wishlist */}
                {activeTab === "wishlist" && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-xl font-bold mb-5">
                      My Wishlist
                    </h2>

                    {wishlist.length === 0 ? (
                      <p className="text-gray-500 py-8 text-center">
                        Your wishlist is empty.
                      </p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {wishlist.map((item) => {
                          const product = item.product || item;

                          return (
                            <div
                              key={item.id}
                              className="border rounded-xl p-4"
                            >
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.name || "Product"}
                                  className="w-full h-36 object-contain mb-3"
                                />
                              )}

                              <h3 className="font-semibold">
                                {getProductName(item)}
                              </h3>

                              <p className="text-emerald-700 font-bold mt-2">
                                {product.price ?? ""}
                              </p>

                              {product.slug && (
                                <Link
                                  to={`/products/${product.slug}`}
                                  className="text-sm text-emerald-700 mt-3 inline-block"
                                >
                                  View Product →
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews */}
                {activeTab === "reviews" && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-xl font-bold mb-5">
                      My Reviews
                    </h2>

                    {reviews.length === 0 ? (
                      <p className="text-gray-500 py-8 text-center">
                        You haven't written any reviews yet.
                      </p>
                    ) : (
                      reviews.map((review) => (
                        <div
                          key={review.id}
                          className="border-t py-4"
                        >
                          <p className="font-semibold">
                            {review.product?.name ||
                              review.product_name ||
                              "Product Review"}
                          </p>

                          <p className="text-amber-500 mt-1">
                            {"★".repeat(
                              Math.min(5, Number(review.rating || 0))
                            )}
                          </p>

                          <p className="text-gray-600 text-sm mt-2">
                            {review.comment || review.review || ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Profile */}
                {activeTab === "profile" && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                    <h2 className="text-2xl font-bold mb-2">
                      My Profile
                    </h2>

                    <p className="text-gray-500 text-sm mb-7">
                      Update your personal account information.
                    </p>

                    {successMessage && (
                      <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                        {successMessage}
                      </div>
                    )}

                    {errorMessage && (
                      <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                      </div>
                    )}

                    <form
                      onSubmit={handleProfileUpdate}
                      className="space-y-5"
                    >
                      {/* Profile Picture */}
                      <div>
                        <label className="block text-sm font-medium mb-3">
                          Profile Picture
                        </label>

                        <div className="flex items-center gap-4">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Profile Preview"
                              className="w-20 h-20 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                              <UserRound
                                size={32}
                                className="text-emerald-700"
                              />
                            </div>
                          )}

                          <div>
                            <label className="cursor-pointer inline-block bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm">
                              <Camera
                                size={16}
                                className="inline mr-2"
                              />
                              Upload Photo

                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];

                                  if (file) {
                                    setProfileForm((prev) => ({
                                      ...prev,
                                      profile_picture: file,
                                    }));

                                    setImagePreview(
                                      URL.createObjectURL(file)
                                    );
                                  }
                                }}
                              />
                            </label>

                            <p className="text-xs text-gray-500 mt-2">
                              Select a photo from your device.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* First Name */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          First Name
                        </label>

                        <input
                          type="text"
                          value={profileForm.first_name}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              first_name: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-emerald-700"
                          placeholder="Enter first name"
                        />
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Last Name
                        </label>

                        <input
                          type="text"
                          value={profileForm.last_name}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              last_name: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-emerald-700"
                          placeholder="Enter last name"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email Address
                        </label>

                        <input
                          type="email"
                          required
                          value={profileForm.email}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-emerald-700"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="flex items-center justify-center gap-2 bg-[#047857] text-white px-8 py-3 rounded-full font-semibold hover:bg-emerald-800 disabled:opacity-60"
                      >
                        {profileSaving ? (
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <Save size={18} />
                        )}

                        {profileSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

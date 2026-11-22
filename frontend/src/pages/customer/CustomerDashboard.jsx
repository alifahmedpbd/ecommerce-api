
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
  const [successMessage, setSuccessMessage] = useState("");
const [errorMessage, setErrorMessage] = useState("");

 const [profileForm, setProfileForm] = useState({
    
  first_name: "",
  last_name: "",
  email: "",
  profile_picture: null,
});

const [imagePreview, setImagePreview] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  // Redirect if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Load profile information
useEffect(() => {
  if (user) {
    setProfileForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      profile_picture: null,
    });

    setImagePreview(user.profile_picture || "");
  }
}, [user]);

  // Load dashboard data
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

  // Update customer profile


const handleProfileUpdate = async (e) => {
  e.preventDefault();

  setSuccessMessage("");
  setErrorMessage("");

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
    
  } catch (error) {
    console.error(error.response?.data || error);
    setErrorMessage("Unable to update your profile. Please try again.");
  }
};



  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
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
    item.product?.name || item.product_name || item.name || "Product";

  const getAmount = (order) =>
    order.amount ?? order.total ?? order.order_total ?? 0;

  const formatDate = (date) => {
    if (!date) return "Date unavailable";
    return new Date(date).toLocaleDateString();
  };

  const displayName =
    user?.first_name || user?.username || "Customer";

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
                    src={user.profile_picture || "/default-avatar.png"}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="font-bold truncate">
                  {displayName}
                </p>
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
                      setProfileMessage("");
                      setProfileError("");
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

                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <div className="flex justify-between items-center mb-5">
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
                        <p className="text-gray-500 py-8 text-center">
                          No orders yet.
                        </p>
                      ) : (
                        orders.slice(0, 5).map((order) => (
                          <div
                            key={order.id}
                            className="py-4 border-t flex flex-wrap justify-between gap-3"
                          >
                            <div>
                              <p className="font-semibold">
                                Order #{order.id}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(order.created_at)}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-bold">
                                {order.currency || "USD"}{" "}
                                {getAmount(order)}
                              </p>
                              <span className="text-xs text-emerald-700 capitalize">
                                {order.status || "Pending"}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {/* Orders */}
                {activeTab === "orders" && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-xl font-bold mb-5">
                      My Orders
                    </h2>

                    {orders.length === 0 ? (
                      <p className="text-gray-500 py-8 text-center">
                        You haven't placed any orders yet.
                      </p>
                    ) : (
                      orders.map((order) => (
                        <div
                          key={order.id}
                          className="border-t py-5 flex flex-wrap justify-between gap-3"
                        >
                          <div>
                            <p className="font-bold">
                              Order #{order.id}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(order.created_at)}
                            </p>
                            <p className="text-sm capitalize mt-1">
                              Status: {order.status || "Pending"}
                            </p>
                          </div>

                          <p className="font-bold">
                            {order.currency || "USD"}{" "}
                            {getAmount(order)}
                          </p>
                        </div>
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
                              Math.min(
                                5,
                                Number(review.rating || 0)
                              )
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

                {/* Editable Profile */}
                {activeTab === "profile" && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                    <h2 className="text-2xl font-bold mb-2">
                      My Profile
                    </h2>

                    {successMessage && (
  <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 font-bold">
      ✓
    </span>
    <span>{successMessage}</span>
  </div>
)}

{errorMessage && (
  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {errorMessage}
  </div>
)}

                    <p className="text-gray-500 text-sm mb-7">
                      Update your personal account information.
                    </p>

                    {profileMessage && (
                      <p className="bg-green-50 text-green-700 p-3 rounded-lg mb-5">
                        {profileMessage}
                      </p>
                    )}

                    {profileError && (
                      <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-5">
                        {profileError}
                      </p>
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
                          {profileForm.profile_picture_url ? (
                            <img
                              src={profileForm.profile_picture_url}
                              alt="Profile preview"
                              className="w-20 h-20 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                              <UserRound size={32} />
                            </div>
                          )}

                          <div className="flex-1">
                            <Camera size={20} className="text-emerald-700 mb-2" />
                            <p className="text-xs text-gray-500">
                              Paste an image URL below to update your picture.
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
                            setProfileForm({
                              ...profileForm,
                              first_name: e.target.value,
                            })
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
                            setProfileForm({
                              ...profileForm,
                              last_name: e.target.value,
                            })
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
                            setProfileForm({
                              ...profileForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-emerald-700"
                        />
                      </div>

                      {/* Profile Picture URL */}
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
        <UserRound size={32} className="text-emerald-700" />
      </div>
    )}

    <div>
      <label className="cursor-pointer inline-block bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm">
        <Camera size={16} className="inline mr-2" />
        Upload Photo

        <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0]

    if (file) {
      setProfileForm((prev) => ({
        ...prev,
        profile_picture: file,
      }))
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

                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="flex items-center justify-center gap-2 bg-[#047857] text-white px-8 py-3 rounded-full font-semibold hover:bg-emerald-800 disabled:opacity-60"
                      >
                        {profileSaving ? (
                          <LoaderCircle size={18} className="animate-spin" />
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

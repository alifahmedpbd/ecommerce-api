
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";

import { getCart } from "../../services/cartService";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const fetchCartCount = async () => {
    try {
      const cart = await getCart();
      const total = (cart.cartitems || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();

    const handleCartUpdate = () => fetchCartCount();

    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
      setProfileOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const displayName =
    user?.first_name || user?.username || "Customer";

  const profileImage = user?.profile_picture
    ? user.profile_picture.startsWith("http")
      ? user.profile_picture
      : user.profile_picture.startsWith("/")
        ? user.profile_picture
        : `/media/${user.profile_picture}`
    : null;

  // Determine user role
  const role = user?.is_superuser
    ? "admin"
    : user?.role ||
      (user?.is_staff ? "staff" : "customer");

  const goToDashboard = (path) => {
    navigate(path);
    setProfileOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">

        <div className="h-20 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="text-2xl font-bold tracking-tight">
            <span className="text-[#171717]">API</span>
            <span className="text-[#047857]">Store</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/about">About</Link>
          </nav>

          {/* Search */}
          <div className="hidden lg:flex items-center bg-[#FAFAF9] rounded-full px-4 py-3 w-64">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="bg-transparent outline-none ml-3 w-full text-sm"
            />
          </div>

          <div className="flex items-center gap-4">

            {/* Cart */}
            <Link to="/cart" className="relative p-1">
              <ShoppingBag size={23} />

              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[19px] h-[19px] px-1 rounded-full bg-[#047857] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Desktop Profile */}
            {!loading && (
              user ? (
                <div className="hidden sm:block relative">

                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 hover:text-[#047857] transition"
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span className="text-sm font-semibold">
                      {displayName}
                    </span>

                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        profileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-60 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50">

                      {/* User Information */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Customer Dashboard - Everyone */}
                      <button
                        onClick={() => goToDashboard("/dashboard")}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#047857]"
                      >
                        <LayoutDashboard size={18} />
                        Customer Dashboard
                      </button>

                      {/* Staff Dashboard - Staff only */}
                      {role === "staff" && (
                        <button
                          onClick={() => goToDashboard("/staff")}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#047857]"
                        >
                          <LayoutDashboard size={18} />
                          Staff Dashboard
                        </button>
                      )}

                      {/* Admin Dashboard - Admin only */}
                      {role === "admin" && (
                        <button
                          onClick={() => goToDashboard("/admin")}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-[#047857]"
                        >
                          <LayoutDashboard size={18} />
                          Admin Dashboard
                        </button>
                      )}

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={18} />
                          Logout
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-[#047857]"
                >
                  <UserRound size={20} />
                  Login
                </Link>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden"
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden py-5 border-t flex flex-col gap-4 text-sm">

            <Link onClick={() => setMenuOpen(false)} to="/">
              Home
            </Link>

            <Link onClick={() => setMenuOpen(false)} to="/shop">
              Shop
            </Link>

            <Link onClick={() => setMenuOpen(false)} to="/categories">
              Categories
            </Link>

            <Link onClick={() => setMenuOpen(false)} to="/about">
              About
            </Link>

            {!loading && (
              user ? (
                <>
                  <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <p className="font-semibold">{displayName}</p>
                      <p className="text-xs text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Customer Dashboard */}
                  <button
                    onClick={() => goToDashboard("/dashboard")}
                    className="flex items-center gap-2 text-gray-700 hover:text-[#047857]"
                  >
                    <LayoutDashboard size={18} />
                    Customer Dashboard
                  </button>

                  {/* Staff Dashboard */}
                  {role === "staff" && (
                    <button
                      onClick={() => goToDashboard("/staff")}
                      className="flex items-center gap-2 text-gray-700 hover:text-[#047857]"
                    >
                      <LayoutDashboard size={18} />
                      Staff Dashboard
                    </button>
                  )}

                  {/* Admin Dashboard */}
                  {role === "admin" && (
                    <button
                      onClick={() => goToDashboard("/admin")}
                      className="flex items-center gap-2 text-gray-700 hover:text-[#047857]"
                    >
                      <LayoutDashboard size={18} />
                      Admin Dashboard
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  onClick={() => setMenuOpen(false)}
                  to="/login"
                  className="flex items-center gap-2"
                >
                  <UserRound size={18} />
                  Login
                </Link>
              )
            )}

          </nav>
        )}

      </div>
    </header>
  );
}


import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import { getCart } from "../../services/cartService";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const { user, logout, loading } = useAuth();

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
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const displayName =
    user?.first_name || user?.username || "Customer";

  // Backend ImageField থেকে পাওয়া image URL
  const profileImage = user?.profile_picture
    ? user.profile_picture.startsWith("http")
      ? user.profile_picture
      : user.profile_picture.startsWith("/")
        ? user.profile_picture
        : `/media/${user.profile_picture}`
    : null;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="h-20 flex items-center justify-between gap-6">

          <Link to="/" className="text-2xl font-bold tracking-tight">
            <span className="text-[#171717]">API</span>
            <span className="text-[#047857]">Store</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/about">About</Link>
          </nav>

          <div className="hidden lg:flex items-center bg-[#FAFAF9] rounded-full px-4 py-3 w-64">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="bg-transparent outline-none ml-3 w-full text-sm"
            />
          </div>

          <div className="flex items-center gap-4">

            <Link to="/cart" className="relative p-1">
              <ShoppingBag size={23} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[19px] h-[19px] px-1 rounded-full bg-[#047857] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {!loading && (
              user ? (
                <div className="hidden sm:flex items-center gap-3">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 hover:text-emerald-700"
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
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
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

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden"
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden py-5 border-t flex flex-col gap-4 text-sm">
            <Link onClick={() => setMenuOpen(false)} to="/">Home</Link>
            <Link onClick={() => setMenuOpen(false)} to="/shop">Shop</Link>
            <Link onClick={() => setMenuOpen(false)} to="/categories">Categories</Link>
            <Link onClick={() => setMenuOpen(false)} to="/about">About</Link>

            {!loading && (
              user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-emerald-700 font-semibold"
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserRound size={20} />
                    )}
                    {displayName} - My Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="text-left text-red-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link onClick={() => setMenuOpen(false)} to="/login">
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

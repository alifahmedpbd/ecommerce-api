
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#171717] text-white mt-20">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        <div>
          <h2 className="text-2xl font-bold mb-4">
            API<span className="text-[#047857]">Store</span>
          </h2>
          <p className="text-gray-400 text-sm leading-7">
            Discover quality products with a simple and enjoyable shopping experience.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Quick Links</h3>
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/categories">Categories</Link>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Customer Service</h3>
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <Link to="/contact">Contact Us</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/wishlist">Wishlist</Link>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Get in Touch</h3>
          <p className="text-sm text-gray-400 leading-7">
            Have questions? We are here to help you.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} API Store. All rights reserved.
      </div>
    </footer>
  );
}

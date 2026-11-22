
import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-12">
      <div className="max-w-md w-full text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <XCircle size={64} className="text-red-500 mx-auto mb-5" />

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Payment Cancelled
        </h1>

        <p className="text-gray-600 mb-7">
          Your payment was not completed. You can return to your cart and try again.
        </p>

        <Link
          to="/cart"
          className="inline-block bg-[#047857] text-white px-7 py-3 rounded-full font-medium hover:bg-emerald-800 transition"
        >
          Return to Cart
        </Link>
      </div>
    </div>
  );
}

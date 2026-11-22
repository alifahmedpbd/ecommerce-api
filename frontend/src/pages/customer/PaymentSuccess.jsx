
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-12">
      <div className="max-w-md w-full text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <CheckCircle size={64} className="text-emerald-600 mx-auto mb-5" />

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Thank You!
        </h1>

        <p className="text-gray-600 mb-5">
          Your payment has been submitted successfully.
          Your order is being confirmed.
        </p>

        {sessionId && (
          <p className="text-xs text-gray-400 break-all mb-6">
            Session ID: {sessionId}
          </p>
        )}

        <Link
          to="/shop"
          className="inline-block bg-[#047857] text-white px-7 py-3 rounded-full font-medium hover:bg-emerald-800 transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

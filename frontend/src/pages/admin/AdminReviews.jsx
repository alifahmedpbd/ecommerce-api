
import { useEffect, useState } from "react";
import { Trash2, Star } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/admin/AdminLayout";
import normalizeList from "../../utils/normalizeList";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReviews = async () => {
  try {
    const res = await api.get("/admin/reviews/");
    setReviews(normalizeList(res.data));
  } catch (err) {
    console.error(err.response?.data || err);
    setError("Reviews load করা যায়নি।");
  }
};

  useEffect(() => {
    loadReviews();
  }, []);

  const deleteReview = async (id) => {
    if (!window.confirm("এই review delete করতে চাও?")) return;

    try {
      await api.delete(`/admin/reviews/${id}/`);
      setReviews((prev) => prev.filter((review) => review.id !== id));
      setMessage("Review deleted successfully.");
    } catch (err) {
      setError(JSON.stringify(err.response?.data || "Review delete failed."));
    }
  };

  return (
    <AdminLayout>
      <div className="mb-7">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer reviews</p>
      </div>

      {message && <p className="text-[#047857] mb-4 text-sm">{message}</p>}
      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      <div className="grid gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white border rounded-xl p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  {review.user?.username || "Customer"}
                </h3>
                <p className="text-xs text-gray-500">{review.user?.email}</p>
              </div>

              <button
                onClick={() => deleteReview(review.id)}
                className="text-red-600 flex items-center gap-2 text-sm"
              >
                <Trash2 size={17} /> Delete
              </button>
            </div>

            <div className="flex items-center gap-1 mt-4 text-amber-500">
              {Array.from({ length: Number(review.rating) || 0 }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
              <span className="text-gray-500 text-xs ml-2">
                {review.rating}/5
              </span>
            </div>

            <p className="text-gray-700 mt-3">{review.review}</p>
            <p className="text-xs text-gray-400 mt-3">
              {review.created ? new Date(review.created).toLocaleString() : ""}
            </p>
          </div>
        ))}

        {!reviews.length && (
          <div className="bg-white border rounded-xl p-8 text-center text-gray-500">
            No reviews found.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

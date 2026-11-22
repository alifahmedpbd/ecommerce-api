
import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'

export default function ProductCard({ product }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition group min-w-0">
      <Link to={`/products/${product.slug}`}>
        <div className="bg-[#FAFAF9] aspect-square overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              No Image
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 sm:p-4">
        {product.category_name && (
          <p className="text-[10px] sm:text-xs text-[#047857] mb-1">
            {product.category_name}
          </p>
        )}

        <Link to={`/products/${product.slug}`}>
          <h3 className="text-xs sm:text-sm font-semibold text-[#171717] line-clamp-2 min-h-9">
            {product.name}
          </h3>
        </Link>

        <p className="text-sm sm:text-base font-bold text-[#047857] mt-2">
          ৳ {Number(product.price).toLocaleString('en-BD')}
        </p>

        <Link
          to={`/products/${product.slug}`}
          className="mt-3 flex justify-center items-center gap-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-lg py-2 text-xs sm:text-sm font-medium transition"
        >
          <ShoppingCart size={15} />
          View Product
        </Link>
      </div>
    </div>
  )
}

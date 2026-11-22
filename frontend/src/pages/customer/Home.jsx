
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Truck, ShieldCheck, RotateCcw,
  Headphones, Gift, Search
} from 'lucide-react'

import { getProducts, getCategories } from '../../services/productService'
import ProductCard from '../../components/products/ProductCard'

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productData, categoryData] = await Promise.all([
          getProducts(),
          getCategories()
        ])

        setProducts(Array.isArray(productData) ? productData.slice(0, 6) : [])
        setCategories(Array.isArray(categoryData) ? categoryData : [])
      } catch (error) {
        console.error('Homepage error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const heroProduct = products[0]

  return (
    <main className="bg-white">

      {/* Promotional Hero */}
      <section className="max-w-7xl mx-auto px-3 sm:px-5 pt-4">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-50 via-green-100 to-emerald-200 min-h-[300px] sm:min-h-[370px] flex items-center">

          <div className="relative z-10 w-full md:w-1/2 p-6 sm:p-10 lg:p-14">
            <span className="inline-flex bg-[#047857] text-white text-xs sm:text-sm px-3 py-2 rounded-full font-semibold">
              ✦ Welcome to API Store
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-[#171717] mt-5">
              Upgrade Your Style
              <span className="block text-[#047857]">
                Shop Smarter Today
              </span>
            </h1>

            <p className="text-gray-600 text-sm sm:text-base mt-4 max-w-md">
              Discover quality products at great prices.
              Enjoy a better shopping experience.
            </p>

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 mt-6 bg-[#047857] hover:bg-[#065f46] text-white px-6 py-3 rounded-full text-sm font-semibold transition"
            >
              Shop Now <ArrowRight size={17} />
            </Link>
          </div>

          <div className="hidden md:flex absolute right-0 top-0 w-1/2 h-full items-center justify-center p-8">
            {heroProduct?.image ? (
              <img
                src={heroProduct.image}
                alt={heroProduct.name}
                className="w-full h-full object-contain drop-shadow-xl"
              />
            ) : (
              <div className="text-8xl text-[#047857]">✦</div>
            )}
          </div>
        </div>
      </section>

      {/* Service Benefits */}
      <section className="max-w-7xl mx-auto px-3 sm:px-5 mt-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 bg-[#FAFAF9] rounded-xl p-3 sm:p-5">

          <Feature icon={<Truck />} title="Free Shipping" text="Fast Delivery" />
          <Feature icon={<ShieldCheck />} title="Secure Payment" text="Safe Shopping" />
          <Feature icon={<RotateCcw />} title="Easy Return" text="Within 7 Days" />
          <Feature icon={<Headphones />} title="24/7 Support" text="Always Here" />

        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-3 sm:px-5 mt-10 sm:mt-14">
        <SectionHeading
          title="Best Sellers"
          subtitle="OUR COLLECTION"
          link="/shop"
        />

        {loading ? (
          <p className="text-center py-10 text-gray-500">Loading products...</p>
        ) : products.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 py-8">No featured products available.</p>
        )}
      </section>

      {/* Flash Deal Banner */}
      <section className="max-w-7xl mx-auto px-3 sm:px-5 mt-10">
        <div className="rounded-xl bg-[#171717] text-white p-6 sm:p-9 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <p className="text-emerald-400 font-semibold text-sm">SPECIAL COLLECTION</p>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2">Discover Great Deals</h2>
            <p className="text-gray-400 text-sm mt-2">
              Explore our latest products and collections.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-yellow-400 text-black font-semibold px-5 py-2.5 rounded-full mt-5 text-sm"
            >
              Explore Now <ArrowRight size={16} />
            </Link>
          </div>
          <Gift size={90} className="text-emerald-500" />
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-3 sm:px-5 mt-12">
        <SectionHeading
          title="Popular Categories"
          subtitle="EXPLORE OUR COLLECTION"
          link="/categories"
        />

        {loading ? (
          <p className="text-gray-500">Loading categories...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.slice(0, 6).map((category, index) => (
              <Link
                key={category.id}
                to={`/categories/${category.slug}`}
                className="rounded-xl overflow-hidden bg-[#FAFAF9] border border-gray-100 hover:border-[#047857] transition"
              >
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-3xl text-[#047857]">
                    ✦
                  </div>
                )}
                <p className="text-center text-xs sm:text-sm font-semibold p-3 line-clamp-1">
                  {category.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-3 sm:px-5 mt-12 mb-12">
        <div className="bg-gradient-to-r from-green-600 to-emerald-400 rounded-xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              Stay Updated!
            </h2>
            <p className="text-sm text-green-50 mt-2">
              Discover new products and latest offers.
            </p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full md:w-auto bg-white rounded-full p-1"
          >
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className="min-w-0 flex-1 md:w-64 px-4 text-gray-700 text-sm outline-none rounded-full"
            />
            <button
              type="submit"
              className="bg-[#171717] text-white rounded-full px-5 py-3 text-sm font-semibold"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

    </main>
  )
}

function Feature({ icon, title, text }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <div className="text-[#047857] bg-white p-2 sm:p-3 rounded-lg shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-xs sm:text-sm font-bold text-[#171717]">{title}</h3>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{text}</p>
      </div>
    </div>
  )
}

function SectionHeading({ title, subtitle, link }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <p className="text-[#047857] text-[10px] sm:text-xs font-bold tracking-wider">
          {subtitle}
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-[#171717] mt-1">
          {title}
        </h2>
      </div>
      <Link to={link} className="text-[#047857] text-xs sm:text-sm font-semibold flex items-center gap-1">
        View All <ArrowRight size={15} />
      </Link>
    </div>
  )
}

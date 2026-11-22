
import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { getCategories, getShopProducts } from '../../services/productService'
import ProductCard from '../../components/products/ProductCard'

const PRODUCTS_PER_PAGE = 6

export default function Shop() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('default')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productData, categoryData] = await Promise.all([
          getShopProducts(),
          getCategories()
        ])
        setProducts(productData)
        setCategories(categoryData)
      } catch (err) {
        console.error(err)
        setError('Unable to load products.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (search.trim()) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (category !== 'all') {
      result = result.filter(product => product.category_slug === category)
    }

    if (minPrice !== '') {
      result = result.filter(product => Number(product.price) >= Number(minPrice))
    }

    if (maxPrice !== '') {
      result = result.filter(product => Number(product.price) <= Number(maxPrice))
    }

    if (sort === 'price-low') {
      result.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sort === 'price-high') {
      result.sort((a, b) => Number(b.price) - Number(a.price))
    } else if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [products, search, category, minPrice, maxPrice, sort])

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)

  const visibleProducts = filteredProducts.slice(
    (page - 1) * PRODUCTS_PER_PAGE,
    page * PRODUCTS_PER_PAGE
  )

  useEffect(() => {
    setPage(1)
  }, [search, category, minPrice, maxPrice, sort])

  const resetFilters = () => {
    setSearch('')
    setCategory('all')
    setSort('default')
    setMinPrice('')
    setMaxPrice('')
    setPage(1)
  }

  return (
    <main className="bg-[#FAFAF9] min-h-screen">

      <section className="bg-[#171717] text-white py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-5">
          <p className="text-emerald-400 text-xs font-bold tracking-widest">OUR COLLECTION</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-2">Shop All Products</h1>
          <p className="text-gray-400 text-sm mt-3">Find something you will love.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-3 sm:px-5 py-8 sm:py-12">

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-3 flex-1">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full min-w-0 text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3">
            <ArrowUpDown size={17} className="text-[#047857]" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-transparent py-3 text-sm outline-none w-full"
            >
              <option value="default">Default sorting</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-7">

          <aside className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 h-fit">
            <div className="flex items-center gap-2 mb-5">
              <SlidersHorizontal size={18} className="text-[#047857]" />
              <h2 className="font-bold">Filters</h2>
            </div>

            <h3 className="font-semibold text-sm mb-3">Categories</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <button
                onClick={() => setCategory('all')}
                className={`text-left text-sm py-1 ${category === 'all' ? 'text-[#047857] font-bold' : 'text-gray-600'}`}
              >
                All Categories
              </button>
              {categories.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCategory(item.slug)}
                  className={`text-left text-sm py-1 ${category === item.slug ? 'text-[#047857] font-bold' : 'text-gray-600'}`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 mt-5 pt-5">
              <h3 className="font-semibold text-sm mb-3">Price Range</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  placeholder="Min ৳"
                  className="w-1/2 min-w-0 border rounded-lg p-2 text-xs outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  placeholder="Max ৳"
                  className="w-1/2 min-w-0 border rounded-lg p-2 text-xs outline-none"
                />
              </div>
            </div>

            <button
              onClick={resetFilters}
              className="w-full mt-5 border border-[#047857] text-[#047857] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#047857] hover:text-white transition"
            >
              Reset Filters
            </button>
          </aside>

          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs sm:text-sm text-gray-500">
                {loading ? 'Loading...' : `${filteredProducts.length} products found`}
              </p>
              <p className="text-xs text-gray-500">
                Page {totalPages ? page : 0} of {totalPages}
              </p>
            </div>

            {loading ? (
              <p className="text-center py-16 text-gray-500">Loading products...</p>
            ) : error ? (
              <p className="text-center py-16 text-red-600">{error}</p>
            ) : visibleProducts.length ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                  {visibleProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-9">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="p-2 rounded-lg border bg-white disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={19} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                      <button
                        key={number}
                        onClick={() => setPage(number)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold ${
                          page === number
                            ? 'bg-[#047857] text-white'
                            : 'bg-white border text-gray-700'
                        }`}
                      >
                        {number}
                      </button>
                    ))}

                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="p-2 rounded-lg border bg-white disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <ChevronRight size={19} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl p-10 text-center">
                <h3 className="font-bold text-lg">No products found</h3>
                <p className="text-gray-500 text-sm mt-2">Try changing your filters.</p>
                <button onClick={resetFilters} className="mt-4 bg-[#047857] text-white px-5 py-2 rounded-lg text-sm">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

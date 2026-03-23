import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../api';
import ProductCard from '../components/ProductCard';
import { PRODUCT_FALLBACK, HERO_BG, CAT_COUTURE, CAT_HANDBAGS, CAT_HERITAGE, BANNER_SILK } from '../assets/images';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { ProductSkeleton } from '../components/Skeleton';

export default function Collection() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const urlCategory = searchParams.get('category') || '';
  const urlSearch = searchParams.get('search') || '';

  // ── Load distinct categories from real DB products ──────────────────────
  useEffect(() => {
    API.get('/products?limit=200')
      .then(r => {
        const realCats = (r.data.products || []).map(p => p.category).filter(Boolean);
        const mockCats = MOCK_PRODUCTS.map(p => p.category);
        const allCats = [...new Set([...realCats, ...mockCats])];
        setCategories(allCats);
      })
      .catch(() => {
        const mockCats = [...new Set(MOCK_PRODUCTS.map(p => p.category))];
        setCategories(mockCats);
      });
  }, []);

  // ── Sync URL category → sidebar selection ────────────────────────────────
  useEffect(() => {
    setSelectedCategory(urlCategory);
    setCurrentPage(1);
  }, [urlCategory]);

  // ── Fetch products whenever any filter changes ───────────────────────────
  const fetchProducts = useCallback(() => {
    const params = new URLSearchParams();

    const activeCategory = selectedCategory || urlCategory;
    if (activeCategory) params.set('category', activeCategory);
    if (urlSearch) params.set('search', urlSearch);
    if (maxPrice) params.set('maxPrice', maxPrice);

    params.set('sort', sort);
    params.set('page', currentPage);
    params.set('limit', 9);

    setLoading(true);
    API.get(`/products?${params.toString()}`)
      .then(r => {
        let realProducts = r.data.products || [];

        // ── Local Storage Injection ──────────────────────────────────────
        const localData = localStorage.getItem('aara_local_products');
        const localProducts = localData ? JSON.parse(localData) : [];
        const filteredLocals = localProducts.filter(lp => {
          const matchesCat = !activeCategory || lp.category === activeCategory;
          const matchesSearch = !urlSearch || lp.name.toLowerCase().includes(urlSearch.toLowerCase());
          const matchesPrice = !maxPrice || lp.price <= parseFloat(maxPrice);
          return matchesCat && matchesSearch && matchesPrice;
        });

        // Combine Real + Local (Prioritize Real)
        let combined = [...realProducts, ...filteredLocals];

        // ── Mock Injection Logic ──────────────────────────────────────────
        if (combined.length < 6) {
          const filteredMocks = MOCK_PRODUCTS.filter(mp => {
            const matchesCat = !activeCategory || mp.category === activeCategory;
            const matchesSearch = !urlSearch || mp.name.toLowerCase().includes(urlSearch.toLowerCase());
            const matchesPrice = !maxPrice || mp.price <= parseFloat(maxPrice);
            return matchesCat && matchesSearch && matchesPrice;
          });

          for (const m of filteredMocks) {
            if (combined.length >= 9) break;
            if (!combined.some(p => p.name === m.name)) {
              combined.push(m);
            }
          }
        }

        // ── Local Sort Enforcement (API + Mocks) ──────────────────────────
        if (sort === 'price_asc') {
          combined.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sort === 'price_desc') {
          combined.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sort === 'rating') {
          combined.sort((a, b) => (b.rating || Math.random() * 5) - (a.rating || Math.random() * 5));
        } else if (sort === 'name_asc') {
          combined.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sort === 'name_desc') {
          combined.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        }

        setProducts(combined.slice(0, 9));
        setTotal(Math.max(r.data.total || 0, combined.length));
        setPages(Math.max(r.data.pages || 1, Math.ceil(combined.length / 9)));
      })
      .catch(() => {
        // Fallback to Local + Mock if API fails
        const localData = localStorage.getItem('aara_local_products');
        const localProducts = localData ? JSON.parse(localData) : [];
        const activeCategory = selectedCategory || urlCategory;

        const filteredLocals = localProducts.filter(lp => {
          const matchesCat = !activeCategory || lp.category === activeCategory;
          const matchesSearch = !urlSearch || lp.name.toLowerCase().includes(urlSearch.toLowerCase());
          return matchesCat && matchesSearch;
        });

        const filteredMocks = MOCK_PRODUCTS.filter(mp => {
          const matchesCat = !activeCategory || mp.category === activeCategory;
          const matchesSearch = !urlSearch || mp.name.toLowerCase().includes(urlSearch.toLowerCase());
          return matchesCat && matchesSearch;
        });

        const combined = [...filteredLocals, ...filteredMocks];

        // ── Local Sort Enforcement (Mocks) ──────────────────────────
        if (sort === 'price_asc') {
          combined.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sort === 'price_desc') {
          combined.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sort === 'rating') {
          combined.sort((a, b) => (b.rating || Math.random() * 5) - (a.rating || Math.random() * 5));
        } else if (sort === 'name_asc') {
          combined.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sort === 'name_desc') {
          combined.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        }

        setProducts(combined.slice(0, 9));
        setTotal(combined.length);
        setPages(1);
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, urlCategory, urlSearch, maxPrice, sort, currentPage]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory(urlCategory);
    setMaxPrice('');
    setCurrentPage(1);
  };

  const pageTitle = urlSearch ? `Search: "${urlSearch}"` : selectedCategory || 'All Collections';

  const bannerImgs = {
    'Silk Scarves': BANNER_SILK,
    'Couture': CAT_COUTURE,
    'Heritage': CAT_HERITAGE,
    'Handbags': CAT_HANDBAGS,
  };
  const bannerImg = bannerImgs[selectedCategory || urlCategory] || HERO_BG;

  return (
    <div className="bg-white min-h-screen text-gray-900 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #aba0e3 0%, #d4cdf7 100%)' }}>
        <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-6">
          <span className="font-bold text-[8px] uppercase tracking-[0.4em] mb-3 text-white/90">Curated Selections</span>
          <h1 className="font-serif text-3xl md:text-5xl text-white font-bold tracking-tight drop-shadow-sm">
            {selectedCategory || urlCategory || 'The Collection'}
          </h1>
          <div className="w-12 h-px mt-5 bg-white/40" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-10 bg-gray-50 p-3 px-5 rounded-md border border-gray-200 w-fit">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          {(selectedCategory || urlCategory) && !urlSearch ? (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-500">Women</span>
              <span className="text-gray-400">/</span>
              <span className="text-blue-600 font-semibold">{pageTitle}</span>
            </>
          ) : (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-blue-600 font-semibold">{pageTitle}</span>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">

          {/* Sidebar - Sticky */}
          <aside className="lg:w-64 shrink-0 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2 custom-scrollbar">

            {/* Category filter */}
            <div className="bg-gray-50 p-8 border border-gray-100 shadow-sm relative overflow-hidden rounded-sm">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900">Filters</h3>
                  {(selectedCategory && selectedCategory !== urlCategory) || maxPrice ? (
                    <button onClick={clearFilters}
                      className="text-[9px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
                      Reset
                    </button>
                  ) : null}
                </div>

                <div className="space-y-12">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-6">Category</p>
                    <ul className="space-y-1">
                      {/* "All" option */}
                      <li>
                        <button
                          onClick={() => handleCategoryClick('')}
                          className={`group flex items-center justify-between w-full py-3 px-4 text-[11px] font-bold tracking-wide transition-all rounded-sm
                            ${!selectedCategory ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}
                        >
                          All Pieces
                          {!selectedCategory && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                        </button>
                      </li>
                      {/* Dynamic categories from DB */}
                      {categories.map(cat => (
                        <li key={cat}>
                          <button
                            onClick={() => handleCategoryClick(cat)}
                            className={`group flex items-center justify-between w-full py-3 px-4 text-[11px] font-bold tracking-wide transition-all rounded-sm
                              ${selectedCategory === cat ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}
                          >
                            {cat}
                            {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">Price Range</p>
                      <span className="text-sm font-bold text-gray-900 tracking-tight">{maxPrice ? `₹${Number(maxPrice).toLocaleString()}` : 'Maximum'}</span>
                    </div>
                    <div className="px-1">
                      <input
                        type="range" min="100" max="10000" step="100"
                        value={maxPrice || 10000}
                        onChange={e => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                        className="w-full h-1 bg-gray-200 accent-blue-600 appearance-none cursor-pointer rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-6">Sort by Selection</p>
                    <div className="px-0">
                      <select
                        value={sort}
                        onChange={e => { setSort(e.target.value); setCurrentPage(1); }}
                        className="w-full text-[10px] uppercase tracking-widest font-bold text-gray-900 border border-gray-200 px-4 py-3 bg-white outline-none focus:border-blue-600 transition-all cursor-pointer rounded-sm"
                      >
                        <option value="newest">Recent Items</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="rating">Top Rated</option>
                        <option value="name_asc">Alphabetical: A to Z</option>
                        <option value="name_desc">Alphabetical: Z to A</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </aside>

          {/* ── Product Grid ─────────────────────────────────────────────── */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 bg-gray-50 p-6 border border-gray-100 rounded-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {loading ? 'Sourcing catalog...' : (
                  <>Displaying <span className="text-gray-900">{total}</span> masterworks</>
                )}
              </p>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-32 bg-gray-50 border border-gray-100 shadow-sm relative overflow-hidden rounded-sm">
                <div className="relative z-10 px-6">
                  <div className="mb-10 mx-auto w-16 h-16 bg-white border border-gray-100 flex items-center justify-center rounded-full shadow-sm">
                    <span className="text-2xl text-gray-200">✧</span>
                  </div>
                  <h3 className="text-4xl font-serif font-bold text-gray-900 mb-6 tracking-tight">No Items Matching Selection</h3>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-12 max-w-xs mx-auto leading-loose italic">
                    We couldn't locate any pieces matching your current filters.
                  </p>
                  <button onClick={clearFilters} className="btn-primary">
                    View Entire Collection
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-6 mt-20 border-t border-gray-100 pt-12">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-14 h-14 flex items-center justify-center border border-gray-200 hover:border-gray-900 text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-all group rounded-sm">
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                </button>

                <div className="flex gap-4">
                  {Array.from({ length: Math.min(pages, 8) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setCurrentPage(p)}
                      className={`w-14 h-14 flex items-center justify-center text-[10px] font-bold tracking-widest transition-all rounded-xl
                        ${currentPage === p ? 'bg-blue-600 text-white shadow-xl' : 'bg-gray-50 text-gray-400 hover:text-gray-900 border border-gray-100'}`}>
                      {p < 10 ? `0${p}` : p}
                    </button>
                  ))}
                </div>

                <button onClick={() => setCurrentPage(p => Math.min(pages, p + 1))}
                  disabled={currentPage === pages}
                  className="w-14 h-14 flex items-center justify-center border border-gray-200 hover:border-gray-900 text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-all group rounded-sm">
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

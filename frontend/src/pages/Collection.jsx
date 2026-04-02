import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import API from '../api';
import ProductCard from '../components/ProductCard';
import { useCurrency } from '../context/CurrencyContext';
import { PRODUCT_FALLBACK, HERO_BG, CAT_COUTURE, CAT_HANDBAGS, CAT_HERITAGE, BANNER_SILK } from '../assets/images';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { ProductSkeleton } from '../components/Skeleton';
import { useShop } from '../context/ShopContext';
import MenBanner from '../assets/Men-Banner.png';
import WomenBanner from '../assets/Women-Banner.png';
import KidsBanner from '../assets/Kids-Banner.png';

const CATEGORY_ORDER = ['Kurti', 'Maxi', 'Co-ords', 'Anarkali'];

const normalizeCategory = (value = '') => {
  const v = value.trim().toLowerCase();
  if (v === 'co-ord sets' || v === 'co-ord set' || v === 'co-ords' || v === 'co ords') return 'Co-ords';
  if (v === 'kurti with dupatta') return 'Kurti';
  return value;
};

export default function Collection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlCategory = searchParams.get('category') || '';
  const urlSubcategory = searchParams.get('subcategory') || '';
  const urlSearch = searchParams.get('search') || '';
  const urlPage = parseInt(searchParams.get('page')) || 1;

  // New state for manual expand/collapse without affecting filters
  const [expandedCats, setExpandedCats] = useState([]);

  const lastUrlCat = useRef(null);
  useEffect(() => {
    if (urlCategory && urlCategory !== lastUrlCat.current) {
      const name = urlCategory.toLowerCase();
      if (!expandedCats.includes(name)) {
        setExpandedCats(prev => [...prev, name]);
      }
      lastUrlCat.current = urlCategory;
    }
  }, [urlCategory, expandedCats]);

  const { categories } = useShop();
  const { currencySymbol, country } = useCurrency();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [expandedFilters, setExpandedFilters] = useState({
    category: true,
    price: true,
    color: true,
    size: true,
    material: true,
    style: true,
    rating: true,
    stock: true
  });
  const priceMax = country === 'US' ? 200 : 10000;
  const priceStep = country === 'US' ? 5 : 100;
  const priceMin = country === 'US' ? 5 : 100;

  // ── Fetch products whenever any filter changes ───────────────────────────
  const fetchProducts = useCallback(() => {
    const params = new URLSearchParams();

    if (urlCategory) params.set('category', urlCategory);
    if (urlSubcategory) params.set('subcategory', urlSubcategory);
    if (urlSearch) params.set('search', urlSearch);
    if (maxPrice) params.set('maxPrice', maxPrice);

    params.set('sort', sort);
    params.set('page', urlPage);
    params.set('limit', 100);

    setLoading(true);
    API.get(`/products?${params.toString()}`)
      .then(r => {
        let realProducts = r.data.products || [];

        // Combine Real + Local (Prioritize Real)
        let combined = [...realProducts];

        // ── Mock Injection Logic (Only if empty) ──────────────────────────
        if (combined.length === 0) {
          const filteredMocks = MOCK_PRODUCTS.filter(mp => {
            const matchesCat = !urlCategory || mp.category === urlCategory;
            const matchesSub = !urlSubcategory || mp.subcategory === urlSubcategory;
            const matchesSearch = !urlSearch || mp.name.toLowerCase().includes(urlSearch.toLowerCase());
            const matchesPrice = !maxPrice || mp.price <= parseFloat(maxPrice);
            const matchesColor = selectedColors.length === 0 || (mp.colors && mp.colors.some(c => selectedColors.includes(c)));
            const matchesSize = selectedSizes.length === 0 || (mp.sizes && mp.sizes.some(s => selectedSizes.includes(s)));
            const matchesMaterial = selectedMaterials.length === 0 || (mp.material && selectedMaterials.includes(mp.material)) || (mp.fabric && selectedMaterials.includes(mp.fabric));
            const matchesStyle = selectedStyles.length === 0 || (mp.style && selectedStyles.includes(mp.style));
            const matchesRating = !minRating || (mp.averageRating || 0) >= minRating;
            const matchesStock = !inStockOnly || (mp.stock > 0);
            return matchesCat && matchesSub && matchesSearch && matchesPrice && matchesColor && matchesSize && matchesMaterial && matchesStyle && matchesRating && matchesStock;
          });
          combined = [...combined, ...filteredMocks.slice(0, 12)];
        }

        // ── Extract available filters from results ──────────────────────────
        const allColors = new Set();
        const allSizes = new Set();
        const allMaterials = new Set();
        const allStyles = new Set();
        
        combined.forEach(p => {
          if (p.colors) p.colors.forEach(c => allColors.add(c));
          if (p.sizes) p.sizes.forEach(s => allSizes.add(s));
          if (p.material) allMaterials.add(p.material);
          if (p.fabric) allMaterials.add(p.fabric);
          if (p.style) allStyles.add(p.style);
        });

        setAvailableColors(Array.from(allColors).sort());
        setAvailableSizes(['XS', 'S', 'M', 'L', 'XL', 'XXL'].filter(s => Array.from(allSizes).includes(s)));
        setAvailableMaterials(Array.from(allMaterials).sort());
        setAvailableStyles(Array.from(allStyles).sort());

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

        setProducts(combined);
        setTotal(r.data.total || combined.length);
        setPages(r.data.pages || Math.ceil(combined.length / 100));
      })
      .catch(() => {
        // Fallback to Local + Mock if API fails
        const localData = localStorage.getItem('thaarai_local_products');
        const localProducts = localData ? JSON.parse(localData) : [];
        const activeCategory = normalizeCategory(urlCategory);

        const filteredLocals = localProducts.filter(lp => {
          const matchesCat = !activeCategory || normalizeCategory(lp.category) === activeCategory;
          const matchesSearch = !urlSearch || lp.name.toLowerCase().includes(urlSearch.toLowerCase());
          return matchesCat && matchesSearch;
        });

        const filteredMocks = MOCK_PRODUCTS.filter(mp => {
          const matchesCat = !activeCategory || normalizeCategory(mp.category) === activeCategory;
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

        setProducts(combined);
        setTotal(r.data.total || combined.length);
        setPages(r.data.pages || Math.ceil(combined.length / 100));
      })
      .finally(() => setLoading(false));
  }, [urlCategory, urlSubcategory, urlSearch, urlPage, maxPrice, sort, selectedColors, selectedSizes, selectedMaterials, selectedStyles, minRating, inStockOnly]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const handleCategoryClick = (catName) => {
    const params = new URLSearchParams(searchParams);
    if (!catName) params.delete('category');
    else params.set('category', catName);

    params.delete('subcategory');
    params.set('page', '1');
    navigate(`/collection?${params.toString()}`);
  };

  const toggleExpand = (catName) => {
    const name = catName.toLowerCase();
    setExpandedCats(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };


  const handleSubcategoryClick = (subName) => {
    const params = new URLSearchParams(searchParams);
    // Toggling: If clicking the same subcategory, deselect it
    if (!subName || urlSubcategory.toLowerCase() === subName.toLowerCase()) {
      params.delete('subcategory');
    } else {
      params.set('subcategory', subName);
    }
    params.set('page', '1');
    navigate(`/collection?${params.toString()}`);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    navigate(`/collection?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFilterSection = (filterName) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const clearFilters = () => {
    navigate('/collection');
    setMaxPrice('');
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedMaterials([]);
    setSelectedStyles([]);
    setMinRating(0);
    setInStockOnly(false);
  };

  const pageTitle = urlSearch ? `Search: "${urlSearch}"` : urlCategory || 'All Collections';

  const bannerImgs = {
    'Kurti': CAT_COUTURE,
    'Kurtis': CAT_COUTURE,
    'Maxi': CAT_HANDBAGS,
    'Co-ords': CAT_HERITAGE,
    'Anarkali': BANNER_SILK,
    'Women': HERO_BG
  };
  const bannerImg = bannerImgs[urlCategory] || HERO_BG;

  // Category to banner mapping
  const categoryBannerMap = {
    'Men': MenBanner,
    'Mens': MenBanner,
    'Women': WomenBanner,
    'Womens': WomenBanner,
    'Kids': KidsBanner,
    'Childrens': KidsBanner,
    'Kurti': WomenBanner,
    'Kurtis': WomenBanner,
    'Maxi': WomenBanner,
    'Co-ords': WomenBanner,
    'Anarkali': WomenBanner
  };

  // Get banner for current category
  const getCategoryBanner = () => {
    if (urlCategory) {
      return categoryBannerMap[urlCategory] || WomenBanner;
    }
    return WomenBanner; // Default to Women banner for "All Pieces"
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 animate-fade-in">
      {/* Category Banner */}
      <div className="relative h-[300px] md:h-[450px] overflow-hidden bg-gray-100 -mt-[20px]">
        <img 
          src={getCategoryBanner()} 
          alt={urlCategory || 'All Pieces'}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-4 pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-10 bg-gray-50 p-3 px-5 rounded-md border border-gray-200 w-fit">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          {(urlCategory) && !urlSearch ? (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-500">Collection</span>
              <span className="text-gray-400">/</span>
              <span className="text-black font-semibold">{pageTitle}</span>
            </>
          ) : (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-black font-semibold">{pageTitle}</span>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start relative">
          
          {/* Mobile Filter Backdrop */}
          {showMobileFilters && (
             <div 
               className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] animate-fade-in" 
               onClick={() => setShowMobileFilters(false)}
             />
          )}

          {/* Sidebar - Desktop Sticky / Mobile Drawer */}
          <aside className={`
            lg:w-64 shrink-0 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2 custom-scrollbar
            fixed inset-y-0 left-0 w-4/5 max-w-[300px] z-[100] bg-white transition-transform duration-500 lg:static lg:bg-transparent lg:z-0 lg:block lg:translate-x-0 h-full
            ${showMobileFilters ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
            overflow-y-auto
          `}>
             {/* Mobile Close Header */}
             <div className="lg:hidden flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-20">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#000000]">Filters</h3>
                <button onClick={() => setShowMobileFilters(false)} className="text-gray-400 hover:text-black transition-colors p-2">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
             </div>

             <div className="lg:p-0 p-6 space-y-6">
                {/* Category filter */}
                <div className="lg:bg-gray-50 p-6 pt-4 lg:border lg:border-gray-100 lg:shadow-sm relative overflow-hidden rounded-sm bg-white border-0 shadow-none">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                      <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-black flex-shrink-0">Refine by</h3>
                      {urlCategory || maxPrice || selectedColors.length > 0 || selectedSizes.length > 0 ? (
                          <button onClick={clearFilters}
                            className="text-[10px] font-bold uppercase tracking-widest text-black hover:text-gray-400 transition-colors flex-shrink-0">
                            Reset
                          </button>
                      ) : null}
                    </div>

                <div className="space-y-6">
                  <div>
                    <button 
                      onClick={() => toggleFilterSection('category')}
                      className="flex items-center justify-between w-full mb-6 pb-4 border-b border-gray-200 hover:text-gray-600 transition-colors"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">Category</p>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${expandedFilters.category ? 'rotate-180' : ''}`}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {expandedFilters.category && (
                    <ul className="space-y-1 animate-in fade-in duration-200">
                      {/* "All" option */}
                      <li>
                        <button
                          onClick={() => handleCategoryClick('')}
                            className={`group flex items-center justify-between w-full py-2 px-4 text-[11px] font-bold tracking-widest transition-all rounded-sm
                            ${!urlCategory ? 'bg-white text-black shadow-sm border border-gray-100' : 'text-black hover:text-gray-400'}`}
                        >
                          ALL PIECES
                          {!urlCategory && <span className="w-1 h-1 rounded-full bg-black" />}
                        </button>
                      </li>
                      {/* Dynamic categories from DB */}
                      {categories.map(cat => {
                        const catName = typeof cat.name === 'string' ? cat.name : '';
                        return (
                          <li key={catName} className="space-y-1">
                            <button
                              onClick={() => { handleCategoryClick(catName); toggleExpand(catName); }}
                              className={`group flex items-center justify-between w-full py-1.5 px-4 text-[11px] font-bold tracking-widest transition-all rounded-sm
                              ${urlCategory.toLowerCase() === catName.toLowerCase() ? 'bg-white text-black shadow-sm border border-gray-100' : 'text-black hover:text-gray-400'}`}
                            >
                              <div className="flex-1 flex items-center gap-2 uppercase text-left">
                                {urlCategory.toLowerCase() === catName.toLowerCase() && <span className="w-1 h-1 rounded-full bg-black" />}
                                {catName}
                              </div>
                              {cat.subcategories && cat.subcategories.length > 0 && (
                                <div className="p-1 flex items-center justify-center">
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-300 ${expandedCats.includes(catName.toLowerCase()) ? 'rotate-90' : ''}`}>
                                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              )}
                            </button>
                            
                            {/* Subcategories (show based on manual expanded state) */}
                            {expandedCats.includes(catName.toLowerCase()) && cat.subcategories && cat.subcategories.length > 0 && (
                              <div className="pl-4 py-2 space-y-1 mt-1 border-l-2 border-gray-100 ml-4 animate-slide-down">
                                {cat.subcategories.map(sub => {
                                  const subName = typeof sub === 'string' ? sub : (sub?.name || '');
                                  return (
                                    <button
                                      key={subName}
                                      onClick={() => handleSubcategoryClick(subName)}
                                    className={`block w-full text-left py-1 px-3 text-[9px] uppercase tracking-[0.2em] font-medium transition-all
                                        ${urlSubcategory.toLowerCase() === subName.toLowerCase() ? 'text-black font-bold' : 'text-black hover:text-gray-400'}`}
                                    >
                                      {subName}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    )}
                  </div>

                  <div>
                    <button 
                      onClick={() => toggleFilterSection('price')}
                      className="flex items-center justify-between w-full mb-6 pb-4 border-b border-gray-200 hover:text-gray-600 transition-colors"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">Price Range</p>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${expandedFilters.price ? 'rotate-180' : ''}`}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {expandedFilters.price && (
                    <div className="animate-in fade-in duration-200">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold text-gray-900 tracking-tight">{maxPrice ? `${currencySymbol}${Number(maxPrice).toLocaleString()}` : 'Maximum'}</span>
                      </div>
                      <div className="px-1">
                        <input
                          type="range" min={priceMin} max={priceMax} step={priceStep}
                          value={maxPrice || priceMax}
                        onChange={e => { setMaxPrice(e.target.value); handlePageChange(1); }}
                        className="w-full h-1 bg-gray-200 accent-black appearance-none cursor-pointer rounded-full"
                      />
                      </div>
                    </div>
                    )}
                  </div>

                  {/* COLOR FILTER */}
                  {availableColors.length > 0 && (
                    <div>
                      <button 
                        onClick={() => toggleFilterSection('color')}
                        className="flex items-center justify-between w-full mb-4 pb-4 border-b border-gray-200 hover:text-gray-600 transition-colors"
                      >
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">Color</p>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${expandedFilters.color ? 'rotate-180' : ''}`}>
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {expandedFilters.color && (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        {availableColors.map(color => (
                          <label key={color} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedColors.includes(color)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedColors([...selectedColors, color]);
                                } else {
                                  setSelectedColors(selectedColors.filter(c => c !== color));
                                }
                                handlePageChange(1);
                              }}
                              className="w-4 h-4 accent-black cursor-pointer"
                            />
                            <span className="text-[10px] text-gray-700 group-hover:text-black transition-colors">{color}</span>
                          </label>
                        ))}
                      </div>
                      )}
                    </div>
                  )}

                  {/* SIZE FILTER */}
                  {availableSizes.length > 0 && (
                    <div>
                      <button 
                        onClick={() => toggleFilterSection('size')}
                        className="flex items-center justify-between w-full mb-4 pb-4 border-b border-gray-200 hover:text-gray-600 transition-colors"
                      >
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">Size</p>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${expandedFilters.size ? 'rotate-180' : ''}`}>
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {expandedFilters.size && (
                      <div className="flex gap-2 flex-wrap animate-in fade-in duration-200">
                        {availableSizes.map(size => (
                          <button
                            key={size}
                            onClick={() => {
                              if (selectedSizes.includes(size)) {
                                setSelectedSizes(selectedSizes.filter(s => s !== size));
                              } else {
                                setSelectedSizes([...selectedSizes, size]);
                              }
                              handlePageChange(1);
                            }}
                            className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border rounded transition-all ${
                              selectedSizes.includes(size)
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-black border-gray-200 hover:border-black'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      )}
                    </div>
                  )}

                  {/* MATERIAL FILTER */}
                  {availableMaterials.length > 0 && (
                    <div>
                      <button 
                        onClick={() => toggleFilterSection('material')}
                        className="flex items-center justify-between w-full mb-4 pb-4 border-b border-gray-200 hover:text-gray-600 transition-colors"
                      >
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">Material</p>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${expandedFilters.material ? 'rotate-180' : ''}`}>
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {expandedFilters.material && (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        {availableMaterials.map(material => (
                          <label key={material} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedMaterials.includes(material)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMaterials([...selectedMaterials, material]);
                                } else {
                                  setSelectedMaterials(selectedMaterials.filter(m => m !== material));
                                }
                                handlePageChange(1);
                              }}
                              className="w-4 h-4 accent-black cursor-pointer"
                            />
                            <span className="text-[10px] text-gray-700 group-hover:text-black transition-colors">{material}</span>
                          </label>
                        ))}
                      </div>
                      )}
                    </div>
                  )}

                  {/* STYLE FILTER */}
                  {availableStyles.length > 0 && (
                    <div>
                      <button 
                        onClick={() => toggleFilterSection('style')}
                        className="flex items-center justify-between w-full mb-4 pb-4 border-b border-gray-200 hover:text-gray-600 transition-colors"
                      >
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">Style</p>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${expandedFilters.style ? 'rotate-180' : ''}`}>
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {expandedFilters.style && (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        {availableStyles.map(style => (
                          <label key={style} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedStyles.includes(style)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStyles([...selectedStyles, style]);
                                } else {
                                  setSelectedStyles(selectedStyles.filter(st => st !== style));
                                }
                                handlePageChange(1);
                              }}
                              className="w-4 h-4 accent-black cursor-pointer"
                            />
                            <span className="text-[10px] text-gray-700 group-hover:text-black transition-colors">{style}</span>
                          </label>
                        ))}
                      </div>
                      )}
                    </div>
                  )}

                  {/* RATING FILTER */}
                  <div>
                    <button 
                      onClick={() => toggleFilterSection('rating')}
                      className="flex items-center justify-between w-full mb-4 pb-4 border-b border-gray-200 hover:text-gray-600 transition-colors"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">Rating</p>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${expandedFilters.rating ? 'rotate-180' : ''}`}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {expandedFilters.rating && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      {[
                        { value: 0, label: 'All Ratings' },
                        { value: 4, label: '★★★★ & Up' },
                        { value: 3, label: '★★★ & Up' },
                        { value: 2, label: '★★ & Up' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="rating"
                            checked={minRating === option.value}
                            onChange={() => {
                              setMinRating(option.value);
                              handlePageChange(1);
                            }}
                            className="w-4 h-4 accent-black cursor-pointer"
                          />
                          <span className="text-[10px] text-gray-700 group-hover:text-black transition-colors">{option.label}</span>
                        </label>
                      ))}
                    </div>
                    )}
                  </div>

                  {/* IN STOCK FILTER */}
                  <div>
                    <button 
                      onClick={() => toggleFilterSection('stock')}
                      className="flex items-center justify-between w-full mb-4 pb-4 border-b border-gray-200 hover:text-gray-600 transition-colors"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">Availability</p>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${expandedFilters.stock ? 'rotate-180' : ''}`}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {expandedFilters.stock && (
                    <label className="flex items-center gap-3 cursor-pointer group animate-in fade-in duration-200">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => {
                          setInStockOnly(e.target.checked);
                          handlePageChange(1);
                        }}
                        className="w-4 h-4 accent-black cursor-pointer"
                      />
                      <span className="text-[10px] font-medium text-gray-700 group-hover:text-black transition-colors">In Stock Only</span>
                    </label>
                    )}
                  </div>

                  <div>
                    <button 
                      onClick={() => toggleFilterSection('sort')}
                      className="flex items-center justify-between w-full mb-4 pb-4 border-b border-gray-200 hover:text-gray-600 transition-colors"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">Sort by Selection</p>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${expandedFilters.sort ? 'rotate-180' : ''}`}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {expandedFilters.sort && (
                    <div className="px-0 animate-in fade-in duration-200">
                      <select
                        value={sort}
                        onChange={e => { setSort(e.target.value); handlePageChange(1); }}
                        className="w-full text-[10px] uppercase tracking-widest font-bold text-gray-900 border border-gray-200 px-4 py-3 bg-white outline-none focus:border-black transition-all cursor-pointer rounded-sm"
                      >
                        <option value="newest">Recent Items</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="rating">Top Rated</option>
                        <option value="name_asc">Alphabetical: A to Z</option>
                        <option value="name_desc">Alphabetical: Z to A</option>
                      </select>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

          {/* ── Product Grid ─────────────────────────────────────────────── */}
          <div className="flex-1 w-full">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-gray-50/50 p-4 sm:p-6 border border-gray-100 rounded-xl">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {loading ? 'Sourcing catalog...' : (
                  <>Displaying <span className="text-gray-900">{total}</span> masterworks</>
                )}
              </p>
              
              {/* Mobile Filter Toggle */}
              <button 
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:border-black transition-all shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16m-7 6h7" /></svg>
                Filter & Sort
              </button>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-10">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 sm:py-32 bg-gray-50 border border-gray-100 shadow-sm relative overflow-hidden rounded-xl">
                <div className="relative z-10 px-6">
                  <div className="mb-8 mx-auto w-12 h-12 bg-white border border-gray-100 flex items-center justify-center rounded-full shadow-sm">
                    <span className="text-xl text-gray-200">✧</span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-serif font-bold text-gray-900 mb-4 tracking-tight">No Items Found</h3>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-10 max-w-xs mx-auto leading-loose italic">
                    We couldn't locate any pieces matching your current filters.
                  </p>
                  <button onClick={clearFilters} className="btn-primary">
                    View Entire Collection
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-10 gap-y-8 sm:gap-y-12">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-12 sm:mt-20 border-t border-gray-100 pt-8 sm:pt-12">
                <button onClick={() => handlePageChange(Math.max(1, urlPage - 1))}
                  disabled={urlPage === 1}
                  className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center border border-gray-200 hover:border-gray-900 text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-all group rounded-lg">
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                </button>
 
                <div className="flex gap-2 sm:gap-4 overflow-x-auto px-2 max-w-[200px] sm:max-w-none no-scrollbar">
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => handlePageChange(p)}
                      className={`w-10 h-10 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center text-[9px] sm:text-[10px] font-bold tracking-widest transition-all rounded-lg
                        ${urlPage === p ? 'bg-black text-white shadow-xl' : 'bg-gray-50 text-gray-400 hover:text-gray-900 border border-gray-100'}`}>
                      {p < 10 ? `0${p}` : p}
                    </button>
                  ))}
                </div>
 
                <button onClick={() => handlePageChange(Math.min(pages, urlPage + 1))}
                  disabled={urlPage === pages}
                  className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center border border-gray-200 hover:border-gray-900 text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-all group rounded-lg">
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

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import API from '../api';
import ProductCard from '../components/ProductCard';
import { useCurrency } from '../context/CurrencyContext';
import { ProductSkeleton } from '../components/Skeleton';
import { useShop } from '../context/ShopContext';

const CATEGORY_ORDER = ['Women', 'Men', 'Kids', 'Shoes'];

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
  const urlLabel = searchParams.get('label') || '';
  const urlSearch = searchParams.get('search') || '';
  const urlPage = parseInt(searchParams.get('page')) || 1;

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

  const { categories, getFullImgUrl, settings } = useShop();
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
    stock: true,
    label: true
  });


  const priceMax = country === 'US' ? 200 : 10000;
  const priceStep = country === 'US' ? 5 : 100;
  const priceMin = country === 'US' ? 5 : 100;

  const fetchProducts = useCallback(() => {
    const params = new URLSearchParams();
    if (urlCategory) params.set('category', urlCategory);
    if (urlSubcategory) params.set('subcategory', urlSubcategory);
    if (urlLabel) params.set('label', urlLabel);
    if (urlSearch) params.set('search', urlSearch);
    if (maxPrice) params.set('maxPrice', maxPrice);
    params.set('sort', sort);
    params.set('page', urlPage);
    params.set('limit', 100);

    setLoading(true);
    API.get(`/products?${params.toString()}`)
      .then(r => {
        let realProducts = r.data.products || [];
        let combined = [...realProducts];

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

        if (sort === 'price_asc') combined.sort((a,b) => (a.price||0)-(b.price||0));
        else if (sort === 'price_desc') combined.sort((a,b) => (b.price||0)-(a.price||0));
        else if (sort === 'rating') combined.sort((a,b) => (b.rating||Math.random()*5)-(a.rating||Math.random()*5));
        else if (sort === 'name_asc') combined.sort((a,b) => (a.name||'').localeCompare(b.name||''));
        else if (sort === 'name_desc') combined.sort((a,b) => (b.name||'').localeCompare(a.name||''));

        setProducts(combined);
        setTotal(r.data.total || combined.length);
        setPages(r.data.pages || Math.ceil(combined.length / 100));
      })
      .catch(() => {
        const localData = localStorage.getItem('thaarai_local_products');
        const localProducts = localData ? JSON.parse(localData) : [];
        const activeCategory = normalizeCategory(urlCategory);
        const activeSub = (urlSubcategory || '').toLowerCase();

        const filteredLocals = localProducts.filter(lp => {
          const matchesCat = !activeCategory || normalizeCategory(lp.category).toLowerCase() === activeCategory.toLowerCase();
          const matchesSub = !activeSub || (lp.subcategory || '').toLowerCase() === activeSub;
          const matchesSearch = !urlSearch || lp.name.toLowerCase().includes(urlSearch.toLowerCase());
          return matchesCat && matchesSub && matchesSearch;
        });
        const combined = [...filteredLocals];

        if (sort === 'price_asc') combined.sort((a,b) => (a.price||0)-(b.price||0));
        else if (sort === 'price_desc') combined.sort((a,b) => (b.price||0)-(a.price||0));
        else if (sort === 'rating') combined.sort((a,b) => (b.rating||Math.random()*5)-(a.rating||Math.random()*5));
        else if (sort === 'name_asc') combined.sort((a,b) => (a.name||'').localeCompare(b.name||''));
        else if (sort === 'name_desc') combined.sort((a,b) => (b.name||'').localeCompare(a.name||''));

        setProducts(combined);
        setTotal(combined.length);
        setPages(Math.ceil(combined.length / 100));
      })
      .finally(() => setLoading(false));
  }, [urlCategory, urlSubcategory, urlLabel, urlSearch, urlPage, maxPrice, sort, selectedColors, selectedSizes, selectedMaterials, selectedStyles, minRating, inStockOnly, country, normalizeCategory]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    if (showMobileFilters) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showMobileFilters]);

  const handleCategoryClick = (catName) => {
    const params = new URLSearchParams(searchParams);
    if (!catName) params.delete('category');
    else params.set('category', catName);
    params.delete('subcategory');
    params.set('page', '1');
    navigate(`/collection?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExpand = (catName) => {
    const name = catName.toLowerCase();
    setExpandedCats(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const handleSubcategoryClick = (subName) => {
    const params = new URLSearchParams(searchParams);
    if (!subName || urlSubcategory.toLowerCase() === subName.toLowerCase()) params.delete('subcategory');
    else params.set('subcategory', subName);
    params.set('page', '1');
    navigate(`/collection?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLabelClick = (labelName) => {
    const params = new URLSearchParams(searchParams);
    if (!labelName || urlLabel === labelName) params.delete('label');
    else params.set('label', labelName);
    params.set('page', '1');
    navigate(`/collection?${params.toString()}`);
  };

  const handlePageChange = (newPage, scrollToTop = false) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    navigate(`/collection?${params.toString()}`);
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleFilterSection = (filterName) => {
    setExpandedFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
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

  const getCategoryBanner = () => {
    // 1. Try to find the specific sub-category banner from cloud
    if (urlCategory && urlSubcategory) {
      const cat = categories.find(c => c.name.toLowerCase() === urlCategory.toLowerCase());
      if (cat && cat.subcategories) {
        const sub = cat.subcategories.find(s => {
          const sName = typeof s === 'string' ? s : s.name;
          return sName.toLowerCase() === urlSubcategory.toLowerCase();
        });
        if (sub && typeof sub !== 'string' && sub.banner) {
          return `${API.defaults.baseURL.replace('/api', '')}/${sub.banner.replace(/^\//, '')}`;
        }
      }
    }

    // 2. Try the parent category banner from cloud
    if (urlCategory) {
      const cat = categories.find(c => c.name.toLowerCase() === urlCategory.toLowerCase());
      if (cat && cat.banner) {
        return `${API.defaults.baseURL.replace('/api', '')}/${cat.banner.replace(/^\//, '')}`;
      }
    }

    // 3. Global Banner Fallback from cloud settings only
    if (settings?.bannerFallback) {
      return `${API.defaults.baseURL.replace('/api', '')}/${settings.bannerFallback.replace(/^\//, '')}`;
    }

    // No local fallback - cloud banners only
    return null;
  };
  return (
    <div className="bg-white min-h-screen text-gray-900">
      {/* Category Banner - Cloud sourced only */}
      {getCategoryBanner() && (
        <div className="relative w-full bg-[#fbfbfb] pt-0">
          <img 
            src={getCategoryBanner()} 
            alt={urlCategory || 'All Pieces'}
            className="w-full aspect-[21/9] object-cover block transition-all duration-700"
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pt-2 pb-12">
        {/* Breadcrumb - Minimalist Style */}
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-3">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <span className="text-gray-200">/</span>
          {urlCategory && !urlSearch ? (
            <>
              <span className="hover:text-black cursor-default">Collection</span>
              <span className="text-gray-200">/</span>
              <span className="text-black">{pageTitle}</span>
            </>
          ) : (
            <span className="text-black">{pageTitle}</span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start relative">
          
          {/* Mobile Filter Backdrop */}
          {showMobileFilters && (
             <div 
               className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] animate-fade-in" 
               onClick={() => setShowMobileFilters(false)}
             />
          )}

          {/* Sidebar - Desktop Sticky / Mobile Drawer */}
          <aside className={`
            lg:w-64 shrink-0 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2 custom-scrollbar
            fixed top-0 bottom-0 left-0 w-[85%] max-w-[340px] z-[120] bg-white transition-transform duration-500 
            lg:static lg:bg-transparent lg:z-0 lg:translate-x-0 flex flex-col h-[100dvh] lg:h-auto
            ${showMobileFilters ? 'translate-x-0 shadow-[20px_0_100px_rgba(0,0,0,0.2)]' : '-translate-x-full'}
          `}>
             {/* Mobile Drawer Header */}
             <div className="lg:hidden flex items-center justify-between px-8 py-7 border-b border-gray-100 bg-white sticky top-0 z-20 shrink-0">
                <div className="flex flex-col gap-1">
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.2em] text-black">Filters</h3>
                  <button onClick={clearFilters} className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors w-fit">
                    Clear All
                  </button>
                </div>
                <button onClick={() => setShowMobileFilters(false)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-black hover:bg-gray-100 transition-all">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
             </div>

             <div className="lg:p-0 p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar bg-white pb-20">
                {/* Category filter */}
                <div className="lg:bg-gray-50 lg:p-6 lg:pt-4 lg:border lg:border-gray-100 lg:shadow-sm relative overflow-hidden rounded-sm bg-white border-0 shadow-none">
                  <div className="relative z-10">
                    <div className="hidden lg:flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black flex-shrink-0">Refine by</h3>
                      {urlCategory || maxPrice || selectedColors.length > 0 || selectedSizes.length > 0 ? (
                          <button onClick={clearFilters}
                            className="text-[9px] font-bold uppercase tracking-widest text-black hover:text-gray-400 transition-colors flex-shrink-0">
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
                                {/* ── ALL (top) ── */}
                                <button
                                  onClick={() => handleSubcategoryClick('')}
                                  className={`relative flex items-center gap-2 w-full text-left py-1.5 px-3 text-[9px] uppercase tracking-[0.2em] transition-all
                                    ${!urlSubcategory && urlCategory.toLowerCase() === catName.toLowerCase()
                                      ? 'text-black font-black'
                                      : 'text-gray-500 hover:text-black'}`}
                                >
                                  {!urlSubcategory && urlCategory.toLowerCase() === catName.toLowerCase() && (
                                    <span className="w-1 h-1 rounded-full bg-black shadow-sm" />
                                  )}
                                  All {catName}
                                </button>
                                {/* ── individual subs ── */}
                                {cat.subcategories.map(sub => {
                                  const subName = typeof sub === 'string' ? sub : (sub?.name || '');
                                  return (
                                    <button
                                      key={subName}
                                      onClick={() => handleSubcategoryClick(subName)}
                                      className={`relative block w-full text-left py-1.5 px-3 text-[9px] uppercase tracking-[0.2em] transition-all
                                          ${urlSubcategory.toLowerCase() === subName.toLowerCase() ? 'text-black font-black' : 'text-gray-500 hover:text-black'}`}
                                      >
                                        <div className="flex items-center gap-2">
                                          {urlSubcategory.toLowerCase() === subName.toLowerCase() && <span className="w-1 h-1 rounded-full bg-black shadow-sm" />}
                                          {subName}
                                        </div>
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
                      <div className="flex items-center gap-1 mb-6">
                        <span className="text-sm font-bold text-gray-900 tracking-tight">{currencySymbol}{priceMin.toLocaleString()}</span>
                        <span className="text-sm font-bold text-gray-900 tracking-tight">-</span>
                        <span className="text-sm font-bold text-gray-900 tracking-tight">{maxPrice ? `${currencySymbol}${Number(maxPrice).toLocaleString()}` : `${currencySymbol}${priceMax.toLocaleString()}`}</span>
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

                  {/* LABEL FILTER */}
                  <div>
                    <button 
                      onClick={() => toggleFilterSection('label')}
                      className="flex items-center justify-between w-full mb-4 pb-4 border-b border-gray-200 hover:text-gray-600 transition-colors"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">Status & Labels</p>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${expandedFilters.label ? 'rotate-180' : ''}`}>
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {expandedFilters.label && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      {[
                        { id: 'Hot', label: '🔥 Hot Items' },
                        { id: 'New Arrival', label: '✨ New Arrivals' },
                        { id: 'Trending', label: '⚡ Trending Now' },
                        { id: 'Sold Out', label: '✕ Sold Out' }
                      ].map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleLabelClick(item.id)}
                          className={`flex items-center gap-3 w-full group py-0.5`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${urlLabel === item.id ? 'bg-black border-black' : 'border-gray-300 group-hover:border-black'}`}>
                            {urlLabel === item.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${urlLabel === item.id ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
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
            <div className="sticky top-[64px] sm:static z-40 mb-4 bg-white sm:bg-gray-50/50 -mx-6 sm:mx-0 border-y sm:border sm:rounded-xl border-gray-100 transition-all duration-300 shadow-sm sm:shadow-none">
              <div className="flex lg:hidden">
                <button 
                  onClick={() => setShowMobileFilters(true)}
                  className="flex-1 py-3 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-black active:bg-gray-50 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16m-7 6h7" /></svg>
                  Filter
                </button>
              </div>
              
              <div className="hidden lg:flex items-center justify-between p-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                  {loading ? 'Sourcing catalog...' : (
                    <>Displaying <span className="text-gray-900">{total}</span> masterworks</>
                  )}
                </p>
              </div>
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
                <button onClick={() => handlePageChange(Math.max(1, urlPage - 1), true)}
                  disabled={urlPage === 1}
                  className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center border border-gray-200 hover:border-gray-900 text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-all group rounded-lg">
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                </button>
 
                <div className="flex gap-2 sm:gap-4 overflow-x-auto px-2 max-w-[200px] sm:max-w-none no-scrollbar">
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => handlePageChange(p, true)}
                      className={`w-10 h-10 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center text-[9px] sm:text-[10px] font-bold tracking-widest transition-all rounded-lg
                        ${urlPage === p ? 'bg-black text-white shadow-xl' : 'bg-gray-50 text-gray-400 hover:text-gray-900 border border-gray-100'}`}>
                      {p < 10 ? `0${p}` : p}
                    </button>
                  ))}
                </div>
 
                <button onClick={() => handlePageChange(Math.min(pages, urlPage + 1), true)}
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

import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useCurrency } from '../context/CurrencyContext';
import { getProductPrice } from '../utils/priceUtils';
import API from '../api';
import CountrySwitcher from './CountrySwitcher';
import AuthDrawer from './AuthDrawer';
import LogoutConfirmModal from './LogoutConfirmModal';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const WishlistIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.89-8.89 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

export default function Navbar() {
  const { cartCount, user, logout, wishlist, products, categories, BACKEND_URL } = useShop();
  const wishlistCount = products.filter(p => wishlist.includes(p._id)).length;
  const { formatPrice, country, currency, currencySymbol } = useCurrency();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeCoupons, setActiveCoupons] = useState([]);

  useEffect(() => {
    API.get('/coupons/active').then(res => {
      if (res.data?.success) setActiveCoupons(res.data.coupons);
    }).catch(() => {});
  }, []);

  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const scrollPosRef = useRef(window.scrollY);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  // Extract Categories and Subcategories for the sidebar (Now using the master Category list from DB)
  const categoriesList = categories.map(cat => ({
    name: cat.name,
    subs: (cat.subcategories || []).map(sub => typeof sub === 'string' ? sub : sub?.name || '')
  }));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, products]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/collection', label: 'Shop' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/collection?search=${searchQuery}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-gray-100 ${scrolled
          ? 'bg-white shadow-lg'
          : 'bg-white'
          }`}
      >
        <div className={`py-2 px-4 text-center bg-[#FFDAB9] ${location.pathname.includes('/collection') ? 'hidden sm:block' : ''}`}>
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-black">
            {activeCoupons.length > 0 ? (
               <span>
                 HOT OFFER: USE CODE <span className="underline font-black px-1">{activeCoupons[0].code}</span> 
                 {activeCoupons[0].title ? ` - ${activeCoupons[0].title}` : ` FOR ${activeCoupons[0].discountType === 'percentage' ? activeCoupons[0].discountValue + '%' : currencySymbol + (country === 'US' ? (activeCoupons[0].discountValueUSD || activeCoupons[0].discountValue) : activeCoupons[0].discountValue)} OFF`}
                 &nbsp;·&nbsp;
                 FREE SHIPPING OVER {currencySymbol}{country === 'US' ? '50' : '500'}
               </span>
            ) : (
               `Fashion Frenzy: Up to 60% off on all styles · Free Shipping Over ${currencySymbol}${country === 'US' ? '50' : '500'}`
            )}
          </p>
        </div>

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 transition-all duration-300 relative ${scrolled ? 'h-16' : 'h-20'}`}>
          {/* Left: Hamburger Menu (Shop) */}
          <div className="flex items-center lg:w-1/3">
            <button
              className="flex items-center gap-2 group p-2 px-0"
              onClick={() => setMobileOpen(true)}
            >
              <div className="flex flex-col gap-1 w-5">
                <span className="h-[1.5px] w-full bg-gray-900"></span>
                <span className="h-[1.5px] w-3/4 bg-gray-900 group-hover:w-full transition-all"></span>
                <span className="h-[1.5px] w-full bg-gray-900"></span>
              </div>
              <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-[0.2em] text-gray-900">Shop</span>
            </button>
          </div>

          {/* Center: Logo */}
          <div className="absolute lg:static left-1/2 lg:left-auto lg:transform-none -translate-x-1/2 lg:translate-x-0 flex justify-center z-10 lg:w-1/3">
            <Link to="/" className="shrink-0 flex items-center">
              <img
                src="/tharrai-logo.png"
                alt="Thaarai"
                className="h-10 sm:h-14 w-auto object-contain py-1 block"
                onError={(e) => {
                   console.log('Logo failed to load', e); 
                   e.target.style.display = 'none';
                }}
              />
              <span className="lg:hidden text-lg font-serif font-bold tracking-tighter" style={{ display: 'none' }}>THAARAI</span>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-1 lg:w-1/3">
            {/* Search */}
            <div ref={searchRef} className="flex items-center relative gap-1">
              {/* Desktop Search Bar (Inline) */}
              <div className={`hidden lg:flex transition-all duration-300 overflow-hidden items-center border-b border-gray-200 ${searchOpen ? 'w-64 opacity-100 py-1 mr-2' : 'w-0 opacity-0 p-0 mr-0 border-transparent'}`}>
                <form onSubmit={handleSearch} className="w-full flex items-center gap-2">
                  <input
                    autoFocus={searchOpen}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="SEARCH"
                    className="w-full text-[10px] font-bold tracking-widest text-gray-900 placeholder-gray-400 outline-none bg-transparent uppercase"
                  />
                </form>
              </div>

              {/* Mobile Search Overlay */}
              <div className={`lg:hidden fixed inset-x-0 bg-white border-b border-gray-100 px-4 py-3 z-[60] transition-all duration-300 transform ${searchOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`} style={{ top: scrolled ? '65px' : '90px' }}>
                <form onSubmit={handleSearch} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100 shadow-sm">
                   <div className="text-gray-400 scale-75"><SearchIcon /></div>
                   <input
                     autoFocus={searchOpen}
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     placeholder="SEARCH OUR COLLECTION"
                     className="flex-1 text-[11px] font-bold tracking-widest text-gray-900 placeholder-gray-400 outline-none bg-transparent uppercase"
                   />
                   <button 
                     type="button" 
                     onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                     className="text-gray-400 text-[9px] font-bold uppercase tracking-widest px-2"
                   >
                     CLOSE
                   </button>
                </form>

                {/* Mobile Search Results Dropdown */}
                {searchQuery.length > 0 && products.filter(p => !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                   <div className="mt-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in max-h-[60vh] overflow-y-auto">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#000000] px-4 py-3 bg-gray-50/50 border-b border-gray-50">Results for "{searchQuery}"</p>
                      {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                         <div
                           key={p._id}
                           onClick={() => { navigate(`/product/${p._id}`); setSearchOpen(false); setSearchQuery(''); }}
                           className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0 cursor-pointer"
                         >
                           <div className="w-12 h-12 bg-gray-100 overflow-hidden rounded-xl shrink-0 border border-gray-100">
                             <img
                               src={p.images?.[0]?.startsWith('http') ? p.images[0] : `${BACKEND_URL}${p.images?.[0]}`}
                               alt={p.name}
                               className="w-full h-full object-cover"
                               onError={e => { e.target.src = '/tharrai-logo.png'; }}
                             />
                           </div>
                           <div className="flex-1">
                             <h4 className="text-xs font-bold text-black uppercase tracking-tight">{p.name}</h4>
                             <p className="text-[9px] text-gray-500 mt-0.5 font-bold uppercase tracking-widest">{p.category}</p>
                           </div>
                           <p className="text-xs font-bold text-gray-900">{currencySymbol}{p.price}</p>
                         </div>
                      ))}
                      <button 
                        onClick={() => { handleSearch(); setSearchOpen(false); }}
                        className="w-full p-4 text-[10px] font-bold uppercase tracking-widest text-center bg-black text-white hover:bg-gray-900 transition-colors"
                      >
                        View All Results
                      </button>
                   </div>
                )}
              </div>

              <button
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  if (searchOpen) setSearchQuery('');
                }}
                className={`p-2.5 transition-all ${searchOpen ? 'text-gray-900' : 'text-gray-900 hover:opacity-60'}`}
              >
                <SearchIcon />
              </button>

              {/* Live Inline Search Results Dropdown (Desktop Only) */}
              {searchOpen && (
                <div className="hidden lg:block absolute top-[110%] right-0 w-[460px] bg-white border border-gray-100 shadow-2xl rounded-2xl animate-fade-in overflow-hidden z-[100] mt-2">
                  {searchQuery.length <= 1 ? (
                    <div className="p-4 flex flex-col gap-2 bg-gray-50/30">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#000000] px-2 py-1 mb-1">Suggested for you</p>
                      {products.slice(0, 3).map(p => (
                        <div
                          key={p._id}
                          onClick={() => { navigate(`/product/${p._id}`); setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-4 group p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100 cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-gray-100 overflow-hidden rounded-full shrink-0 shadow-sm border border-gray-100">
                            <img
                              src={p.images?.[0]?.startsWith('http') ? p.images[0] : `${BACKEND_URL}${p.images?.[0]}`}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={e => { e.target.src = '/tharrai-logo.png'; }}
                            />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-black hover-underline">{p.name}</h4>
                            <p className="text-[9px] text-gray-500 mt-0.5">{p.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-4 flex flex-col gap-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 px-2 py-1">Products</p>
                      {searchResults.map(p => (
                        <div
                          key={p._id}
                          onClick={() => { navigate(`/product/${p._id}`); setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-4 group p-2 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                        >
                          <div className="w-12 h-16 bg-gray-100 overflow-hidden rounded-md shrink-0 shadow-sm border border-gray-100">
                            <img
                              src={p.images?.[0]?.startsWith('http') ? p.images[0] : `${BACKEND_URL}${p.images?.[0]}`}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={e => { e.target.src = '/tharrai-logo.png'; }}
                            />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-black hover-underline">{p.name}</h4>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">{p.category}</p>
                            <p className="text-[11px] font-semibold text-black mt-1">{formatPrice(getProductPrice(p, country))}</p>
                          </div>
                        </div>
                      ))}
                      <button onClick={handleSearch} className="mt-2 w-full py-3 text-[10px] font-bold uppercase tracking-widest bg-black text-white transition-colors">
                        View All Results
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-gray-50/50">
                      <p className="text-gray-500 italic text-xs">No exact matches found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Icon -> Auth Drawer */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setAuthDrawerOpen(true)}
                className="p-2.5 text-gray-900 hover:opacity-60 transition-all"
              >
                <UserIcon />
              </button>
            </div>

            {/* Country Switcher (Visible on both mobile and desktop) */}
            <div className="flex items-center">
              <CountrySwitcher />
            </div>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative hidden sm:block p-2.5 text-gray-900 transition-all hover:opacity-60">
              <WishlistIcon />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-lg animate-pulse-subtle bg-red-500">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative hidden sm:block p-2.5 text-gray-900 hover:opacity-60 transition-all">
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu removed to keep only left side toggle */}
          </div>
        </div>
      </header>

      {/* Shop / Mobile Nav Drawer */}
      <div className={`fixed inset-0 z-[9999] transition-all duration-500 ${mobileOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-500 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div className={`absolute top-0 left-0 w-full sm:w-[450px] h-[100dvh] bg-white shadow-2xl flex flex-col transform transition-transform duration-500 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Drawer Header */}
          <div className="p-8 pb-4 flex items-center justify-between">
            <img src="/tharrai-logo.png" alt="Thaarai" className="h-8 w-auto object-contain" />
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 hover:opacity-50 transition-all border border-transparent"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Mobile Country/Currency Picker */}
          <div className="px-8 py-2 border-b border-gray-50 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Regional Settings</span>
            <CountrySwitcher />
          </div>

          <div className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar pb-20">
            {/* Search inside Drawer */}
            <div className="mb-10 relative">
              <form onSubmit={handleSearch} className="flex items-center gap-3 border-b border-gray-200 py-2">
                <SearchIcon />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="WHAT ARE YOU LOOKING FOR?"
                  className="w-full text-[10px] font-bold tracking-widest text-black placeholder-gray-300 outline-none uppercase"
                />
              </form>
            </div>

            {/* Structured Navigation */}
            <nav className="space-y-12">
              {/* Category Suggestions Section */}
              <div className="space-y-8">
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400">Shop by Category</p>
                <div className="grid grid-cols-1 gap-6">
                  {categoriesList.length > 0 ? categoriesList.map(cat => {
                    const isExpanded = expandedCategories[cat.name] ?? cat.subs.length === 0;
                    const toggleExpand = () => {
                      setExpandedCategories(prev => ({
                        ...prev,
                        [cat.name]: !prev[cat.name]
                      }));
                    };
                    return (
                    <div key={cat.name} className="group/cat">
                      <div className="flex items-center justify-between">
                        {cat.subs.length > 0 ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Link
                              to={`/collection?category=${cat.name}`}
                              onClick={() => setMobileOpen(false)}
                              className="text-sm font-bold tracking-widest text-black group-hover/cat:pl-1 transition-all flex-1"
                            >
                              {cat.name.toUpperCase()}
                            </Link>
                          </div>
                        ) : (
                          <Link
                            to={`/collection?category=${cat.name}`}
                            onClick={() => setMobileOpen(false)}
                            className="text-sm font-bold tracking-widest text-black flex-1 group-hover/cat:pl-1 transition-all"
                          >
                            {cat.name.toUpperCase()}
                          </Link>
                        )}
                        {cat.subs.length > 0 && (
                          <button
                            onClick={toggleExpand}
                            className="text-black hover:text-gray-600 transition-all p-1 flex-shrink-0"
                            aria-label="Toggle subcategories"
                          >
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            >
                              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {cat.subs.length > 0 && isExpanded && (
                        <div className="mt-4 flex flex-col gap-3 pl-1 border-l border-gray-100 ml-1">
                          {/* ── ALL subcategory link ── */}
                          <Link
                            to={`/collection?category=${cat.name}`}
                            onClick={() => setMobileOpen(false)}
                            className="text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5"
                            style={{ color: '#1a1a1a' }}
                          >
                            <span style={{ fontSize: '7px', letterSpacing: '0.15em', background: '#1a1a1a', color: '#fff', padding: '1px 5px', borderRadius: '2px' }}>ALL</span>
                            {cat.name}
                          </Link>
                          {/* ── individual sub-categories ── */}
                          {cat.subs.map(sub => {
                            const subName = typeof sub === 'string' ? sub : (sub?.name || '');
                            if (!subName) return null;
                            return (
                              <Link
                                key={subName}
                                to={`/collection?category=${cat.name}&subcategory=${subName}`}
                                onClick={() => setMobileOpen(false)}
                                className="text-[10px] font-medium tracking-widest text-gray-500 hover:text-black hover:translate-x-1 transition-all uppercase"
                              >
                                {subName}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                  }) : (
                    <>
                      <Link to="/collection" onClick={() => setMobileOpen(false)} className="text-sm font-bold tracking-widest text-black uppercase hover-underline">All Collections</Link>
                      <ul className="mt-4 flex flex-col gap-3 pl-1 border-l border-gray-100 ml-1">
                        <Link to="/collection?category=Women&subcategory=Kurti" onClick={() => setMobileOpen(false)} className="text-[10px] font-medium tracking-widest text-gray-500 hover:text-black hover:translate-x-1 transition-all uppercase">Kurtis</Link>
                        <Link to="/collection?category=Women&subcategory=Maxi" onClick={() => setMobileOpen(false)} className="text-[10px] font-medium tracking-widest text-gray-500 hover:text-black hover:translate-x-1 transition-all uppercase">Maxi Dresses</Link>
                        <Link to="/collection?category=Women&subcategory=Handbags" onClick={() => setMobileOpen(false)} className="text-[10px] font-medium tracking-widest text-gray-500 hover:text-black hover:translate-x-1 transition-all uppercase">Handbags</Link>
                        <Link to="/collection?category=Kids" onClick={() => setMobileOpen(false)} className="text-[10px] font-medium tracking-widest text-gray-500 hover:text-black hover:translate-x-1 transition-all uppercase">Kids Wear</Link>
                        <div className="pl-2 flex flex-col gap-2">
                           <Link to="/collection?category=Kids&subcategory=Boys" onClick={() => setMobileOpen(false)} className="text-[9px] font-light tracking-widest text-gray-400 hover:text-black transition-all uppercase">- Boys</Link>
                           <Link to="/collection?category=Kids&subcategory=Girls" onClick={() => setMobileOpen(false)} className="text-[9px] font-light tracking-widest text-gray-400 hover:text-black transition-all uppercase">- Girls</Link>
                        </div>
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Collections Highlight Section */}
              <div className="space-y-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400">Featured</p>
                <div className="space-y-4">
                  <Link to="/collection?label=New Arrival" onClick={() => setMobileOpen(false)} className="block group">
                    <p className="text-sm font-bold tracking-widest text-black uppercase group-hover:pl-1 transition-all">New Arrivals</p>
                    <p className="text-[9px] text-gray-400 tracking-widest uppercase mt-1">Explore our latest additions</p>
                  </Link>
                </div>
              </div>

              {/* Account / Support Section */}
              <div className="pt-8 border-t border-gray-100 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-4">Account</p>
                  <div className="space-y-3">
                    {user ? (
                      <button onClick={() => setShowLogoutModal(true)} className="text-[10px] font-bold tracking-[0.2em] uppercase text-black hover-underline block">Sign Out</button>
                    ) : (
                      <button onClick={() => { setAuthDrawerOpen(true); setMobileOpen(false); }} className="text-[10px] font-bold tracking-[0.2em] uppercase text-black hover-underline block">Sign In</button>
                    )}
                    <button onClick={() => { setAuthDrawerOpen(true); setMobileOpen(false); }} className="text-[10px] font-bold tracking-[0.2em] uppercase text-black hover-underline block text-left">Track Order</button>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-4">Support</p>
                  <div className="space-y-3">
                    <Link to="/contact" onClick={() => setMobileOpen(false)} className="text-[10px] font-bold tracking-[0.2em] uppercase text-black hover-underline block">Contact Us</Link>
                    <Link to="/about" onClick={() => setMobileOpen(false)} className="text-[10px] font-bold tracking-[0.2em] uppercase text-black hover-underline block">Our Story</Link>
                  </div>
                </div>
              </div>

              {/* Promotional Highlight Image */}
              <div className="pt-4">
                <Link to="/collection" onClick={() => setMobileOpen(false)} className="relative block h-40 overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=400&fit=crop"
                    alt="Promotional"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold uppercase tracking-[0.4em] border border-white px-6 py-2.5">Spring 2026</span>
                  </div>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <AuthDrawer isOpen={authDrawerOpen} onClose={() => setAuthDrawerOpen(false)} />
      <LogoutConfirmModal 
        isOpen={showLogoutModal} 
        onConfirm={() => {
          logout();
          navigate('/');
          setShowLogoutModal(false);
          setMobileOpen(false);
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
      <div className={`${scrolled ? (location.pathname.includes('/collection') ? 'h-[64px] sm:h-[65px]' : 'h-[65px]') : (location.pathname.includes('/collection') ? 'h-[80px] sm:h-[90px]' : 'h-[90px]')} transition-all duration-300`} />
    </>
  );
}

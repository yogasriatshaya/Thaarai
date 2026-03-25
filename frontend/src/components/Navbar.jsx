import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import logo from '../assets/logo.png';

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
  const { cartCount, user, logout, wishlist, products, BACKEND_URL } = useShop();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const scrollPosRef = useRef(window.scrollY);
  const searchRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserDropdown(false);
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
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/collection?search=${searchQuery}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white shadow-xl'
          : 'bg-[#fcfbf7] border-b border-gray-100'
          }`}
      >
        <div className="py-1 px-4 text-center" style={{ backgroundColor: '#aba0e3' }}>
          <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-white">
            Fashion Frenzy: Up to 60% off on all styles &nbsp;·&nbsp; Free Shipping Over {'\u20B9'}500
          </p>
        </div>

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center group">
            <img
              src={logo}
              alt="Thaarai"
              className="h-8 sm:h-10 md:h-12 w-auto object-contain transition-all duration-500"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;

              if (link.dropdown) {
                return (
                  <div key={link.label} className="relative group/dropdown">
                    <Link to={link.to} className="uppercase tracking-[0.1em] text-gray-600 font-normal text-[11px] hover:text-gray-900 pb-1 flex items-center gap-1 group">
                      {link.label}
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover/dropdown:rotate-180 transition-transform duration-300">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </Link>
                    <div className="absolute top-full left-0 w-48 bg-white border border-gray-100 shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-300 z-50 py-2">
                      {link.dropdown.map(sub => (
                        <Link key={sub.label} to={sub.to} className="block px-4 py-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link key={link.label} to={link.to}
                  className={`uppercase tracking-[0.1em] transition-all duration-300 relative group ${isActive ? 'font-semibold text-[12px] pb-1' : 'text-gray-600 font-normal text-[11px] hover:text-gray-900'
                    }`}
                  style={isActive ? { color: '#aba0e3', borderBottom: '2px solid #aba0e3' } : {}}
                >
                  {link.label}
                  {!isActive && <span className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{ backgroundColor: '#aba0e3' }} />}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <div ref={searchRef} className="flex items-center relative z-50">
              <div className={`transition-all duration-300 overflow-hidden flex items-center bg-gray-50 rounded-full border border-gray-200 ${searchOpen ? 'w-48 sm:w-56 lg:w-64 opacity-100 px-4 py-1.5 mr-1' : 'w-0 opacity-0 p-0 mr-0 border-transparent'}`}>
                <form onSubmit={handleSearch} className="w-full flex items-center gap-2">
                  <input
                    autoFocus={searchOpen}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full text-xs text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-900 shrink-0">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </form>
              </div>
              <button
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  if (searchOpen) setSearchQuery('');
                }}
                className={`p-2.5 transition-all rounded-full ${searchOpen ? 'text-[#8b7fc0] bg-gray-50' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <SearchIcon />
              </button>

              {/* Live Inline Search Results Dropdown */}
              {searchOpen && (
                <div className="absolute top-[120%] right-0 w-[300px] sm:w-[360px] bg-white border border-gray-100 shadow-2xl rounded-2xl animate-fade-in overflow-hidden z-[100]">
                  {searchQuery.length <= 1 ? (
                    <div className="p-4 flex flex-col gap-2 bg-gray-50/30">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b7fc0] px-2 py-1 mb-1">Suggested for you</p>
                      {products.slice(0, 3).map(p => (
                        <Link
                          key={p._id}
                          to={`/product/${p._id}`}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-4 group p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100"
                        >
                          <div className="w-10 h-10 bg-gray-100 overflow-hidden rounded-full shrink-0 shadow-sm border border-gray-100">
                            <img
                              src={p.images?.[0]?.startsWith('http') ? p.images[0] : `${BACKEND_URL}${p.images?.[0]}`}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={e => { e.target.src = logo; }}
                            />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 transition-colors" style={{ '--hover-color': '#8b7fc0' }} onMouseEnter={e => e.currentTarget.style.color = '#8b7fc0'} onMouseLeave={e => e.currentTarget.style.color = ''}>{p.name}</h4>
                            <p className="text-[9px] text-gray-400 mt-0.5">{p.category}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="p-4 flex flex-col gap-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 px-2 py-1">Products</p>
                      {searchResults.map(p => (
                        <Link
                          key={p._id}
                          to={`/product/${p._id}`}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-4 group p-2 hover:bg-gray-50 rounded-xl transition-all"
                        >
                          <div className="w-12 h-16 bg-gray-100 overflow-hidden rounded-md shrink-0 shadow-sm border border-gray-100">
                            <img
                              src={p.images?.[0]?.startsWith('http') ? p.images[0] : `${BACKEND_URL}${p.images?.[0]}`}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={e => { e.target.src = logo; }}
                            />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 transition-colors" style={{ '--hover-color': '#8b7fc0' }} onMouseEnter={e => e.currentTarget.style.color = '#8b7fc0'} onMouseLeave={e => e.currentTarget.style.color = ''}>{p.name}</h4>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">{p.category}</p>
                            <p className="text-[11px] font-semibold text-gray-900 mt-1">₹{p.price}</p>
                          </div>
                        </Link>
                      ))}
                      <button onClick={handleSearch} className="mt-2 w-full py-2.5 text-[10px] font-bold uppercase tracking-widest bg-[#8b7fc0] hover:bg-[#7b6ea8] text-white rounded-xl transition-colors shadow-sm">
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

            {/* User */}
            <div ref={userRef} className="relative hidden sm:block">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="p-2.5 text-gray-400 hover:text-gray-900 transition-all"
              >
                <UserIcon />
              </button>
              {userDropdown && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-gray-100 shadow-2xl py-2 z-50 animate-fade-in">
                  {user ? (
                    <>
                      <div className="px-5 py-3 border-b border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Signed in as</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      </div>
                      <Link to="/orders" onClick={() => setUserDropdown(false)}
                        className="block px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                        My Orders
                      </Link>
                      <button onClick={() => { logout(); setUserDropdown(false); }}
                        className="block w-full text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ color: '#aba0e3' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(171, 160, 227, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setUserDropdown(false)}
                        className="block px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                        Sign In
                      </Link>
                      <Link to="/register" onClick={() => setUserDropdown(false)}
                        className="block px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ color: '#aba0e3' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(171, 160, 227, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative hidden sm:block p-2.5 text-gray-400 transition-all" style={{ '--hover-color': '#aba0e3' }} onMouseEnter={e => e.currentTarget.style.color = '#aba0e3'} onMouseLeave={e => e.currentTarget.style.color = ''}>
              <WishlistIcon />
              {wishlist.length > 0 && (
                <span className="absolute top-1.5 right-1.5 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-lg animate-pulse-subtle" style={{ backgroundColor: '#aba0e3' }}>
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2.5 text-gray-400 hover:text-gray-900 transition-all hidden sm:block">
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-gray-900 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg transform translate-x-1 -translate-y-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu */}
            <button
              className="lg:hidden p-2.5 text-gray-400 hover:bg-gray-50 rounded-sm ml-1"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                }
              </svg>
            </button>
          </div>
        </div>



      </header>

      {/* Mobile Nav Drawer */}
      <div className={`fixed inset-0 z-[9999] lg:hidden transition-all duration-300 ${mobileOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div className={`absolute top-0 right-0 w-72 h-[100dvh] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 flex items-center justify-between border-b border-gray-100 mt-2">
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-gray-900">Menu</span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400 hover:text-gray-900">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 bg-white custom-scrollbar pb-10">
            <nav className="divide-y divide-gray-50 mb-8">
              {navLinks.map(({ to, label }) => {
                const isActive = location.pathname === to;
                return (
                  <Link key={label} to={to} onClick={() => setMobileOpen(false)}
                    className={`block py-3.5 uppercase tracking-widest text-xs font-bold transition-all ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    style={isActive ? { color: '#aba0e3' } : {}}>
                    {label}
                  </Link>
                );
              })}
              <Link to="/wishlist" onClick={() => setMobileOpen(false)}
                className="block py-3.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                style={{ '--hover-color': '#aba0e3' }}
                onMouseEnter={e => e.currentTarget.style.color = '#aba0e3'}
                onMouseLeave={e => e.currentTarget.style.color = ''}>
                Wishlist ({wishlist.length})
              </Link>
              <Link to="/cart" onClick={() => setMobileOpen(false)}
                className="block py-3.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                style={{ '--hover-color': '#aba0e3' }}
                onMouseEnter={e => e.currentTarget.style.color = '#aba0e3'}
                onMouseLeave={e => e.currentTarget.style.color = ''}>
                Cart ({cartCount})
              </Link>
            </nav>

            <div className="pt-6 border-t border-gray-100 space-y-4">
              {user ? (
                <>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signed in as</p>
                  <p className="text-sm font-bold text-gray-900 truncate mb-4">{user.name}</p>
                  <Link to="/orders" onClick={() => setMobileOpen(false)} className="btn-primary w-full text-center py-3 text-xs">My Orders</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="w-full text-center py-3 text-xs font-bold border border-gray-200 rounded-xl text-gray-600">Sign Out</button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary flex justify-center items-center py-3 px-4 text-xs whitespace-nowrap">Sign In</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="border border-gray-200 py-3 px-4 text-xs font-bold rounded-xl text-gray-900 flex justify-center items-center whitespace-nowrap">Join</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[74px]" />
    </>
  );
}


import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import logo from '../assets/logo.jpg';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const WishlistIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.89-8.89 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
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
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
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
    { to: '/collection?category=Couture', label: 'Couture' },
    { to: '/collection?category=Handbags', label: 'Handbags' },
    { to: '/collection?category=Silk+Scarves', label: 'Silk Scarves' },
    { to: '/collection?category=Heritage', label: 'Heritage' },
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
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-xl'
          : 'bg-white/40 backdrop-blur-md border-b border-gray-50'
      }`}
    >
      {/* Announcement Bar */}
      <div className="bg-blue-600 text-white py-1 px-6 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em]">
          Free Express Delivery on Orders Over ₹500 &nbsp;·&nbsp; Limited Editions Available
        </p>
      </div>

      <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between gap-8 transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
        {/* Logo */}
        <Link to="/" className="shrink-0 flex items-center gap-3 group">
          <div className="relative">
            <img 
              src={logo} 
              alt="Thaarai" 
              className="h-8 w-auto object-contain transition-all duration-500" 
            />
          </div>
          <div>
            <span className="font-serif text-lg font-bold tracking-tight text-gray-900 block leading-none">THAARAI</span>
            <span className="text-[7px] font-bold uppercase tracking-[0.4em] text-blue-600">Atelier</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map(({ to, label }) => {
            const isHome = to === '/';
            const targetCategory = to.includes('category=') ? to.split('category=')[1] : null;
            const currentCategory = new URLSearchParams(location.search).get('category');
            
            const isActive = isHome 
              ? location.pathname === '/' 
              : location.pathname === '/collection' && currentCategory === targetCategory;

            return (
              <Link key={label} to={to}
                className={`uppercase tracking-[0.1em] transition-all duration-300 relative group ${
                  isActive ? 'text-blue-600 font-semibold text-[12px] border-b-2 border-blue-600 pb-1' : 'text-gray-600 font-normal text-[11px] hover:text-gray-900'
                }`}
              >
                {label}
                {!isActive && <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full" />}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-2.5 transition-all ${searchOpen ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <SearchIcon />
          </button>

          {/* User */}
          <div className="relative">
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
                      className="block w-full text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50/50 transition-colors">
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
                      className="block px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50/50 transition-colors">
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Wishlist */}
          <Link to="/wishlist" className="relative p-2.5 text-gray-400 hover:text-blue-500 transition-all">
            <WishlistIcon />
            {wishlist.length > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-lg animate-pulse-subtle">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link to="/cart" className="relative p-2.5 text-gray-400 hover:text-gray-900 transition-all">
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
                ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Search Overlay & Live Results */}
      {searchOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-2xl animate-fade-in z-[60]">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <form onSubmit={handleSearch} className="flex gap-4 items-center mb-6">
              <div className="flex-1 relative">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search for luxury items, categories..."
                  className="w-full text-2xl font-serif text-gray-900 placeholder-gray-300 outline-none border-b-2 border-gray-100 focus:border-blue-600 pb-3 bg-transparent transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </form>

            {/* Live Search Results */}
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Products</p>
                  {searchResults.map(p => (
                    <Link 
                      key={p._id} 
                      to={`/product/${p._id}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-12 h-16 bg-gray-50 overflow-hidden">
                        <img 
                          src={p.images?.[0]?.startsWith('http') ? p.images[0] : `${BACKEND_URL}${p.images?.[0]}`} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={e => { e.target.src = logo; }}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{p.category}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="bg-gray-50 p-6 flex flex-col justify-center rounded-sm">
                  <p className="text-sm text-gray-600 mb-4 italic">"Looking for something specific? Our couture collection is updated weekly."</p>
                  <button 
                    onClick={handleSearch}
                    className="text-[10px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    View All Results <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            ) : searchQuery.length > 1 ? (
              <div className="py-10 text-center animate-fade-in">
                <p className="text-gray-400 italic">No exact matches found. Try searching for "Couture" or "Handbags".</p>
              </div>
            ) : null}
          </div>
          <div className="h-24 bg-gradient-to-b from-white to-transparent opacity-50"></div>
        </div>
      )}

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 animate-fade-in">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map(({ to, label }) => {
              const isHome = to === '/';
              const targetCategory = to.includes('category=') ? to.split('category=')[1] : null;
              const currentCategory = new URLSearchParams(location.search).get('category');
              
              const isActive = isHome 
                ? location.pathname === '/' 
                : location.pathname === '/collection' && currentCategory === targetCategory;

              return (
                <Link key={label} to={to} onClick={() => setMobileOpen(false)}
                  className={`block py-3 uppercase tracking-widest border-b border-gray-50 transition-colors ${
                    isActive ? 'text-[12px] font-semibold text-blue-600' : 'text-[11px] font-normal text-gray-600 hover:text-gray-900'
                  }`}>
                  {label}
                </Link>
              );
            })}
            <Link to="/wishlist" onClick={() => setMobileOpen(false)}
              className="block py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500 hover:text-blue-500 border-b border-gray-50 transition-colors">
              Wishlist ({wishlist.length})
            </Link>
          </div>
        </div>
      )}

    </header>
  );
}


import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const HomeIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ShopIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const WishlistIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.89-8.89 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const UserIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

export default function MobileBottomBar() {
  const location = useLocation();
  const { wishlist, products, cartCount, user } = useShop();
  const wishlistCount = products.filter(p => wishlist.includes(p._id)).length;

  // Don't show on admin paths
  const isAdminPath = location.pathname.startsWith('/admin');
  if (isAdminPath) return null;

  const navItems = [
    { label: 'Home', path: '/', icon: HomeIcon },
    { label: 'Shop', path: '/collection', icon: ShopIcon },
    { label: 'Wishlist', path: '/wishlist', icon: WishlistIcon, count: wishlistCount },
    { label: 'Cart', path: '/cart', icon: (props) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={props.active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ), count: cartCount },
    { label: 'Account', path: user ? '/account' : '/login', icon: UserIcon },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-[100] px-6 py-3 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.label} 
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-black scale-110' : 'text-gray-400 hover:text-black'}`}
            >
              <div className="relative">
                <Icon active={isActive} />
                {item.count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-lg">
                    {item.count}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100 uppercase' : 'opacity-0'} transition-opacity duration-300`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

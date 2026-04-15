import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpg';
import ConfirmModal from './ConfirmModal';

const nav = [
  { 
    to: '/dashboard', 
    label: 'Dashboard', 
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  { 
    to: '/products', 
    label: 'Products', 
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  { 
    to: '/categories', 
    label: 'Categories', 
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    )
  },
  { 
    to: '/banners', 
    label: 'Gallery', 
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    to: '/inventory', 
    label: 'Inventory', 
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  { 
    to: '/orders', 
    label: 'Orders', 
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 002 2m-6 9l2 2 4-4" />
      </svg>
    )
  },
  { 
    to: '/customers', 
    label: 'Customers', 
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  { 
    to: '/coupons', 
    label: 'Promo Codes', 
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 001 1.732 2 2 0 010 3.464A2 2 0 003 17v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 00-1-1.732 2 2 0 010-3.464A2 2 0 0021 10V7a2 2 0 00-2-2H5z" />
      </svg>
    )
  },
  { 
    to: '/settings', 
    label: 'Settings', 
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-charcoal h-screen flex flex-col transition-transform duration-300 transform
        lg:sticky lg:translate-x-0 lg:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <span className="font-serif text-white text-lg">Thaarai</span>
            </div>
            <p className="text-[9px] tracking-[0.3em] uppercase text-white/40 font-sans mt-0.5">Admin Panel</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white p-1">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar">
          {nav.map(({ to, label, icon }) => (
            <NavLink 
              key={to} 
              to={to}
              onClick={() => { if(window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-xs tracking-[0.15em] uppercase font-sans transition-all rounded-sm ${isActive ? 'bg-gold-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`
              }>
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-3 px-4 py-3 text-xs tracking-[0.15em] uppercase font-sans text-white/40 hover:text-white transition-colors w-full text-left">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <ConfirmModal 
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of the admin panel? You will need to sign in again to access any administrative features."
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        type="danger"
      />
    </>
  );
}

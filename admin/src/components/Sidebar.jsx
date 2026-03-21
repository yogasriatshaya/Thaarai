import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpg';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/products', label: 'Products', icon: '◈' },
  { to: '/orders', label: 'Orders', icon: '◎' },
  { to: '/customers', label: 'Customers', icon: '◉' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  return (
    <aside className="w-56 bg-charcoal min-h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-1">
          <span className="font-serif text-white text-lg">Aara</span>
          <span className="text-gold-500 text-lg">_</span>
        </div>
        <p className="text-[9px] tracking-[0.3em] uppercase text-white/40 font-sans mt-0.5">Admin Panel</p>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {nav.map(({ to, label, icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-xs tracking-[0.15em] uppercase font-sans transition-all rounded-sm ${isActive ? 'bg-gold-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`
            }>
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-xs tracking-[0.15em] uppercase font-sans text-white/40 hover:text-white transition-colors w-full">
          <span>→</span> Logout
        </button>
      </div>
    </aside>
  );
}

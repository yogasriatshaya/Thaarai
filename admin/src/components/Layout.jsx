import { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, LogOut, ChevronDown } from 'lucide-react';

export default function Layout({ children, title }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm shadow-black/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-50 rounded-lg text-charcoal transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-serif text-lg lg:text-xl text-charcoal truncate">{title}</h1>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-3 relative" ref={menuRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 lg:gap-3 hover:bg-gray-50 p-1 rounded-xl transition-all active:scale-95 group"
            >
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal leading-tight">Admin</p>
                <p className="text-[9px] text-gray-400">Master Control</p>
              </div>
              <div className="w-8 h-8 lg:w-9 lg:h-9 bg-gold-50 rounded-full flex items-center justify-center border border-gold-100 shadow-inner group-hover:border-gold-300 transition-colors">
                <span className="text-gold-700 text-xs font-serif font-bold">A</span>
              </div>
              <ChevronDown size={14} className={`text-gray-300 transition-transform duration-300 ${showProfileMenu ? 'rotate-180 text-gold-600' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute top-[calc(100%+8px)] right-0 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn z-50">
                <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 sm:hidden">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal">Admin</p>
                    <p className="text-[9px] text-gray-400">Master Control</p>
                </div>
                <div className="py-1">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-red-500 hover:bg-red-50 transition-colors font-bold uppercase tracking-widest">
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-8 overflow-hidden">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

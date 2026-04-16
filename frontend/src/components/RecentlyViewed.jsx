import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
export default function RecentlyViewed() {
  const { getFullImgUrl, settings } = useShop();
  const recentFallback = settings?.productFallback ? getFullImgUrl(settings.productFallback) : '';
  const [items, setItems] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('thaarai_recently_viewed');
    if (raw) {
      try { setItems(JSON.parse(raw)); } catch { }
    }
  }, []);

  // Auto-hide after 15 seconds so users actually have time to see it
  useEffect(() => {
    if (items.length > 0) {
      const timer = setTimeout(() => setVisible(false), 15000);
      return () => clearTimeout(timer);
    }
  }, [items]);


  if (!visible || items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-2xl pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 shrink-0 whitespace-nowrap">Recently Viewed</span>
        <div className="flex gap-3 overflow-x-auto no-scrollbar flex-1 min-h-[80px]">
          {items.slice(0, 6).map(p => (
            <Link key={p._id} to={`/product/${p._id}`}
              className="shrink-0 flex items-center gap-2 group hover:bg-gray-50 rounded-lg px-2 py-1 transition-all min-w-fit">
              <div className="w-12 h-16 overflow-hidden bg-gray-50 border border-gray-100 rounded-md shrink-0 flex-shrink-0">
                <img src={p.images?.[0] ? getFullImgUrl(p.images[0]) : recentFallback} alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { 
                    if (recentFallback && e.target.src !== recentFallback) {
                      e.target.src = recentFallback;
                    }
                  }} />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <p className="text-[10px] font-bold text-gray-900 group-hover:text-black transition-colors line-clamp-2 break-words">{p.name}</p>
                <p className="text-[9px] text-gray-400 font-bold whitespace-nowrap">
                  {p.price?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <button onClick={() => setVisible(false)}
          className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors text-xl leading-none">×</button>
      </div>
    </div>
  );
}

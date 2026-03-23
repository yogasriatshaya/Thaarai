import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { PRODUCT_FALLBACK } from '../assets/images';

export default function RecentlyViewed() {
  const { BACKEND_URL } = useShop();
  const [items, setItems] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('aara_recently_viewed');
    if (raw) {
      try { setItems(JSON.parse(raw)); } catch { }
    }
  }, []);

  // Auto-hide after 5 seconds
  useEffect(() => {
    if (items.length > 0) {
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [items]);

  const getImg = (img) => img?.startsWith('http') ? img : `${BACKEND_URL}${img}`;

  if (!visible || items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 shrink-0">Recently Viewed</span>
        <div className="flex gap-4 overflow-x-auto no-scrollbar flex-1">
          {items.slice(0, 6).map(p => (
            <Link key={p._id} to={`/product/${p._id}`}
              className="shrink-0 flex items-center gap-3 group hover:bg-gray-50 rounded-xl px-3 py-1.5 transition-all">
              <div className="w-10 h-12 overflow-hidden bg-gray-50 border border-gray-100 rounded-lg shrink-0">
                <img src={getImg(p.images?.[0])} alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { e.target.src = PRODUCT_FALLBACK; }} />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 max-w-[100px]">{p.name}</p>
                <p className="text-[9px] text-gray-400 font-bold">
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

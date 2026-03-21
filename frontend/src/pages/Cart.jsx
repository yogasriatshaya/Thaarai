import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import API from '../api';
import { MOCK_PRODUCTS } from '../data/mockProducts';

export default function Cart() {
  const { cartData, updateCartQty, removeFromCart, BACKEND_URL } = useShop();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCartItems = async () => {
      setLoading(true);
      const items = [];
      for (const key in cartData) {
        const item = cartData[key];
        if (item?.productId) {
          if (item.productId.startsWith('mock_')) {
            const mock = MOCK_PRODUCTS.find(p => p._id === item.productId);
            if (mock) items.push({ ...mock, ...item, key });
          } else if (item.productId.startsWith('local_')) {
            const localData = localStorage.getItem('aara_local_products');
            const locals = localData ? JSON.parse(localData) : [];
            const local = locals.find(p => p._id === item.productId);
            if (local) items.push({ ...local, ...item, key });
          } else {
            try {
              const res = await API.get(`/products/${item.productId}`);
              items.push({ ...res.data.product, ...item, key });
            } catch {}
          }
        }
      }
      setCartItems(items);
      setLoading(false);
    };
    loadCartItems();
  }, [cartData]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal > 500 ? 0 : 35;
  const total = subtotal + delivery;

  const getImg = (img) => img?.startsWith('http') ? img : `${BACKEND_URL}${img}`;

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-white min-h-screen">
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-100 w-40 mb-10 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 space-y-6">
              <div className="h-40 bg-gray-50 rounded-xl" />
              <div className="h-40 bg-gray-50 rounded-xl" />
           </div>
           <div className="lg:col-span-4 h-80 bg-gray-50 rounded-xl" />
        </div>
      </div>
    </div>
  );

  if (cartItems.length === 0) return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center bg-white border border-gray-100 p-8 sm:p-16 md:p-24 max-w-xl mx-auto shadow-2xl relative overflow-hidden rounded-xl w-full">
        <div className="absolute top-0 left-0 right-0 h-1 shadow-[0_0_15px_rgba(171,160,227,0.3)]" style={{ backgroundColor: '#aba0e3' }} />
        <div className="w-20 h-20 bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-10 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="#aba0e3" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-gray-900 font-bold mb-6 tracking-tight">Your Bag is Empty</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-12 leading-relaxed">Discover our curated collection of luxury pieces and find your next favorite.</p>
        <Link to="/collection" className="btn-primary inline-flex">Explore Collection</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="mb-10 md:mb-20 text-center">
          <span className="font-bold text-[8px] uppercase tracking-[0.4em] mb-3 block" style={{ color: '#aba0e3' }}>Selection Archive</span>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-gray-900 tracking-tight">Shopping Bag</h1>
          <div className="w-12 h-px mx-auto mt-8" style={{ backgroundColor: '#aba0e3', opacity: 0.3 }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          <div className="lg:col-span-8">
            <div className="bg-white border border-gray-100 p-4 sm:p-8 shadow-2xl space-y-8 sm:space-y-10 rounded-xl">
              {cartItems.map((item) => (
                <div key={item.key} className="group flex flex-col sm:flex-row gap-6 sm:gap-10 pb-8 sm:pb-10 border-b border-gray-100 last:border-0 last:pb-0">
                  <Link to={`/product/${item._id}`} className="shrink-0 overflow-hidden w-full sm:w-36 bg-gray-50 border border-gray-100 shadow-lg pulse-photo rounded-xl" style={{aspectRatio:'3/4'}}>
                    <img
                      src={getImg(item.images?.[0])}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-all duration-700"
                      onError={e => { e.target.src = PRODUCT_FALLBACK; }}
                    />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-6 mb-4">
                        <Link to={`/product/${item._id}`} className="font-serif text-xl sm:text-2xl font-bold text-gray-900 transition-colors tracking-tight hover:opacity-75" style={{ '--hover-color': '#aba0e3' }} onMouseEnter={e => e.currentTarget.style.color = '#aba0e3'} onMouseLeave={e => e.currentTarget.style.color = ''}>{item.name}</Link>
                        <p className="font-serif font-bold text-gray-900 text-lg sm:text-xl tracking-tight">
                          {(item.price * item.quantity).toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0
                          })}
                        </p>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8" style={{ color: '#aba0e3' }}>{item.subcategory || item.category}</p>
                      
                      <div className="flex flex-wrap gap-3 text-[9px] font-bold uppercase tracking-widest">
                        {item.size && (
                           <span className="bg-gray-50 px-3 sm:px-4 py-2 border border-gray-100 text-gray-500 rounded-xl">Size: {item.size}</span>
                        )}
                        {item.color && (
                           <span className="bg-gray-50 px-3 sm:px-4 py-2 border border-gray-100 text-gray-500 rounded-xl">Color: {item.color}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-8 sm:mt-12">
                      <div className="flex items-center bg-gray-50 p-1 border border-gray-100 rounded-xl">
                        <button onClick={() => updateCartQty(item._id, item.size, item.color, item.quantity - 1)}
                          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#aba0e3] hover:bg-white transition-all text-xl" disabled={item.quantity <= 1}>−</button>
                        <span className="w-14 h-10 flex items-center justify-center text-sm font-bold text-gray-900">{item.quantity}</span>
                        <button onClick={() => updateCartQty(item._id, item.size, item.color, item.quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#aba0e3] hover:bg-white transition-all text-xl">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item._id, item.size, item.color)}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors flex items-center gap-3">
                        <span className="text-xl">×</span> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 sm:p-10 sticky top-32 border border-gray-100 shadow-2xl relative overflow-hidden group rounded-xl">
              <div className="absolute top-0 right-0 w-32 h-32 blur-3xl transition-colors opacity-10" style={{ backgroundColor: '#aba0e3' }} />
              <div className="relative z-10">
                <h2 className="font-serif text-2xl font-bold text-gray-900 mb-12 border-b border-gray-100 pb-8">Summary</h2>
                
                {/* Free Shipping Threshold Bar */}
                {(() => {
                  const FREE_SHIPPING_THRESHOLD = 15000;
                  const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
                  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
                  return (
                    <div className="mb-10 bg-purple-50 border border-purple-100 rounded-xl p-5">
                      {remaining > 0 ? (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#aba0e3] mb-3">
                          Add {remaining.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} more for
                          <span className="brightness-75 font-black mx-1"> Free Shipping</span>
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-3">✓ You've unlocked Free Shipping!</p>
                      )}
                      <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: '#aba0e3' }} />
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-8 mb-16">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Subtotal</span>
                    <span className="font-serif font-bold text-gray-900 text-2xl tracking-tight">
                      {subtotal.toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Logistics</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#aba0e3' }}>
                      {delivery === 0 ? 'Complimentary' : delivery.toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                  {delivery === 0 && (
                     <div className="bg-gray-50 border border-gray-100 px-6 py-5 flex items-center gap-4 rounded-xl">
                        <span className="text-xl font-serif" style={{ color: '#aba0e3' }}>✧</span>
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-900">Signature Global Delivery</p>
                     </div>
                  )}
                </div>

                <div className="h-px bg-gray-100 w-full mb-12" />

                <div className="flex justify-between items-center mb-16">
                  <span className="text-gray-400 font-bold text-[11px] uppercase tracking-[0.3em]">Total Value</span>
                  <span className="font-serif font-bold text-5xl text-gray-900 tracking-tighter">
                    {total.toLocaleString('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    })}
                  </span>
                </div>

                <button onClick={() => navigate('/checkout')}
                  className="btn-primary w-full h-18 text-sm group rounded-xl">
                  Proceed to Secure Checkout
                  <span className="ml-4 group-hover:translate-x-3 transition-transform inline-block">→</span>
                </button>
                
                <Link to="/collection" className="block text-center mt-10 text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 transition-colors" style={{ '--hover-color': '#aba0e3' }} onMouseEnter={e => e.currentTarget.style.color = '#aba0e3'} onMouseLeave={e => e.currentTarget.style.color = ''}>
                  Continue Browsing
                </Link>
              </div>
            </div>
            
            <div className="mt-8 bg-white border border-gray-100 p-8 flex items-center gap-6 shadow-2xl relative overflow-hidden group rounded-xl">
                <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-700" style={{ backgroundColor: 'rgba(171,160,227,0.05)' }} />
                <div className="text-3xl relative z-10">🔒</div>
                <div className="relative z-10">
                   <p className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.2em] mb-1">Encrypted Transaction</p>
                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tier 4 Data Security Protocol</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

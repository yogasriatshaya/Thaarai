import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/orders/my-orders').then(r => {
      setOrders(r.data.orders || []);
    }).finally(() => setLoading(false));
  }, []);

  const statusConfig = {
    processing: { label: 'Processing', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-600' },
    shipped:    { label: 'Shipped',    bg: 'bg-blue-50',  text: 'text-blue-600',  dot: 'bg-blue-600' },
    delivered:  { label: 'Delivered',  bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-600' },
    cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',   text: 'text-red-600',   dot: 'bg-red-600' },
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10 text-center">
          <span className="text-blue-600 font-bold text-[8px] uppercase tracking-[0.4em] mb-2 block">Account Overview</span>
          <h1 className="font-serif text-4xl md:text-5xl text-gray-900 font-bold tracking-tight">Order Archive</h1>
          <div className="w-10 h-px bg-blue-600/30 mx-auto mt-4" />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white h-32 animate-pulse rounded-xl border border-gray-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center bg-white border border-gray-200 p-16 max-w-2xl mx-auto shadow-2xl relative overflow-hidden group rounded-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6 rounded-xl">
                <span className="text-blue-600 text-xl font-serif">✧</span>
              </div>
              <h2 className="font-serif text-2xl text-gray-900 font-bold mb-3">No Orders Found</h2>
              <p className="text-gray-400 mb-8 max-w-xs mx-auto text-xs font-bold uppercase tracking-widest">
                Your luxury journey begins with your first selection.
              </p>
              <Link to="/collection" className="btn-primary">Explore Collections</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => {
              const status = statusConfig[order.orderStatus] || { label: order.orderStatus, bg: 'bg-white/5', text: 'text-gray-400', dot: 'bg-gray-500' };
              return (
                <div key={order._id} className="bg-white border border-gray-100 hover:border-gray-200 transition-all shadow-2xl relative overflow-hidden group rounded-xl">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/20" />
                  {/* Order Header */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-8 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">REFERENCE</p>
                        <p className="font-mono text-sm font-bold text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="hidden md:block w-px h-8 bg-gray-100" />
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">PLACEMENT</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">TOTAL VALUE</p>
                        <p className="font-serif text-xl font-bold text-gray-900 tracking-tight">
                          {order.totalAmount?.toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0
                          })}
                        </p>
                      </div>
                      <span className={`flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 ${status.bg} ${status.text} border border-gray-100 rounded-xl`}>
                        <span className={`w-1 h-1 rounded-full ${status.dot} animate-pulse`} />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex gap-3 items-center group">
                          <div className="w-14 h-18 bg-gray-50 border border-gray-100 shrink-0 overflow-hidden relative rounded-xl" style={{ height: '4.5rem' }}>
                            <img 
                              src={item.image || PRODUCT_FALLBACK} 
                              alt={item.name} 
                              loading="lazy" 
                              decoding="async"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={e => { e.target.src = PRODUCT_FALLBACK; }}
                            />
                            <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-tl-xl">
                              {item.quantity}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{item.size}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      Settlement via {order.paymentMethod?.toUpperCase()} ·{' '}
                      <span className={order.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'}>
                        {order.paymentStatus?.toUpperCase()}
                      </span>
                    </p>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
                      Protocol Invoice →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-xl bg-white border border-gray-100 p-16 md:p-24 shadow-2xl relative overflow-hidden group rounded-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-green-500/5 blur-[100px] rounded-full group-hover:bg-green-500/10 transition-colors duration-1000" />

        <div className="w-20 h-20 bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-12 shadow-2xl rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-green-600 mb-6">Transaction Absolute</p>
        <h1 className="font-serif text-5xl md:text-6xl text-gray-900 font-bold mb-8 tracking-tight">Gratitude</h1>
        <div className="w-16 h-px bg-green-600/30 mx-auto mb-10" />
        <p className="text-gray-500 leading-relaxed mb-16 max-w-sm mx-auto text-sm font-light tracking-wide">
          Your acquisition is being prepared with clinical precision within our global ateliers. A formal communique will be dispatched upon transit.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link to="/orders" className="btn-primary min-w-[200px] bg-green-500 hover:bg-green-600 shadow-green-500/20">Inventory Status</Link>
          <Link to="/collection" className="btn-ghost min-w-[200px] border-gray-200">Continue Browsing</Link>
        </div>
      </div>
    </div>
  );
}

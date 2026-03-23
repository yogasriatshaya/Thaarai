import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be reversed.")) return;
    try {
      const res = await API.put(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        toast.success("Order cancelled successfully");
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: 'cancelled' } : o));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    }
  };

  useEffect(() => {
    API.get('/orders/my-orders').then(r => {
      setOrders(r.data.orders || []);
    }).finally(() => setLoading(false));
  }, []);

  // Flipkart style statuses
  const getStatusDisplay = (status, date) => {
    const d = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    switch(status) {
      case 'processing': return { text: `Ordered on ${d}`, color: 'bg-green-500', sub: 'Your order is being processed' };
      case 'shipped': return { text: `Shipped on ${d}`, color: 'bg-green-500', sub: 'Your item is on the way' };
      case 'delivered': return { text: `Delivered on ${d}`, color: 'bg-green-500', sub: 'Your item has been delivered' };
      case 'cancelled': return { text: `Cancelled on ${d}`, color: 'bg-red-500', sub: 'You cancelled this order' };
      default: return { text: `Pending on ${d}`, color: 'bg-orange-500', sub: 'Awaiting confirmation' };
    }
  };

  const filteredOrders = activeFilter === 'all' ? orders : orders.filter(o => o.orderStatus === activeFilter);

  return (
    <div className="bg-[#f1f3f6] min-h-screen pt-4 pb-12 font-sans text-[#212121]">
      <div className="max-w-[1200px] mx-auto px-2 lg:px-4 flex flex-col lg:flex-row gap-4 items-start mt-4">
        
        {/* Flipkart-style Sidebar Filters */}
        <div className="w-full lg:w-[280px] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] shrink-0 hidden lg:block rounded-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-black">Filters</h2>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-medium text-black mb-3 uppercase tracking-wide">Order Status</h3>
            <div className="space-y-4">
              {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => (
                <label key={f} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={activeFilter === f} onChange={() => setActiveFilter(f)} className="w-[15px] h-[15px] accent-[#2874f0] text-white border-gray-300 rounded-[2px] cursor-pointer" />
                  <span className={`text-sm tracking-wide ${activeFilter === f ? 'text-black' : 'text-[#212121] group-hover:text-black'}`}>
                    {f === 'all' ? 'All Orders' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-black mb-3 uppercase tracking-wide">Order Time</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-[15px] h-[15px] accent-[#2874f0] rounded-[2px]" /><span className="text-sm text-[#212121]">Last 30 days</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-[15px] h-[15px] accent-[#2874f0] rounded-[2px]" defaultChecked /><span className="text-sm text-[#212121]">2026</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-[15px] h-[15px] accent-[#2874f0] rounded-[2px]" /><span className="text-sm text-[#212121]">2025</span></label>
            </div>
          </div>
        </div>

        {/* Flipkart-style Main List */}
        <div className="flex-1 w-full bg-transparent space-y-3">
          {loading ? (
             <div className="w-full h-32 bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] animate-pulse rounded-sm" />
          ) : filteredOrders.length === 0 ? (
             <div className="w-full bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] p-12 text-center rounded-sm">
                <img src="/empty-cart.png" alt="Empty" className="w-48 mx-auto mb-6 opacity-80 mix-blend-multiply" onError={e => { e.target.style.display = 'none'; }} />
                <h2 className="text-xl font-medium text-black mb-2">No Orders Found</h2>
                <p className="text-sm text-gray-500">Looks like you haven't placed any orders matching this filter.</p>
             </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order._id} className="w-full bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.2)] transition-shadow rounded-sm flex flex-col group/row">
                {order.items?.map((item, index) => {
                  const statusInfo = getStatusDisplay(order.orderStatus, order.createdAt);
                  return (
                    <div key={index} className="flex flex-col sm:flex-row gap-6 p-4 sm:p-6 border-b border-gray-100 last:border-0 relative hover:bg-gray-50/50 transition-colors">
                      {/* Image */}
                      <div className="w-20 h-28 sm:w-20 sm:h-28 shrink-0 overflow-hidden relative group">
                        <img 
                          src={item.image || PRODUCT_FALLBACK} 
                          alt={item.name} 
                          className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300"
                          onError={e => { e.target.src = PRODUCT_FALLBACK; }}
                        />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-sm sm:text-base text-[#212121] font-medium hover:text-[#2874f0] cursor-pointer truncate transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold font-sans tracking-wide mt-1">Order ID: #{order._id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-gray-500 mt-2 flex flex-col gap-1">
                          {item.color && <span>Color: <span className="text-gray-600">{item.color}</span></span>}
                          {item.size && <span>Size: <span className="text-gray-600">{item.size}</span></span>}
                        </p>
                        <p className="text-xs text-black font-medium mt-3 bg-gray-100/80 w-fit px-2 py-0.5 rounded-[2px]">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="w-full sm:w-28 shrink-0 mt-2 sm:mt-0">
                        <p className="text-sm sm:text-base font-medium text-black">
                          {((item.price * item.quantity) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="w-full sm:w-72 shrink-0 mt-4 sm:mt-0 flex flex-col">
                        <div className="flex gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${statusInfo.color}`} />
                          <div>
                            <p className="text-sm text-black font-semibold">{statusInfo.text}</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{statusInfo.sub}</p>
                            {order.trackingId && (
                                <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-0.5">
                                   <p className="text-[11px] font-bold text-black flex items-center gap-1">📦 Tracking</p>
                                   <p className="text-[11px] font-bold text-[#2874f0] font-sans">{order.carrierName} ({order.trackingId})</p>
                                </div>
                            )}
                          </div>
                        </div>
                        
                        {(order.orderStatus === 'processing' || order.orderStatus === 'pending') && index === 0 && (
                          <div className="mt-4 pl-5">
                            <button 
                              onClick={(e) => { e.preventDefault(); handleCancelOrder(order._id); }}
                              className="text-sm font-semibold text-[#2874f0] hover:text-[#2874f0]/80 flex items-center gap-1.5 uppercase transition-colors"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              Cancel Order
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
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

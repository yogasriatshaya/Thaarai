import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';
import { formatPrice } from '../utils/priceUtils';
import ConfirmModal from '../components/ConfirmModal';
import { useShop } from '../context/ShopContext';
export function Orders() {
  const { getFullImgUrl, settings } = useShop();
  const orderFallback = settings?.productFallback ? getFullImgUrl(settings.productFallback) : '';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [returnDays, setReturnDays] = useState(7);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const toggleExpand = (id) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const viewInvoice = (order) => {
    setInvoiceOrder(order);
  };

  const handleCancelOrder = (orderId) => {
    setSelectedCancelOrder(orderId);
    setCancelModalOpen(true);
  };

  const executeCancel = async () => {
    if (!cancelReason.trim()) return toast.error("Please provide a reason for cancellation");
    try {
      const res = await API.put(`/orders/${selectedCancelOrder}/cancel`, { reason: cancelReason });
      if (res.data.success) {
        toast.success("Order cancelled successfully");
        setOrders(orders.map(o => o._id === selectedCancelOrder ? { ...o, orderStatus: 'cancelled', cancellationReason: cancelReason } : o));
        setCancelModalOpen(false);
        setSelectedCancelOrder(null);
        setCancelReason('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    }
  };

  useEffect(() => {
    API.get('/orders/my-orders').then(r => {
      setOrders(r.data.orders || []);
    }).finally(() => setLoading(false));

    API.get('/settings').then(r => {
       if (r.data.settings?.returnWindowDays !== undefined) {
          setReturnDays(r.data.settings.returnWindowDays);
       }
    }).catch(() => {});
  }, []);

  const isReturnExpired = (order) => {
    if (order.orderStatus !== 'delivered') return false;
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(order.updatedAt)) / (1000 * 60 * 60 * 24));
    
    // Minimum/safest return window from all items in order
    // If any item has a custom window, use the max custom window amongst items, or fallback to global
    let applicableWindow = returnDays;
    if (order.items && order.items.length > 0) {
      const customWindows = order.items
        .map(i => i.product?.returnWindowDays)
        .filter(w => w !== null && w !== undefined);
      if (customWindows.length > 0) {
         applicableWindow = Math.min(...customWindows); // Using minimum to be safe, or could use Math.max
      }
    }
    
    return diffDays > applicableWindow;
  };

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnImage, setReturnImage] = useState(''); // preview url
  const [returnFile, setReturnFile] = useState(null); // actual file object

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be smaller than 10MB");
        return;
      }
      setReturnFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReturnImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const submitReturn = async () => {
    if (!returnReason.trim()) return toast.error("Return reason is required");
    try {
      const formData = new FormData();
      formData.append('reason', returnReason);
      if (returnFile) {
        formData.append('images', returnFile);
      }
      const res = await API.post(`/orders/${selectedReturnOrder}/return`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success("Return request submitted successfully");
        setOrders(orders.map(o => o._id === selectedReturnOrder ? { ...o, returnRequested: true, returnStatus: 'pending' } : o));
        setReturnModalOpen(false);
        setSelectedReturnOrder(null);
        setReturnReason('');
        setReturnImage('');
        setReturnFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit return request");
    }
  };

  const getStatusDisplay = (status, date, order) => {
    const d = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (order?.returnRequested) {
       if (order.returnStatus === 'approved') return { text: `Return Approved`, color: 'bg-blue-500', sub: 'Please ship the item back to us' };
       if (order.returnStatus === 'received') return { text: `Item Received`, color: 'bg-green-500', sub: 'We got your item! Processing refund...' };
       if (order.returnStatus === 'rejected') return { text: `Return Rejected`, color: 'bg-red-500', sub: 'Your return request was denied' };
       if (order.returnStatus === 'refunded') return { text: `Refunded`, color: 'bg-purple-500', sub: 'Refund successful' };
       return { text: `Return Pending`, color: 'bg-yellow-500', sub: 'Return under review' };
    }
    switch(status) {
      case 'processing': return { text: `Ordered on ${d}`, color: 'bg-green-500', sub: 'Your order is being processed' };
      case 'shipped': return { text: `Shipped on ${d}`, color: 'bg-green-500', sub: 'Your item is on the way' };
      case 'delivered': return { text: `Delivered on ${d}`, color: 'bg-green-500', sub: 'Your item has been delivered' };
      case 'returned': return { text: `Returned on ${d}`, color: 'bg-purple-500', sub: 'Your returned item has been received' };
      case 'cancelled': return { text: `Cancelled on ${d}`, color: 'bg-red-500', sub: 'You cancelled this order' };
      default: return { text: `Pending on ${d}`, color: 'bg-orange-500', sub: 'Awaiting confirmation' };
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeFilter !== 'all' && o.orderStatus !== activeFilter) return false;
    
    if (timeFilter !== 'all') {
      const orderDate = new Date(o.createdAt || o.updatedAt);
      const now = new Date();
      if (timeFilter === '30days') {
        const diffDays = Math.ceil(Math.abs(now - orderDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) return false;
      } else if (timeFilter === '6months') {
        const diffMonths = (now.getFullYear() - orderDate.getFullYear()) * 12 + now.getMonth() - orderDate.getMonth();
        if (diffMonths > 6) return false;
      } else if (!isNaN(timeFilter)) {
        if (orderDate.getFullYear().toString() !== timeFilter) return false;
      }
    }
    
    return true;
  });

  const availableYears = [...new Set(orders.map(o => new Date(o.createdAt || o.updatedAt).getFullYear()))].sort((a, b) => b - a);
  const timeFilterOptions = [
    { label: 'Last 30 days', value: '30days' },
    { label: 'Last 6 months', value: '6months' },
    ...availableYears.map(y => ({ label: y.toString(), value: y.toString() }))
  ];

  return (
    <div className="bg-[#f1f3f6] min-h-screen pt-4 pb-12 font-sans text-[#212121] relative">
      <div className="max-w-[1200px] mx-auto px-2 lg:px-4 flex flex-col lg:flex-row gap-4 items-start mt-4">
        
        {/* Flipkart-style Sidebar Filters */}
        <div className="w-full lg:w-[280px] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] shrink-0 hidden lg:block rounded-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-black">Filters</h2>
          </div>
          <div className="p-4">
            <h3 className="text-sm font-medium text-black mb-3 uppercase tracking-wide">Order Status</h3>
            <div className="space-y-4">
              {['all', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'].map(f => (
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
              {timeFilterOptions.map(tf => (
                <label key={tf.value} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={timeFilter === tf.value} onChange={() => setTimeFilter(timeFilter === tf.value ? 'all' : tf.value)} className="w-[15px] h-[15px] accent-[#2874f0] text-white border-gray-300 rounded-[2px] cursor-pointer" />
                  <span className={`text-sm tracking-wide ${timeFilter === tf.value ? 'text-black' : 'text-[#212121] group-hover:text-black'}`}>{tf.label}</span>
                </label>
              ))}
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
             filteredOrders.map(order => {
                const isExpanded = !!expandedOrders[order._id];
                return (
                  <div key={order._id} className="w-full bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.2)] transition-shadow rounded-sm flex flex-col group/row relative">
                    {/* Order-level cancellation info banner */}
                    {order.orderStatus === 'cancelled' && (
                      <div className="bg-red-50 border-b border-red-100 px-6 py-3">
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <div>
                              <p className="text-sm font-semibold text-red-700">Order Cancelled</p>
                              {order.cancellationReason && <p className="text-xs text-red-600 mt-1">Reason: {order.cancellationReason}</p>}
                            </div>
                          </div>
                          <button 
                            onClick={() => viewInvoice(order)}
                            className="text-xs font-bold text-blue-600 uppercase hover:underline whitespace-nowrap ml-4"
                          >
                            View Invoice
                          </button>
                        </div>
                      </div>
                    )}
                    {order.items?.map((item, index) => {
                      const statusInfo = getStatusDisplay(order.orderStatus, order.createdAt, order);
                      return (
                        <div key={index} className="flex flex-col sm:flex-row gap-6 p-4 sm:p-6 border-b border-gray-100 last:border-0 relative hover:bg-gray-50/50 transition-colors">
                          {/* Image */}
                          <div className="w-20 h-28 sm:w-20 sm:h-28 shrink-0 overflow-hidden relative group">
                            <img 
                              src={getFullImgUrl(item.image)} 
                              alt={item.name} 
                              className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300"
                              onError={e => { if (orderFallback && e.target.src !== orderFallback) e.target.src = orderFallback; else e.target.style.display = 'none'; }}
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
                              {formatPrice((item.price * item.quantity) || 0, order.currency || 'INR')}
                            </p>
                          </div>
    
                          {/* Status */}
                          <div className="w-full sm:w-72 shrink-0 mt-4 sm:mt-0 flex flex-col">
                            <div className="flex gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${statusInfo.color}`} />
                              <div>
                                <p className="text-sm text-black font-semibold">{statusInfo.text}</p>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{statusInfo.sub}</p>
                                {(order.trackingId && !order.returnRequested) && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-0.5">
                                       <p className="text-[11px] font-bold text-black flex items-center gap-1">📦 Tracking</p>
                                       <p className="text-[11px] font-bold text-[#2874f0] font-sans">{order.carrierName} ({order.trackingId})</p>
                                    </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-4 flex gap-4 pl-5">
                              {/* Order Actions - only for non-cancelled orders */}
                              {!order.returnRequested && order.orderStatus !== 'cancelled' && (
                                <>
                                  {(order.orderStatus === 'processing' || order.orderStatus === 'pending') && (
                                    <button 
                                      onClick={(e) => { e.preventDefault(); handleCancelOrder(order._id); }}
                                      className="text-xs font-bold text-red-500 uppercase hover:underline flex items-center gap-1"
                                    >
                                      Cancel Order
                                    </button>
                                  )}
                                  
                                  {order.orderStatus === 'delivered' && (
                                     isReturnExpired(order) ? (
                                        <span className="text-xs font-bold text-gray-400 uppercase cursor-not-allowed" title={`Return window of ${returnDays} days has closed`}>Return Window Closed</span>
                                     ) : (
                                       <button 
                                         onClick={() => { setSelectedReturnOrder(order._id); setReturnModalOpen(true); }}
                                         className="text-xs font-bold text-orange-500 uppercase hover:underline"
                                       >
                                         Return Order
                                       </button>
                                     )
                                  )}
                              )}
                              {/* For non-cancelled orders, show View Invoice button */}
                              {order.orderStatus !== 'cancelled' && !order.returnRequested && (
                                <button 
                                  onClick={() => viewInvoice(order)}
                                  className="text-xs font-bold text-[#2874f0] uppercase hover:underline"
                                >
                                  View Invoice
                                </button>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-md shadow-2xl p-8 my-8 relative">
            <button 
              onClick={() => setInvoiceOrder(null)} 
              className="absolute text-2xl right-4 top-4 text-gray-400 hover:text-black hover:scale-110 transition-transform"
            >
              ×
            </button>

            {/* Invoice Header */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-black">INVOICE</h1>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Order ID: #{invoiceOrder._id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Order Status */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded ${invoiceOrder.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : invoiceOrder.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {invoiceOrder.orderStatus}
                </span>
                {invoiceOrder.cancellationReason && <p className="text-xs text-red-600">Reason: {invoiceOrder.cancellationReason}</p>}
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-4">Order Items</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left font-bold text-gray-700 pb-2">Product</th>
                    <th className="text-left font-bold text-gray-700 pb-2">Size/Color</th>
                    <th className="text-center font-bold text-gray-700 pb-2">Qty</th>
                    <th className="text-right font-bold text-gray-700 pb-2">Price</th>
                    <th className="text-right font-bold text-gray-700 pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceOrder.items?.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3 text-gray-800">{item.name}</td>
                      <td className="py-3 text-gray-600">{item.size} / {item.color}</td>
                      <td className="py-3 text-center text-gray-800">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-800">{formatPrice(item.price, invoiceOrder.currency || 'INR')}</td>
                      <td className="py-3 text-right font-bold text-gray-900">{formatPrice(item.price * item.quantity, invoiceOrder.currency || 'INR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mb-8 flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(invoiceOrder.subtotal || invoiceOrder.totalAmount, invoiceOrder.currency)}</span>
                </div>
                {invoiceOrder.shippingAmount > 0 && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Shipping</span>
                    <span>{formatPrice(invoiceOrder.shippingAmount, invoiceOrder.currency)}</span>
                  </div>
                )}
                {invoiceOrder.taxAmount > 0 && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{invoiceOrder.taxName || 'Tax'} ({invoiceOrder.taxPercentage}%)</span>
                    <span>{formatPrice(invoiceOrder.taxAmount, invoiceOrder.currency)}</span>
                  </div>
                )}
                {invoiceOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-600 font-bold">
                    <span>Discount</span>
                    <span>-{formatPrice(invoiceOrder.discountAmount, invoiceOrder.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-2 mt-2">
                  <span>Total Amount</span>
                  <span className="text-lg">{formatPrice(invoiceOrder.totalAmount, invoiceOrder.currency)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 text-center">
              <p className="text-[11px] text-gray-500">Thank you for your order!</p>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors uppercase tracking-wide"
                >
                  Print Invoice
                </button>
                <button
                  onClick={() => setInvoiceOrder(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-xs font-bold rounded hover:bg-gray-300 transition-colors uppercase tracking-wide"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Policy Request Modal */}
      {returnModalOpen && (
         <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
             <div className="bg-white max-w-lg w-full rounded-md shadow-2xl p-6 relative">
                 <button onClick={() => { setReturnModalOpen(false); setSelectedReturnOrder(null); }} className="absolute text-xl right-4 top-4 text-gray-400 hover:text-black hover:scale-110 transition-transform">×</button>
                 <h2 className="text-xl font-bold text-[#212121] mb-2 uppercase tracking-wide">Return Request</h2>
                 
                  <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-sm mb-5 mt-2">
                     <p className="text-xs text-blue-800 font-medium tracking-wide">Return Policy:</p>
                     <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
                        We accept returns within {returnDays} days of delivery. For damages or defects, you <strong>must</strong> attach clear pictures. Our team will review your request and process the refund accordingly.
                     </p>
                  </div>

                 <div className="space-y-4">
                    <div>
                       <label className="block text-xs font-bold text-gray-600 mb-1.5 align-text-bottom">Reason for return *</label>
                       <textarea 
                           className="w-full border border-gray-300 rounded-sm focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0] outline-none p-3 text-sm resize-none h-24 text-[#212121] placeholder:text-gray-400 transition-all font-sans"
                           placeholder="Please provide specific details about why you are returning the item(s)..."
                           value={returnReason}
                           onChange={e => setReturnReason(e.target.value)}
                       />
                    </div>
                    
                    <div>
                       <label className="block text-xs font-bold text-gray-600 mb-1.5 items-center gap-1">Upload Damage Photo (Optional)</label>
                       <div className="flex items-center justify-center w-full">
                          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 ${returnImage ? 'border-solid border-[#2874f0] bg-blue-50/20' : 'border-dashed border-gray-300'} rounded-sm cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden`}>
                              {returnImage ? (
                                  <>
                                     <img src={returnImage} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                     <div className="z-10 bg-white/90 px-3 py-1 rounded shadow text-xs font-bold text-[#2874f0] hover:text-red-500 transition-colors">Change Image</div>
                                  </>
                              ) : (
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <svg className="w-8 h-8 mb-4 text-[#2874f0]/70" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                      </svg>
                                      <p className="text-xs text-gray-500 font-medium"><span className="font-bold underline text-[#2874f0]">Click to upload</span> or drag and drop</p>
                                  </div>
                              )}
                              <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                          </label>
                      </div>
                    </div>

                    <button 
                       onClick={submitReturn}
                       className="w-full bg-[#fb641b] hover:bg-[#e65c19] text-white font-medium text-sm py-3.5 mt-2 rounded-[2px] shadow-sm transition-colors uppercase tracking-widest mt-6"
                    >
                       Submit Return Request
                    </button>
                 </div>
             </div>
         </div>
      )}
       
      {/* Cancellation Reason Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-md shadow-2xl p-6 relative">
            <button onClick={() => { setCancelModalOpen(false); setSelectedCancelOrder(null); setCancelReason(''); }} className="absolute text-xl right-4 top-4 text-gray-400 hover:text-black hover:scale-110 transition-transform">×</button>
            <h2 className="text-xl font-bold text-[#212121] mb-2 uppercase tracking-wide">Cancel Order</h2>
            
            <div className="bg-red-50 border border-red-100 p-3 rounded-sm mb-5 mt-2">
              <p className="text-[11px] text-red-700 leading-relaxed font-medium">
                Cancellation is only possible for orders in 'Processing' status. Once cancelled, this action cannot be undone.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Reason for Cancellation *</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    "Expected delivery time is too long", 
                    "Found a better price elsewhere", 
                    "Ordered by mistake", 
                    "Need to modify order details", 
                    "Changed my mind",
                  ].map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setCancelReason(reason)}
                      className={`px-3 py-1.5 text-xs rounded-[2px] border transition-colors border-gray-300 ${
                        cancelReason === reason 
                          ? "bg-red-50 border-red-500 text-red-700 font-bold ring-1 ring-red-500" 
                          : "bg-white text-gray-600 hover:border-red-400 hover:text-red-500"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Any other reason</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none p-3 text-sm resize-none h-20 text-[#212121] placeholder:text-gray-400 transition-all font-sans"
                  placeholder="Please specify if it's for another reason..."
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                />
              </div>

              <button 
                onClick={executeCancel}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium text-sm py-3.5 mt-2 rounded-[2px] shadow-sm transition-colors uppercase tracking-widest mt-6"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useLocation } from 'react-router-dom';

export function OrderSuccess() {
  const { state } = useLocation();
  const orderId = state?.orderId || '';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-xl bg-white border border-gray-100 p-12 md:p-16 shadow-2xl relative overflow-hidden group rounded-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
        
        <div className="w-16 h-16 bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-8 rounded-xl ring-8 ring-green-50/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-green-600 mb-4">Order Confirmed</p>
        <h1 className="font-serif text-4xl text-gray-900 font-bold mb-6 tracking-tight">Thank You!</h1>
        
        {orderId && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8 max-w-sm mx-auto">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Your Order ID</p>
            <p className="font-sans font-bold text-gray-900 break-all select-all cursor-pointer hover:text-purple-600 transition-colors"
               onClick={() => {
                 navigator.clipboard.writeText(orderId);
                 toast.success('Order ID copied!');
               }}>
              {orderId}
            </p>
            <p className="text-[10px] text-gray-400 mt-2 italic">Save this for guest tracking</p>
          </div>
        )}

        <p className="text-gray-500 leading-relaxed mb-10 max-w-sm mx-auto text-sm font-light">
          Your acquisition is being prepared with precision. A confirmation will be sent to your email shortly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/track-order" className="btn-primary min-w-[180px] bg-purple-600 hover:bg-purple-700 shadow-purple-600/20">Track Journey</Link>
          <Link to="/collection" className="btn-ghost min-w-[180px] border-gray-200">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}

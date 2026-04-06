import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../api';
import { useShop } from '../context/ShopContext';
import { getFullImgUrl } from '../utils/imageUtils';
import { PRODUCT_FALLBACK } from '../assets/images';
import { toast } from 'react-toastify';
import { formatPrice } from '../utils/priceUtils';

export default function TrackOrder() {
  const location = useLocation();
  const { BACKEND_URL } = useShop();
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnPreviews, setReturnPreviews] = useState([]); // Base64 for display
  const [returnFiles, setReturnFiles] = useState([]); // File objects for upload
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const handleTrack = useCallback(async (e, manualId, manualEmail) => {
    if (e) e.preventDefault();
    const targetId = manualId || orderId;
    const targetEmail = manualEmail || email;
    
    if (!targetId || !targetEmail) return;

    setLoading(true);
    setOrder(null);
    try {
      const res = await API.post('/orders/tracking', { orderId: targetId, email: targetEmail });
      if (res.data.success) {
        setOrder(res.data.order);
        setOrderId(targetId);
        setEmail(targetEmail);
        if (!manualId) toast.success('Order found!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order not found or invalid details');
    } finally {
      setLoading(false);
    }
  }, [orderId, email]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setUploadingImages(true);
    setReturnFiles(prev => [...prev, ...files]);

    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    try {
      const base64Images = await Promise.all(promises);
      setReturnPreviews(prev => [...prev, ...base64Images]);
    } catch (err) {
      toast.error('Failed to process images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleGuestReturn = async (e) => {
    if (e) e.preventDefault();
    
    if (!returnReason.trim()) {
      toast.error('Please provide a reason for the return');
      return;
    }

    if (returnFiles.length === 0) {
      toast.error('Please upload at least one image showing the condition of the items');
      return;
    }

    setSubmittingReturn(true);
    try {
      const formData = new FormData();
      formData.append('orderId', order._id);
      formData.append('email', email);
      formData.append('reason', returnReason);
      returnFiles.forEach(file => {
        formData.append('images', file);
      });

      const res = await API.post('/orders/guest-return', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Return request submitted successfully!');
        setOrder(res.data.order);
        setShowReturnForm(false);
        setReturnReason('');
        setReturnPreviews([]);
        setReturnFiles([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  useEffect(() => {
    if (location.state?.orderId && location.state?.email) {
      handleTrack(null, location.state.orderId, location.state.email);
    }
  }, [location.state, handleTrack]);

  const getStatusDisplay = (status, date) => {
    const d = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    switch(status) {
      case 'processing': return { text: `In Progress`, color: 'bg-blue-500', icon: '⚡' };
      case 'shipped': return { text: `Dispatched`, color: 'bg-purple-500', icon: '🚚' };
      case 'delivered': return { text: `Delivered`, color: 'bg-green-500', icon: '✅' };
      case 'cancelled': return { text: `Cancelled`, color: 'bg-red-500', icon: '❌' };
      default: return { text: `Confirmed`, color: 'bg-gray-500', icon: '🛒' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-6">
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-bold mb-4 text-gray-900 tracking-tight">Track Your Journey</h1>
          <p className="text-gray-500 text-sm font-medium tracking-widest uppercase text-[10px]">Enter your order credentials below</p>
        </div>

        {!order ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50">
            <form onSubmit={handleTrack} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#000000]">Order ID</label>
                <input 
                  required 
                  value={orderId} 
                  onChange={e => setOrderId(e.target.value)} 
                  placeholder="Full Order ID (e.g. 66e...)" 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#000000]">Email Address</label>
                <input 
                  required 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="your@email.com" 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all" 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-purple-600 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-all rounded-xl shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Order'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
             {/* If arrived from checkout */}
             {location.state?.orderId && (
                <div className="p-6 bg-green-600 rounded-2xl text-white shadow-xl shadow-green-600/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                   <div className="relative">
                      <h2 className="font-serif text-2xl font-bold mb-1">CONGRATULATIONS!</h2>
                      <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-3">Your order has been placed successfully</p>
                      <div className="flex flex-col gap-1.5 p-3 bg-black/10 rounded-xl border border-white/10">
                         <span className="text-[9px] uppercase tracking-widest font-bold opacity-60">Save your Order ID for tracking later:</span>
                         <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-mono font-bold break-all">{order._id}</span>
                            <button 
                              onClick={() => { navigator.clipboard.writeText(order._id); toast.success('Copied!'); }}
                              className="px-3 py-1.5 bg-white text-green-600 rounded-lg text-[10px] font-bold hover:bg-opacity-90 transition-all"
                            >
                              COPY
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Currently</p>
                   <h2 className="text-2xl font-bold text-gray-900">{getStatusDisplay(order.orderStatus).text}</h2>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl">
                   {getStatusDisplay(order.orderStatus).icon}
                </div>
             </div>

             <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg space-y-8">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                   <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Tracking Number</p>
                      <p className="text-xs font-bold text-gray-600 tracking-wider">#{order._id}</p>
                   </div>
                   <p className="text-xs font-bold text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="space-y-4">
                   {order.items.map((item, i) => (
                      <div key={i} className="flex gap-4 items-center">
                         <div className="w-14 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                            <img 
                              src={getFullImgUrl(item.image, BACKEND_URL)} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              onError={e => { e.target.src = PRODUCT_FALLBACK; }}
                            />
                         </div>
                         <div className="flex-1">
                            <h4 className="font-bold text-sm text-gray-900">{item.name}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{item.size} • {item.color} • Qty {item.quantity}</p>
                         </div>
                         <p className="font-bold text-sm text-gray-900">{formatPrice(item.price * item.quantity, order.currency)}</p>
                      </div>
                   ))}
                </div>

                <div className="pt-6 border-t border-gray-50 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.subtotal || order.totalAmount, order.currency)}</span>
                    </div>
                    {order.taxAmount > 0 && (
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                            <span>{order.taxName}</span>
                            <span>{formatPrice(order.taxAmount, order.currency)}</span>
                        </div>
                    )}
                    {order.shippingAmount > 0 && (
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                            <span>Shipping</span>
                            <span>{formatPrice(order.shippingAmount, order.currency)}</span>
                        </div>
                    )}
                    {order.discountAmount > 0 && (
                        <div className="flex justify-between text-xs text-green-600 font-bold">
                            <span>Discount</span>
                            <span>-{formatPrice(order.discountAmount, order.currency)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-4 text-gray-900">
                        <span className="font-bold text-sm uppercase tracking-widest">Total</span>
                        <span className="text-xl font-bold">{formatPrice(order.totalAmount, order.currency)}</span>
                    </div>
                </div>

                {order.trackingId && (
                   <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">Shipping Details</p>
                      <p className="text-sm font-bold text-gray-900">{order.carrierName}: <span className="text-purple-600">{order.trackingId}</span></p>
                   </div>
                )}
             </div>

              {/* Return Section for Guests */}
              {order.orderStatus === 'delivered' && !order.returnRequested && (
                <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-lg shadow-orange-500/5 mt-4">
                   {!showReturnForm ? (
                      <div className="flex flex-col items-center text-center gap-4">
                         <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-xl">🔄</div>
                         <div>
                            <h3 className="font-bold text-gray-900">Need to return this?</h3>
                            <p className="text-xs text-gray-500 mt-1">You can request a return within the eligible window.</p>
                         </div>
                         <button 
                           onClick={() => setShowReturnForm(true)}
                           className="px-6 py-2 bg-orange-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20"
                         >
                           Start Return Request
                         </button>
                      </div>
                   ) : (
                      <form onSubmit={handleGuestReturn} className="space-y-4">
                         <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => setShowReturnForm(false)} type="button" className="text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-widest">← Back</button>
                            <h3 className="flex-1 text-center font-bold text-sm text-gray-900 uppercase tracking-widest">Return Reason</h3>
                         </div>
                         <textarea 
                           required
                           value={returnReason}
                           onChange={e => setReturnReason(e.target.value)}
                           placeholder="Why would you like to return this order?"
                           className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all text-sm min-h-[100px]"
                         />

                         <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Photo Evidence (Mandatory)</label>
                            <div className="flex flex-wrap gap-3">
                               {returnPreviews.map((img, i) => (
                                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-orange-100 group">
                                     <img src={img} alt="" className="w-full h-full object-cover" />
                                     <button 
                                       type="button"
                                       onClick={() => {
                                          setReturnPreviews(prev => prev.filter((_, idx) => idx !== i));
                                          setReturnFiles(prev => prev.filter((_, idx) => idx !== i));
                                       }}
                                       className="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                     >
                                       ✕
                                     </button>
                                  </div>
                               ))}
                               <label className="w-20 h-20 rounded-xl border-2 border-dashed border-orange-100 bg-orange-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 transition-all">
                                  <span className="text-2xl text-orange-400">+</span>
                                  <span className="text-[8px] font-bold text-orange-400 uppercase tracking-tighter">Add Photo</span>
                                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                               </label>
                            </div>
                         </div>

                         <button 
                           type="submit"
                           disabled={submittingReturn || uploadingImages || returnFiles.length === 0}
                           className="w-full py-4 bg-orange-600 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-orange-700 transition-all rounded-xl shadow-lg shadow-orange-600/20 disabled:opacity-50"
                         >
                           {submittingReturn ? 'Submitting...' : 'Submit Return Request'}
                         </button>
                      </form>
                   )}
                </div>
              )}

              {/* Return Status if already requested */}
              {order.returnRequested && (
                <div className={`p-6 rounded-2xl border shadow-lg flex items-center justify-between mt-4 ${
                   order.returnStatus === 'approved' ? 'bg-green-50 border-green-100' : 
                   order.returnStatus === 'rejected' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'
                }`}>
                   <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Return Request</p>
                      <h2 className={`text-xl font-bold ${
                         order.returnStatus === 'approved' ? 'text-green-700' : 
                         order.returnStatus === 'rejected' ? 'text-red-700' : 'text-blue-700'
                      }`}>
                         {order.returnStatus.charAt(0).toUpperCase() + order.returnStatus.slice(1)}
                      </h2>
                      <div className="mt-2 space-y-2">
                         <p className="text-[10px] text-gray-500 italic font-bold leading-relaxed">Reason: {order.returnReason}</p>
                         {order.returnImages?.length > 0 && (
                            <div className="flex gap-2">
                               {order.returnImages.map((img, i) => (
                                   <div key={i} className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 ring-2 ring-white">
                                     <img 
                                       src={getFullImgUrl(img, BACKEND_URL)} 
                                       alt="" 
                                       className="w-full h-full object-cover" 
                                       onError={e => { e.target.src = PRODUCT_FALLBACK; }}
                                     />
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                   </div>
                   <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                      {order.returnStatus === 'approved' ? '✅' : order.returnStatus === 'rejected' ? '🚫' : '⏳'}
                   </div>
                </div>
              )}

             <button onClick={() => setOrder(null)} className="w-full py-4 bg-gray-900 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-black transition-all rounded-xl shadow-xl">
                Track Another Order
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

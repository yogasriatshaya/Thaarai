import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';
import { formatPrice } from '../utils/priceUtils';

export default function TrackOrder() {
  const location = useLocation();
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnPreviews, setReturnPreviews] = useState([]); 
  const [returnFiles, setReturnFiles] = useState([]); 
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
        if (!manualId) toast.success('Order synchronized.');
      }
    } catch (err) {
      toast.error('Details not matching our records');
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
      toast.error('Failed to process imagery');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleGuestReturn = async (e) => {
    if (e) e.preventDefault();
    
    if (!returnReason.trim()) {
      toast.error('Return reasoning required');
      return;
    }

    if (returnFiles.length === 0) {
      toast.error('Documentation required');
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
        toast.success('Return requested.');
        setOrder(res.data.order);
        setShowReturnForm(false);
        setReturnReason('');
      }
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setSubmittingReturn(false);
    }
  };

  useEffect(() => {
    if (location.state?.orderId && location.state?.email) {
      handleTrack(null, location.state.orderId, location.state.email);
    }
  }, [location.state, handleTrack]);

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'processing': return { text: `Processing`, icon: '✦' };
      case 'shipped': return { text: `Dispatched`, icon: '🚚' };
      case 'delivered': return { text: `Delivered`, icon: '✓' };
      case 'returned': return { text: `Returned`, icon: '⤺' };
      case 'cancelled': return { text: `void`, icon: '✕' };
      default: return { text: `Confirmed`, icon: '✧' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col justify-center py-16 px-6 text-black font-sans">
      <div className="max-w-md mx-auto w-full">
        
        {!order ? (
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-none border border-gray-100 shadow-xl shadow-gray-100/40 animate-fade-in w-full">
            <div className="text-center mb-8">
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400 mb-1.5 block">Track Journey</span>
                <h1 className="font-serif text-3xl font-bold text-gray-900 tracking-tight">Order Status</h1>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-1">Enter details to track your package.</p>
            </div>
            <form onSubmit={handleTrack} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Order ID</label>
                  <input 
                    required 
                    value={orderId.replace(/#/g, '')} 
                    onChange={e => setOrderId(e.target.value.toUpperCase())} 
                    placeholder="ENTER ORDER ID" 
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none font-sans text-sm font-bold tracking-widest placeholder:text-gray-300 transition-all uppercase" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value.toLowerCase())} 
                    placeholder="your@email.com" 
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none font-sans text-sm placeholder:text-gray-300 transition-all" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-black text-white text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all rounded-none shadow-lg shadow-black/10 disabled:opacity-50"
              >
                {loading ? 'Tracking...' : 'Track My Order'}
              </button>
            </form>
          </div>
        ) : (
          <div className="animate-fade-in w-full max-w-4xl mx-auto space-y-12">
             <div className="text-center mb-10">
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400 mb-2 block">Tracking Result</span>
                <h2 className="text-xl font-black text-black uppercase tracking-[0.3em]">Order Summary</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                {/* Left Column: Status & Items */}
                <div className="md:col-span-12 lg:col-span-7 space-y-8">
                   <div className="bg-gray-50/50 border border-gray-100 p-8 rounded-2xl flex items-center justify-between">
                      <div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Current Status</p>
                         <h2 className="text-4xl font-serif font-black text-black uppercase tracking-tight leading-none">{getStatusDisplay(order.orderStatus).text}</h2>
                      </div>
                      <div className="text-5xl opacity-20 filter grayscale">
                         {getStatusDisplay(order.orderStatus).icon}
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-gray-100 pb-5">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Product Details</p>
                         <p className="text-[10px] font-bold text-black uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="space-y-6">
                         {order.items.map((item, i) => (
                            <div key={i} className="flex gap-6 items-center justify-between group">
                               <div className="flex gap-4 items-center">
                                  <div className="w-16 aspect-[3/4] bg-white flex-shrink-0 border border-gray-100 shadow-sm overflow-hidden">
                                     <img src={item.image} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                  </div>
                                  <div className="space-y-1.5">
                                     <h4 className="font-serif text-base font-bold text-black uppercase tracking-tight">{item.name}</h4>
                                     <div className="flex flex-wrap gap-x-5 gap-y-1">
                                        {item.size && (
                                           <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Size</span>
                                              <span className="text-[11px] font-black text-black uppercase tracking-widest">{item.size}</span>
                                           </div>
                                        )}
                                        {item.color && (
                                           <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Color</span>
                                              <span className="text-[11px] font-black text-black uppercase tracking-widest">{item.color}</span>
                                           </div>
                                        )}
                                     </div>
                                     <div className="pt-2">
                                        <div className="inline-flex items-center px-2 py-1 bg-gray-50 border border-gray-200 text-[10px] font-black tracking-[0.2em] text-black uppercase">
                                           Qty {item.quantity}
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               <p className="font-sans text-base font-bold text-black lining-nums">{formatPrice(item.price * item.quantity, order.currency)}</p>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Right Column: Calculations & ID */}
                <div className="md:col-span-12 lg:col-span-5 space-y-8">
                   <div className="bg-white border-2 border-black p-8 space-y-6 shadow-sm">
                      <div className="space-y-3 pb-6 border-b border-gray-100">
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Order Reference</p>
                         <p className="text-[11px] font-black tracking-[0.2em] text-black break-keep whitespace-nowrap overflow-hidden text-ellipsis truncate">{order._id.toUpperCase()}</p>
                      </div>

                      <div className="space-y-4">
                         <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            <span>Subtotal</span>
                            <span className="text-black">{formatPrice(order.subtotal || order.totalAmount, order.currency)}</span>
                         </div>
                         <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            <span>Delivery Fee</span>
                            <span className="text-black">{order.shippingAmount > 0 ? formatPrice(order.shippingAmount, order.currency) : 'FREE'}</span>
                         </div>
                         {order.taxAmount > 0 && (
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500">
                               <span>{order.taxName || 'GST'} ({order.taxPercentage}%)</span>
                               <span className="text-black">{formatPrice(order.taxAmount, order.currency)}</span>
                            </div>
                         )}
                         {order.discountAmount > 0 && (
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-green-600">
                               <span>Discount Applied</span>
                               <span>-{formatPrice(order.discountAmount, order.currency)}</span>
                            </div>
                         )}
                         <div className="pt-6 border-t border-black flex justify-between items-end">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Grand Total</span>
                            <span className="text-4xl font-serif font-black text-black leading-none">{formatPrice(order.totalAmount, order.currency)}</span>
                         </div>
                      </div>

                      {order.trackingId && (
                         <div className="pt-6 border-t border-gray-100 space-y-4">
                            <div className="space-y-1">
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Shipping Via</p>
                               <p className="text-[13px] font-black text-black uppercase tracking-[0.1em]">{order.carrierName || 'Standard Courier'}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg space-y-2">
                               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Tracking Number</p>
                                  <div className="flex items-center justify-between">
                                  <p className="text-sm font-black text-black tracking-[0.2em] leading-tight">{order.trackingId}</p>
                               </div>
                            </div>
                         </div>
                      )}
                   </div>
                </div>
             </div>

              {/* Simplified Return Action */}
              {order.orderStatus === 'delivered' && !order.returnRequested && (
                <div className="pt-10 border-t border-gray-100 text-center">
                   {!showReturnForm ? (
                      <div className="space-y-6">
                         <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest italic leading-relaxed">Want to return or exchange?</p>
                         <button 
                           onClick={() => setShowReturnForm(true)}
                           className="px-10 py-3 border border-black text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all shadow-md"
                         >
                           Request Return
                         </button>
                      </div>
                   ) : (
                      <form onSubmit={handleGuestReturn} className="space-y-10 animate-fade-in text-left">
                         <div className="space-y-4">
                            <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-black">Reason for Return</label>
                            <textarea 
                              required
                              value={returnReason}
                              onChange={e => setReturnReason(e.target.value)}
                              placeholder="Please tell us what happened..."
                              className="w-full py-4 min-h-[100px] bg-transparent border-b border-black focus:border-gray-500 outline-none transition-all font-serif text-lg font-bold italic placeholder:text-gray-100"
                            />
                         </div>

                         <div className="space-y-6">
                            <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-black">Add Photos (Required)</label>
                            <div className="flex flex-wrap gap-4">
                               {returnPreviews.map((img, i) => (
                                  <div key={i} className="relative w-20 aspect-square bg-gray-50 border border-black">
                                     <img src={img} alt="" className="w-full h-full object-cover grayscale" />
                                  </div>
                               ))}
                               <label className="w-20 aspect-square border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all">
                                  <span className="text-2xl opacity-20 text-black">+</span>
                                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>
                         </div>

                         <div className="flex gap-4">
                            <button 
                                type="submit"
                                disabled={submittingReturn || uploadingImages || returnFiles.length === 0}
                                className="flex-1 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:opacity-80 transition-all disabled:opacity-30 shadow-xl"
                            >
                                Submit Request
                            </button>
                            <button 
                                type="button"
                                onClick={() => setShowReturnForm(false)}
                                className="px-8 py-4 border border-gray-100 text-[11px] font-bold uppercase tracking-[0.2em]"
                            >
                                Cancel
                            </button>
                         </div>
                      </form>
                   )}
                </div>
              )}

              {order.returnRequested && (
                <div className="p-8 border border-black bg-white text-center space-y-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] italic leading-none">Return Status</p>
                    <h2 className="text-3xl font-serif font-black italic text-black leading-none">{order.returnStatus.toUpperCase()}</h2>
                    <p className="text-xs text-black font-bold uppercase tracking-widest italic">We are reviewing your request.</p>
                </div>
              )}

             <div className="pt-10 flex justify-center">
                <button 
                   onClick={() => setOrder(null)} 
                   className="px-12 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-gray-800 transition-all shadow-xl block text-center"
                >
                   Track Another Order
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

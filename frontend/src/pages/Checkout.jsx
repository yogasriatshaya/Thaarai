import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import API from '../api';
import { toast } from 'react-toastify';
import { PRODUCT_FALLBACK } from '../assets/images';
import { MOCK_PRODUCTS } from '../data/mockProducts';

export default function Checkout() {
  const { cartData, setCartData, token, BACKEND_URL, removeFromCart } = useShop();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [form, setForm] = useState({
    fullName: '', phone: '', addressLine: '', city: '', postalCode: '', country: 'India'
  });
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponId, setCouponId] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const loadCart = async () => {
      const items = [];
      for (const key in cartData) {
        const item = cartData[key];
        if (item?.productId) {
          if (item.productId.startsWith('mock_')) {
            const mock = MOCK_PRODUCTS.find(p => p._id === item.productId);
            if (mock) items.push({ ...mock, ...item });
          } else if (item.productId.startsWith('local_')) {
            const localData = localStorage.getItem('thaarai_local_products');
            const locals = localData ? JSON.parse(localData) : [];
            const local = locals.find(p => p._id === item.productId);
            if (local) items.push({ ...local, ...item });
          } else {
            try {
              const res = await API.get(`/products/${item.productId}`);
              items.push({ ...res.data.product, ...item });
            } catch { }
          }
        }
      }
      setCartItems(items);
    };
    loadCart();
  }, [cartData, token]);

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery = subtotal > 500 ? 0 : 35;
  const total = Math.max(0, subtotal + delivery - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    try {
      const res = await API.post('/coupons/apply', { code: couponCode, totalAmount: subtotal });
      if (res.data.success) {
        setDiscount(res.data.discount);
        setCouponId(res.data.couponId);
        toast.success('Coupon Applied Successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply coupon');
      setDiscount(0); setCouponId(null);
    } finally { setCouponLoading(false); }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.addressLine || !form.city || !form.postalCode) {
      toast.error('Please fill all delivery fields');
      return;
    }

    const orderItems = cartItems.map(i => {
      let imageUrl = '';
      if (i.images?.[0]) {
        imageUrl = i.images[0].startsWith('http') ? i.images[0] : `${BACKEND_URL}${i.images[0]}`;
      }
      const itemToSave = {
        name: i.name,
        image: imageUrl,
        price: i.price,
        size: i.size,
        color: i.color,
        quantity: i.quantity
      };

      // Omit invalid ObjectIds for Mock or Local products
      if (i._id && !i._id.startsWith('mock_') && !i._id.startsWith('local_')) {
        itemToSave.productId = i._id;
      }

      return itemToSave;
    });

    setLoading(true);
    try {
      // Temporarily bypassing payment gateways to place orders directly
      const res = await API.post('/orders/create', {
        items: orderItems,
        address: form,
        totalAmount: total,
        paymentMethod: paymentMethod,
        couponId: couponId
      });

      if (res.data.success) {
        setCartData({});
        navigate('/order-success');
        toast.success('Order placed successfully (Payment Gateway bypassed for now)!');
      }
    } catch (err) {
      toast.error('Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50/50 text-gray-900 font-sans overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-rose-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />

      <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold mb-2 text-gray-900 tracking-tight">Checkout</h1>
          <p className="text-gray-500 text-sm font-medium tracking-wide uppercase text-[10px]">Secure & Seamless Purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Delivery & Payment (7 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            {/* Delivery Form */}
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-100/80 shadow-xl shadow-gray-100/40 space-y-5">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-2">
                <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm">1</span>
                <h2 className="text-lg font-bold text-gray-900">Delivery Address</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Name</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Sarah Jenkins" className="w-full p-3 bg-gray-50/80 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="Mobile Number" className="w-full p-3 bg-gray-50/80 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm" required />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Address Line</label>
                  <input name="addressLine" value={form.addressLine} onChange={handleChange} placeholder="Flat/House No, Street, Landmark" className="w-full p-3 bg-gray-50/80 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">City</label>
                  <input name="city" value={form.city} onChange={handleChange} placeholder="City Name" className="w-full p-3 bg-gray-50/80 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pincode</label>
                  <input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="600001" className="w-full p-3 bg-gray-50/80 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm" required />
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-100/80 shadow-xl shadow-gray-100/40 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <span className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm">2</span>
                <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
              </div>

              <div className="flex flex-col gap-3">
                <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-purple-400 bg-purple-50/40 ring-1 ring-purple-400' : 'border-gray-100 hover:border-gray-200 bg-gray-50/40'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-purple-500 text-lg">⚡</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">UPI / Cards / NetBanking</p>
                      <p className="text-[11px] text-gray-400">Instant & secure processing</p>
                    </div>
                  </div>
                  <input type="radio" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="w-4 h-4 accent-purple-600" />
                </label>

                <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-purple-400 bg-purple-50/40 ring-1 ring-purple-400' : 'border-gray-100 hover:border-gray-200 bg-gray-50/40'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 text-lg">🏠</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Cash on Delivery</p>
                      <p className="text-[11px] text-gray-400">Pay on doorstep handoff</p>
                    </div>
                  </div>
                  <input type="radio" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-4 h-4 accent-purple-600" />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-purple-600 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-all active:scale-[0.98] shadow-lg shadow-purple-600/20 rounded-xl disabled:opacity-40"
              >
                {loading ? 'Processing Order...' : 'Complete Purchase'}
              </button>

              <p className="text-[10px] text-center text-gray-400 px-4">
                By clicking "Complete Purchase", you agree to our terms of service and shipping policies.
              </p>
            </div>
          </form>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-100/80 shadow-xl shadow-gray-100/40 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
                <Link to="/cart" className="text-[10px] font-bold uppercase tracking-widest text-[#8b7fc0] hover:text-[#7b6ea8] transition-colors bg-[#aba0e3]/10 hover:bg-[#aba0e3]/20 px-3 py-1.5 rounded-full">
                  Edit Cart
                </Link>
              </div>

              <div className="space-y-4 max-h-[45vh] overflow-auto pr-2 custom-scrollbar">
                {cartItems.map((item, i) => (
                  <div key={i} className="flex gap-4 items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                      <img
                        src={item.images?.[0] ? (item.images[0].startsWith('http') ? item.images[0] : `${BACKEND_URL}${item.images[0]}`) : PRODUCT_FALLBACK}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = PRODUCT_FALLBACK; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">
                        {item.size} • {item.color}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              removeFromCart(item.productId, item.size, item.color);
                              if (cartItems.length === 1) navigate('/cart');
                            }}
                            className="text-red-400 hover:text-red-500 p-1.5 bg-red-50 hover:bg-red-100 rounded-full transition-colors flex items-center justify-center opacity-70 hover:opacity-100"
                            title="Remove Item"
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">
                          {(item.price * item.quantity).toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="PROMO CODE" className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-sans font-bold uppercase tracking-wider focus:outline-none focus:border-purple-400 focus:bg-white" />
                  <button type="button" disabled={couponLoading || discount > 0} onClick={handleApplyCoupon} className="bg-purple-100 text-purple-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-600 hover:text-white transition-all duration-300 disabled:opacity-50">
                    {discount > 0 ? 'Applied' : 'Apply'}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-3 text-sm">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal</span>
                  <span>
                    {subtotal.toLocaleString('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Delivery Charges</span>
                  <span className={delivery === 0 ? 'text-green-500 font-bold' : ''}>
                    {delivery === 0 ? 'FREE' : delivery.toLocaleString('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    })}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-gray-900 pt-4 border-t border-gray-100">
                  <span className="font-bold text-base">Total Amount</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
                    {total.toLocaleString('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

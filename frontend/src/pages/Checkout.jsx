import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useCurrency } from '../context/CurrencyContext';
import { getProductPrice } from '../utils/priceUtils';
import API from '../api';
import { toast } from 'react-toastify';

export default function Checkout() {
  const { cartData, setCartData, token, BACKEND_URL, getFullImgUrl, removeFromCart, settings } = useShop();
  const { formatPrice, country, currency, currencySymbol, countryName } = useCurrency();
  const navigate = useNavigate();
  const checkoutFallback = settings?.productFallback ? getFullImgUrl(settings.productFallback) : '';
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.id = 'razorpay-sdk';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(country === 'US' ? 'stripe' : 'cod');
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', addressLine: '', city: '', postalCode: '', country: countryName
  });

  useEffect(() => {
    if (settings?.maintenanceMode) {
      toast.error(settings.maintenanceMessage || 'Purchasing is currently disabled.');
      navigate('/cart');
    }
  }, [settings?.maintenanceMode, navigate, settings?.maintenanceMessage]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponId, setCouponId] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const validateField = (name, value) => {
    let error = '';
    const val = value.trim();
    
    if (!val) {
      error = `${name.replace(/([A-Z])/g, ' $1')} is required`;
    } else {
      if (name === 'fullName' && val.length > 40) error = 'Full name cannot exceed 40 characters';
      if (name === 'email') {
        if (!/\S+@\S+\.\S+/.test(val)) error = 'Please enter a valid email address';
        else if (val.length > 50) error = 'Email is too long (max 50)';
      }
      if (name === 'phone') {
        if (!/^\d+$/.test(val)) error = 'Phone should only contain numbers';
        else if (val.length < 10) error = 'Minimum 10 digits required';
        else if (val.length > 12) error = 'Phone cannot exceed 12 digits';
      }
      if (name === 'addressLine' && val.length > 100) error = 'Address is too long (max 100)';
      if (name === 'city' && val.length > 30) error = 'City name is too long (max 30)';
      if (name === 'postalCode') {
        if (!/^\d+$/.test(val)) error = 'Postal code should be numeric';
        else if (country === 'IN' && val.length !== 6) error = 'Pincode must be 6 digits';
      }
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    let finalValue = value;
    
    // Numeric formatting for specific fields
    if (name === 'phone' || name === 'postalCode') {
      finalValue = value.replace(/\D/g, '');
    }

    setForm({ ...form, [name]: finalValue });
    
    // Clear error while typing if it becomes valid
    if (touched[name]) {
      const error = validateField(name, finalValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Update form country when country switcher changes
  useEffect(() => {
    setForm(prev => ({ ...prev, country: countryName }));
    const cc = settings?.countryConfig?.[country];
    if (country === 'US') {
      setPaymentMethod('stripe');
    } else {
      setPaymentMethod(cc?.codAvailable !== false ? 'cod' : 'razorpay');
    }
  }, [country, countryName, settings]);

  useEffect(() => {
    const loadCart = async () => {
      const items = [];
      for (const key in cartData) {
        const item = cartData[key];
        if (item?.productId) {
          if (item.productId.startsWith('mock_')) {
            // Skip mock products
            continue;
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

  // Get country-specific config from settings
  const countryConfig = settings?.countryConfig?.[country] || {};
  const taxName = countryConfig.taxName || (country === 'US' ? 'Sales Tax' : 'GST');
  const taxPercentage = countryConfig.taxPercentage || 0;
  const taxInclusive = countryConfig.taxInclusive !== undefined ? countryConfig.taxInclusive : false;
  const freeShippingThreshold = countryConfig.freeShippingThreshold || (country === 'US' ? 50 : 500);
  const shippingFee = countryConfig.shippingFee || (country === 'US' ? 10 : 0);
  const codAvailable = countryConfig.codAvailable !== undefined ? countryConfig.codAvailable : (country === 'IN');

  // Calculate totals
  const subtotal = cartItems.reduce((sum, i) => sum + getProductPrice(i, country) * i.quantity, 0);
  
  useEffect(() => {
    // If cart becomes empty during checkout, redirect back to cart
    if (Object.keys(cartData).length === 0 && !loading) {
      navigate('/cart');
    }
  }, [cartData, navigate, loading]);

  const delivery = subtotal > freeShippingThreshold ? 0 : shippingFee;
  const netAmount = subtotal + delivery - discount;
  const finalTaxAmount = taxPercentage > 0 
    ? (taxInclusive 
        ? Math.round(netAmount * (taxPercentage / (100 + taxPercentage)) * 100) / 100
        : Math.round(netAmount * (taxPercentage / 100) * 100) / 100)
    : 0;
  
  const total = taxInclusive ? netAmount : netAmount + finalTaxAmount;
  const taxAmount = finalTaxAmount; // Save actual tax value regardless (for display/invoice)

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    try {
      const res = await API.post('/coupons/apply', { code: couponCode, totalAmount: subtotal, country });
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

  const hasUnavailableItems = cartItems.some(item => 
    (country === 'IN' && item.availableInIndia === false) ||
    (country === 'US' && item.availableInUS === false)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final check for all fields
    const newErrors = {};
    Object.keys(form).forEach(key => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(form).reduce((acc, k) => ({...acc, [k]: true}), {}));
      toast.error('Please correct the errors in the form');
      return;
    }

    if (hasUnavailableItems) {
      toast.error('Please remove items from your cart that are not available in your region.');
      return;
    }

    const orderItems = cartItems.map(i => {
      let imageUrl = '';
      const cartVariant = i.variants?.find(v => v.color === i.color);
      const displayImage = cartVariant?.image ? cartVariant.image : i.images?.[0];
      if (displayImage) {
        imageUrl = getFullImgUrl(displayImage);
      }
      const itemToSave = {
        name: i.name,
        image: imageUrl,
        price: getProductPrice(i, country),
        size: i.size,
        color: i.color,
        quantity: i.quantity
      };

      if (i._id && !i._id.startsWith('mock_') && !i._id.startsWith('local_')) {
        itemToSave.productId = i._id;
      }

      return itemToSave;
    });

    setLoading(true);
    try {
      const orderPayload = {
        items: orderItems,
        address: form,
        totalAmount: total,
        paymentMethod: paymentMethod,
        couponId: couponId,
        guestEmail: form.email,
        guestPhone: form.phone,
        currency,
        orderCountry: country,
        subtotal,
        taxAmount,
        taxName,
        taxPercentage,
        shippingAmount: delivery,
        discountAmount: discount
      };

      let res;
      if (paymentMethod === 'stripe') {
        res = await API.post('/orders/stripe', orderPayload);
        if (res.data.url) window.location.href = res.data.url;
        return;
      } else if (paymentMethod === 'razorpay') {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          toast.error('Razorpay SDK failed to load. Are you online?');
          setLoading(false);
          return;
        }

        res = await API.post('/orders/razorpay', orderPayload);
        const { razorpayOrderId, key, orderId } = res.data;
        const options = {
          key,
          amount: Math.round(total * 100),
          currency: currency.toUpperCase(),
          name: 'Thaarai Designers',
          description: 'Luxury Ethnic Wear',
          order_id: razorpayOrderId,
          handler: async (response) => {
            const verifyRes = await API.post('/orders/razorpay/verify', { ...response, orderId });
            if (verifyRes.data.success) {
              setCartData({});
              if (token) {
                navigate('/orders');
              } else {
                navigate('/track-order', { state: { orderId, email: form.email } });
              }
              toast.success('Payment successful!');
            }
          },
          prefill: { name: form.fullName, email: form.email, contact: form.phone },
          theme: { color: '#000000' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
        return;
      } else {
        res = await API.post('/orders/create', orderPayload);
      }

      if (res.data.success) {
        setCartData({});
        if (token) {
          navigate('/orders');
        } else {
          navigate('/track-order', { state: { orderId: res.data.order._id, email: form.email } });
        }
        toast.success('Order placed successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
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
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Full Name</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} onBlur={handleBlur} maxLength={40} placeholder="Sarah Jenkins" className={`w-full p-3 bg-gray-50/80 border ${errors.fullName && touched.fullName ? 'border-red-400' : 'border-gray-100'} rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm`} required />
                  {errors.fullName && touched.fullName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.fullName}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} maxLength={40} placeholder="sarah@example.com" className={`w-full p-3 bg-gray-50/80 border ${errors.email && touched.email ? 'border-red-400' : 'border-gray-100'} rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm`} required />
                  {errors.email && touched.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur} maxLength={12} placeholder="Mobile Number" className={`w-full p-3 bg-gray-50/80 border ${errors.phone && touched.phone ? 'border-red-400' : 'border-gray-100'} rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm`} required />
                  {errors.phone && touched.phone && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.phone}</p>}
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Address Line</label>
                  <input name="addressLine" value={form.addressLine} onChange={handleChange} onBlur={handleBlur} maxLength={100} placeholder={country === 'US' ? 'Street Address, Apt/Suite' : 'Flat/House No, Street, Landmark'} className={`w-full p-3 bg-gray-50/80 border ${errors.addressLine && touched.addressLine ? 'border-red-400' : 'border-gray-100'} rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm`} required />
                  {errors.addressLine && touched.addressLine && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.addressLine}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">City</label>
                  <input name="city" value={form.city} onChange={handleChange} onBlur={handleBlur} maxLength={30} placeholder="City Name" className={`w-full p-3 bg-gray-50/80 border ${errors.city && touched.city ? 'border-red-400' : 'border-gray-100'} rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm`} required />
                  {errors.city && touched.city && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.city}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{country === 'US' ? 'ZIP Code' : 'Pincode'}</label>
                  <input name="postalCode" value={form.postalCode} onChange={handleChange} onBlur={handleBlur} maxLength={country === 'IN' ? 6 : 10} placeholder={country === 'US' ? '10001' : '600001'} className={`w-full p-3 bg-gray-50/80 border ${errors.postalCode && touched.postalCode ? 'border-red-400' : 'border-gray-100'} rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm`} required />
                  {errors.postalCode && touched.postalCode && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.postalCode}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Country</label>
                  <input name="country" value={form.country} readOnly className="w-full p-3 bg-gray-100/50 border border-gray-100 rounded-xl text-sm text-gray-500 cursor-not-allowed" />
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
                {/* Online Payment - Razorpay for India, Stripe for US */}
                <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === (country === 'US' ? 'stripe' : 'razorpay') ? 'border-purple-400 bg-purple-50/40 ring-1 ring-purple-400' : 'border-gray-100 hover:border-gray-200 bg-gray-50/40'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-purple-500 text-lg">⚡</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {country === 'US' ? 'Credit/Debit Card' : 'UPI / Cards / NetBanking'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {country === 'US' ? 'Secure Stripe checkout' : 'Instant & secure processing'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    value={country === 'US' ? 'stripe' : 'razorpay'}
                    checked={paymentMethod === (country === 'US' ? 'stripe' : 'razorpay')}
                    onChange={() => setPaymentMethod(country === 'US' ? 'stripe' : 'razorpay')}
                    className="w-4 h-4 accent-purple-600"
                  />
                </label>

                {/* COD - only if available for this country */}
                {codAvailable && (
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
                )}
              </div>

              <button
                type="submit"
                disabled={loading || hasUnavailableItems}
                className={`w-full py-4 text-white text-[12px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] rounded-xl ${
                  hasUnavailableItems ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20 disabled:opacity-40'
                }`}
              >
                {loading ? 'Processing Order...' : hasUnavailableItems ? 'Remove Unavailable Items' : 'Complete Purchase'}
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
                <Link to="/cart" className="text-[10px] font-bold uppercase tracking-widest text-[#000000] hover:text-[#7b6ea8] transition-colors bg-[#000000]/10 hover:bg-[#000000]/20 px-3 py-1.5 rounded-full">
                  Edit Cart
                </Link>
              </div>

              <div className="space-y-4 max-h-[45vh] overflow-auto pr-2 custom-scrollbar">
                {cartItems.map((item, i) => {
                  const isItemUnavailable = (country === 'IN' && item.availableInIndia === false) ||
                                            (country === 'US' && item.availableInUS === false);
                  const cartVariant = item.variants?.find(v => v.color === item.color);
                  const displayImage = cartVariant?.image ? cartVariant.image : item.images?.[0];
                  return (
                  <div key={i} className={`flex gap-4 items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0 ${isItemUnavailable ? 'opacity-50' : ''}`}>
                    <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100 relative">
                      {isItemUnavailable && <div className="absolute inset-0 bg-red-500/10 z-10"></div>}
                      <img
                        src={displayImage ? getFullImgUrl(displayImage) : checkoutFallback}

                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={e => { 
                           if (checkoutFallback && e.target.src !== checkoutFallback) {
                              e.target.src = checkoutFallback;
                           }
                        }}
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
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-sm">
                            {formatPrice(getProductPrice(item, country) * item.quantity)}
                          </div>
                          {isItemUnavailable && <div className="text-[10px] text-red-500 font-bold mt-1">UNAVAILABLE</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>

              {/* Promo Code Input */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex gap-2">
                  <input type="text" maxLength={15} value={couponCode} onChange={e => setCouponCode(e.target.value.substring(0, 15).toUpperCase())} placeholder="PROMO CODE" className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-sans font-bold uppercase tracking-wider focus:outline-none focus:border-purple-400 focus:bg-white" />
                  <button type="button" disabled={couponLoading || discount > 0} onClick={handleApplyCoupon} className="bg-purple-100 text-purple-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-600 hover:text-white transition-all duration-300 disabled:opacity-50">
                    {discount > 0 ? 'Applied' : 'Apply'}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-3 text-sm">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Delivery</span>
                  <span className={delivery === 0 ? 'text-green-500 font-bold' : ''}>
                    {delivery === 0 ? 'FREE' : formatPrice(delivery)}
                  </span>
                </div>
                {/* Tax line */}
                {taxPercentage > 0 && (
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>{taxName} ({taxPercentage}%)</span>
                    <span>{formatPrice(taxAmount)} {taxInclusive && <span className="text-[10px] text-gray-400 font-medium">(Included)</span>}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-gray-900 pt-4 border-t border-gray-100">
                  <span className="font-bold text-base">Total Amount</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent">
                    {formatPrice(total)}
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

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useCurrency } from '../context/CurrencyContext';
import { getProductPrice, getProductOriginalPrice, getOfferPrice, getOfferActive } from '../utils/priceUtils';
import API from '../api';

export default function Cart() {
  const { cartData, updateCartQty, removeFromCart, getFullImgUrl, settings } = useShop();
  const { formatPrice, country } = useCurrency();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const navigate = useNavigate();

  const cartFallback = settings?.productFallback ? getFullImgUrl(settings.productFallback) : '';

  useEffect(() => {
    const loadCartItems = async () => {
      if (isInitialLoad) setLoading(true);
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
            if (local) items.push({ ...local, ...item, key });
          } else {
            try {
              const res = await API.get(`/products/${item.productId}`);
              items.push({ ...res.data.product, ...item, key });
            } catch { }
          }
        }
      }
      setCartItems(items);
      setLoading(false);
      setIsInitialLoad(false);
    };
    loadCartItems();
  }, [cartData]);

  const subtotal = cartItems.reduce((sum, item) => {
    // Use offer price if active, otherwise use regular price
    const itemPrice = getOfferActive(item, country) ? getOfferPrice(item, country) : getProductPrice(item, country);
    return sum + itemPrice * item.quantity;
  }, 0);
  
  const countryConfig = settings?.countryConfig?.[country];
  const freeThreshold = countryConfig?.freeShippingThreshold || (country === 'US' ? 50 : 500);
  const shippingFee = countryConfig?.shippingFee || (country === 'US' ? 10 : 35);
  const delivery = subtotal > freeThreshold ? 0 : shippingFee;
  
  const taxPercentage = countryConfig?.taxPercentage || 0;
  const taxInclusive = countryConfig?.taxInclusive !== undefined ? countryConfig.taxInclusive : false;
  
  const netAmount = subtotal + delivery;
  const finalTaxAmount = taxPercentage > 0 
    ? (taxInclusive 
        ? Math.round(netAmount * (taxPercentage / (100 + taxPercentage)) * 100) / 100
        : Math.round(netAmount * (taxPercentage / 100) * 100) / 100)
    : 0;
    
  const total = taxInclusive ? netAmount : netAmount + finalTaxAmount;

  const hasUnavailableItems = cartItems.some(item => 
    (country === 'IN' && item.availableInIndia === false) ||
    (country === 'US' && item.availableInUS === false)
  );

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-white min-h-screen">
      <div className="animate-pulse space-y-12">
        <div className="h-12 bg-gray-50 w-64 rounded-sm" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-8">
            <div className="h-48 bg-gray-50 rounded-sm" />
            <div className="h-48 bg-gray-50 rounded-sm" />
          </div>
          <div className="lg:col-span-4 h-96 bg-gray-50 rounded-sm" />
        </div>
      </div>
    </div>
  );

  if (cartItems.length === 0) return (
    <div className="min-h-[calc(100vh-110px)] flex items-center justify-center bg-white px-4 py-12">
      <div className="text-center p-10 md:p-16 max-w-md mx-auto relative w-full">
        <div className="w-20 h-20 bg-gray-50 flex items-center justify-center mx-auto mb-10 rounded-full">
          <svg width="30" height="30" fill="none" stroke="#000" strokeWidth="1" viewBox="0 0 24 24">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl text-black font-bold mb-6 tracking-tight">Your gallery is empty</h1>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#999] mb-12 leading-relaxed max-w-[300px] mx-auto">Explore our latest arrivals and curate your personal collection of luxury pieces.</p>
        <Link to="/collection" className="inline-block px-12 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:opacity-80 transition-all">Explore Collection</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen pb-24 text-black font-sans">
      <div className="max-w-7xl mx-auto px-6 pt-16 lg:pt-20 mb-12">
        <div className="flex flex-col gap-3 items-center text-center">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 mb-1">Step 1 of 2</span>
            <h1 className="font-serif text-4xl md:text-5xl font-black italic tracking-tight text-black">Your Shopping Bag</h1>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

        {/* Left: Items */}
        <div className="lg:col-span-8 space-y-12">
          <div className="divide-y divide-gray-100">
            {cartItems.map((item) => {
                const isItemUnavailable = (country === 'IN' && item.availableInIndia === false) ||
                                          (country === 'US' && item.availableInUS === false);
                const cartVariant = item.variants?.find(v => v.color === item.color);
                const displayImage = cartVariant?.images?.[0] ? cartVariant.images[0] : item.images?.[0];
                return (
                <div key={item.key} className={`py-10 flex flex-col md:flex-row gap-10 first:pt-0 ${isItemUnavailable ? 'opacity-30' : ''}`}>
                  {/* Image */}
                  <Link to={`/product/${item._id}`} className="block w-full md:w-48 aspect-[3/4] bg-gray-50 flex-shrink-0 relative overflow-hidden group border border-gray-100">
                    <img
                      src={getFullImgUrl(displayImage)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { 
                         if (cartFallback && e.target.src !== cartFallback) {
                            e.target.src = cartFallback;
                         } else {
                            e.target.style.display = 'none';
                         }
                      }}
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 flex flex-col pt-1">
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="font-serif text-2xl font-black tracking-tight text-black hover:opacity-70 transition-opacity leading-tight">
                         <Link to={`/product/${item._id}`}>{item.name}</Link>
                       </h3>
                       <button
                         onClick={() => removeFromCart(item._id, item.size, item.color)}
                         className="p-2 text-gray-400 hover:text-black transition-colors"
                         aria-label="Remove item"
                       >
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                       </button>
                    </div>

                    <div className="flex flex-wrap gap-8 mb-8 text-[11px] font-bold uppercase tracking-widest">
                      {item.size && (
                        <div className="space-y-1">
                           <span className="text-gray-400 block">Size</span>
                           <span className="text-black">{item.size}</span>
                        </div>
                      )}
                      {item.color && (
                        <div className="space-y-1">
                           <span className="text-gray-400 block">Color</span>
                           <span className="text-black">{item.color}</span>
                        </div>
                      )}
                      <div className="space-y-1">
                           <span className="text-gray-400 block">Price</span>
                           <div className="flex items-baseline gap-2">
                             {getOfferActive(item, country) ? (
                               <>
                                 <span className="text-black text-lg font-bold">{formatPrice(getOfferPrice(item, country))}</span>
                                 <span className="text-gray-400 line-through text-sm">{formatPrice(getProductPrice(item, country))}</span>
                               </>
                             ) : (
                               <span className="text-black">{formatPrice(getProductPrice(item, country))}</span>
                             )}
                           </div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-auto">
                        <div className="space-y-2">
                           <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block">Quantity</span>
                           <div className="flex items-center border border-black bg-white">
                             <button
                               onClick={() => updateCartQty(item._id, item.size, item.color, item.quantity - 1)}
                               className="w-10 h-10 flex items-center justify-center hover:bg-black hover:text-white transition-all disabled:opacity-10"
                             >
                               −
                             </button>
                             <span className="w-10 text-center text-xs font-bold tracking-widest">{item.quantity}</span>
                             <button
                               onClick={() => updateCartQty(item._id, item.size, item.color, item.quantity + 1)}
                               className="w-10 h-10 flex items-center justify-center hover:bg-black hover:text-white transition-all"
                             >
                               +
                             </button>
                           </div>
                        </div>

                        <div className="text-2xl font-serif font-black italic text-black">
                          {formatPrice((getOfferActive(item, country) ? getOfferPrice(item, country) : getProductPrice(item, country)) * item.quantity)}
                        </div>
                    </div>

                    {isItemUnavailable && <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-4">Out of stock in your region</p>}
                  </div>
                </div>
            )})}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-4 bg-white border border-black p-10 lg:sticky lg:top-24 space-y-10 shadow-lg">
          <div className="space-y-8">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black border-b border-gray-100 pb-4 italic">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-gray-500">Shipping</span>
                <span className={delivery === 0 ? 'text-green-600' : ''}>
                  {delivery === 0 ? 'Free' : formatPrice(delivery)}
                </span>
              </div>
              {finalTaxAmount > 0 && (
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                  <span className="text-gray-500">{countryConfig?.taxName || 'Tax'}</span>
                  <span>{taxInclusive ? 'Included' : formatPrice(finalTaxAmount)}</span>
                </div>
              )}

              <div className="pt-8 border-t border-gray-100 flex justify-between items-baseline">
                <span className="font-serif text-2xl font-black italic">Total</span>
                <span className="text-3xl font-serif font-black">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            disabled={hasUnavailableItems || settings?.maintenanceMode}
            className="w-full py-4 bg-black text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-gray-800 transition-all disabled:bg-gray-100 disabled:text-gray-400 shadow-xl"
          >
            {settings?.maintenanceMode ? 'Purchasing Disabled' : hasUnavailableItems ? 'Fix Region Issues' : 'Proceed to Checkout'}
          </button>

          <div className="text-center">
             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
               Prices and shipping verified for <span className="text-black font-black">{country}</span>.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

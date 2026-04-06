import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useCurrency } from '../context/CurrencyContext';
import { getProductPrice, getProductOriginalPrice } from '../utils/priceUtils';
import API from '../api';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { PRODUCT_FALLBACK } from '../assets/images';


export default function Cart() {
  const { cartData, updateCartQty, removeFromCart, BACKEND_URL, getFullImgUrl, settings } = useShop();
  const { formatPrice, country, currency } = useCurrency();
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
    };
    loadCartItems();
  }, [cartData]);

  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = getProductPrice(item, country);
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

  const getImg = (img) => getFullImgUrl(img);


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
    <div className="min-h-[calc(100vh-110px)] flex items-center justify-center bg-[#fcfbf7] px-4 py-12">
      <div className="text-center bg-white border border-gray-100 p-10 md:p-16 max-w-md mx-auto shadow-sm relative overflow-hidden rounded-sm w-full">
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: '#000000' }} />
        <div className="w-16 h-16 bg-gray-50 border border-gray-50 flex items-center justify-center mx-auto mb-8 rounded-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#000000" strokeWidth="1.2" viewBox="0 0 24 24">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-black font-bold mb-4 tracking-normal uppercase">Your Bag is Empty</h1>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-10 leading-relaxed max-w-[280px] mx-auto">Discover our curated collection of luxury pieces and find your next favorite.</p>
        <Link to="/collection" className="btn-primary inline-flex scale-90">Explore Collection</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f1f3f6] min-h-[calc(100vh-94px)] pt-4 pb-12 font-sans text-[#212121]">
      <div className="max-w-[1200px] mx-auto px-2 lg:px-4 flex flex-col lg:flex-row gap-4 items-start mt-4">

        {/* Left Section: Cart Items */}
        <div className="flex-1 w-full bg-transparent space-y-3">
          <div className="bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] rounded-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-medium text-black">My Cart ({cartItems.length})</h2>
            </div>

            {/* Item List */}
            <div className="divide-y divide-gray-100">
              {cartItems.map((item) => {
                const isItemUnavailable = (country === 'IN' && item.availableInIndia === false) ||
                                          (country === 'US' && item.availableInUS === false);
                const cartVariant = item.variants?.find(v => v.color === item.color);
                const displayImage = cartVariant?.image ? cartVariant.image : item.images?.[0];
                return (
                <div key={item.key} className={`p-4 sm:p-6 flex flex-col sm:flex-row gap-6 ${isItemUnavailable ? 'opacity-60 bg-red-50/20' : ''}`}>
                  {/* Left: Image & Qty */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-28 sm:w-28 sm:h-32 bg-transparent flex items-center justify-center relative group">
                      <img
                        src={getImg(displayImage)}
                        alt={item.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                        onError={e => { e.target.src = PRODUCT_FALLBACK; }}
                      />
                    </div>
                    {/* Quantity Adjustment */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQty(item._id, item.size, item.color, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full text-gray-400 hover:border-gray-400 disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <input
                        type="text"
                        value={item.quantity}
                        readOnly
                        className="w-10 h-7 border border-gray-300 text-center text-sm font-medium text-black rounded-sm outline-none"
                      />
                      <button
                        onClick={() => updateCartQty(item._id, item.size, item.color, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full text-gray-500 hover:border-gray-400"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Right: Details & Removal */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg text-[#212121] font-medium hover:text-[#2874f0] cursor-pointer transition-colors">
                        {item.name}
                      </h3>
                      {item.category && (
                        <p className="text-xs text-gray-400 mt-1 capitalize">{item.category}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
                        {item.size && <span>Size: <span className="text-black font-medium">{item.size}</span></span>}
                        {item.color && <span>Color: <span className="text-black font-medium">{item.color}</span></span>}
                      </div>

                      <div className="flex items-baseline gap-2 mt-4">
                        <p className="text-lg sm:text-xl font-bold text-black">
                          {formatPrice(getProductPrice(item, country))}
                        </p>
                        {getProductOriginalPrice(item, country) > 0 && getProductOriginalPrice(item, country) > getProductPrice(item, country) && (
                          <>
                            <p className="text-xs text-gray-400 line-through">
                              {formatPrice(getProductOriginalPrice(item, country))}
                            </p>
                            <p className="text-xs text-green-600 font-medium">
                              {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% off
                            </p>
                          </>
                        )}
                      </div>
                      {isItemUnavailable && <p className="text-xs text-red-500 font-bold mt-2">NOT AVAILABLE IN {country === 'IN' ? 'INDIA' : 'USA'}</p>}
                    </div>

                    <div className="border-t border-gray-100 sm:border-0 pt-4 sm:pt-0 mt-4 flex gap-6">
                      <button
                        onClick={() => removeFromCart(item._id, item.size, item.color)}
                        className="text-sm font-semibold uppercase text-black hover:text-[#2874f0] transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="p-4 border-t border-gray-100 flex justify-end bg-white shadow-[0_-2px_10px_0_rgba(0,0,0,0.05)] sticky bottom-0 z-10">
              <button
                onClick={() => navigate('/checkout')}
                disabled={hasUnavailableItems}
                className={`${hasUnavailableItems ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#fb641b] hover:bg-[#fb641b]/90'} text-white font-semibold text-base py-3 px-12 sm:px-16 uppercase tracking-wide rounded-sm shadow-sm transition-colors`}
              >
                {hasUnavailableItems ? 'Remove Unavailable Items' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Price Details */}
        <div className="w-full lg:w-[380px] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] rounded-sm sticky top-20">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Price Details</h2>
          </div>
          <div className="p-4 space-y-4 border-b border-gray-100">
            <div className="flex justify-between items-center text-sm text-black">
              <span>Price ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-black">
              <span>Delivery Charges</span>
              <span className={delivery === 0 ? 'text-green-600 font-medium' : ''}>
                {delivery === 0 ? 'FREE' : formatPrice(delivery)}
              </span>
            </div>
            {finalTaxAmount > 0 && (
              <div className="flex justify-between items-center text-sm text-black">
                <span>{countryConfig?.taxName || 'GST'} ({taxPercentage}%)</span>
                <span>{taxInclusive ? 'Included' : formatPrice(finalTaxAmount)}</span>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-dashed border-gray-200">
            <div className="flex justify-between items-center font-bold text-lg text-black mb-1">
              <span>Total Amount</span>
              <span>{formatPrice(total)}</span>
            </div>
            {taxInclusive && finalTaxAmount > 0 && (
              <p className="text-[10px] text-green-600 text-right">
                Includes {formatPrice(finalTaxAmount)} {countryConfig?.taxName || 'GST'}
              </p>
            )}
          </div>
          {delivery === 0 && (
            <div className="bg-gray-50/80 p-4 border-t border-gray-100 text-center">
              <p className="text-xs text-green-600 font-semibold flex items-center justify-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                You've unlocked FREE Delivery on this order
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

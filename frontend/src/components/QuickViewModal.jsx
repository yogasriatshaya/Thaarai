import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useCurrency } from '../context/CurrencyContext';
import { getProductPrice, getProductOriginalPrice } from '../utils/priceUtils';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';

export default function QuickViewModal({ product, isOpen, onClose }) {
  const { addToCart, getFullImgUrl, toggleWishlist, isWishlisted, settings } = useShop();
  const quickFallback = settings?.productFallback ? getFullImgUrl(settings.productFallback) : '';
  const { formatPrice, country } = useCurrency();
  const navigate = useNavigate();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (isOpen && product) {
      document.body.style.overflow = 'hidden';
      
      const availableColors = product.variants?.map(v => v.color) || product.colors || [];
      const initColor = availableColors.length > 0 ? availableColors[0] : '';
      setColor(initColor);

      const variant = product.variants?.find(v => v.color === initColor);
      let initSize = '';
      if (variant && variant.inventory) {
        initSize = product.sizes?.find(s => (variant.inventory.find(i => i.size === s)?.stock || 0) > 0) || product.sizes?.[0] || '';
      } else {
        initSize = product.sizes?.[0] || '';
      }
      setSize(initSize);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, product]);

  // Update size if color changes to prevent selecting an out-of-stock size
  useEffect(() => {
    if (!product || !color || !product.sizes) return;
    const variant = product.variants?.find(v => v.color === color);
    if (!variant || !variant.inventory) return;

    const isCurrentSizeOut = (variant.inventory.find(i => i.size === size)?.stock || 0) <= 0;
    if (isCurrentSizeOut) {
      const availableSize = product.sizes.find(s => (variant.inventory.find(i => i.size === s)?.stock || 0) > 0);
      if (availableSize) setSize(availableSize);
    }
  }, [product, color, size]);

  if (!isOpen || !product) return null;

  const imageUrl = product.images?.[0] ? getFullImgUrl(product.images[0]) : quickFallback;

  const handleQuickAdd = () => {
    if (country === 'IN' && product.availableInIndia === false) { toast.error('This product is not available in India'); return; }
    if (country === 'US' && product.availableInUS === false) { toast.error('This product is not available in USA'); return; }
    if (product.sizes?.length > 0 && !size) { toast.error('Please select a size'); return; }

    const isSizeOut = product.variants?.length > 0 ? (product.variants.find(v => v.color === color)?.inventory?.find(i => i.size === size)?.stock || 0) <= 0 : false;
    if (product.sizes?.length > 0 && isSizeOut) { toast.error(`Size ${size} is out of stock in this color`); return; }

    addToCart(product._id, size, color);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.55)' }}>
      <div
        className="absolute inset-0 transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-full sm:max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl animate-fade-in flex flex-col md:flex-row gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 overflow-hidden transform scale-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 transition-colors z-10"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Product Image */}
        <div className="hidden md:block md:w-1/2 aspect-[3/4] bg-gray-50 overflow-hidden rounded-xl shrink-0">
          <img 
            src={imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={e => { 
               if (quickFallback && e.target.src !== quickFallback) {
                  e.target.src = quickFallback;
               }
            }}
          />
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 flex flex-col overflow-y-auto custom-scrollbar pr-2 space-y-4 sm:space-y-6 pb-2">
          <div>
            <p className="text-xs sm:text-[11px] font-bold uppercase tracking-[0.2em] text-black mb-2">{product.category}</p>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900 mb-2">{product.name}</h2>
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(getProductPrice(product, country))}
            </p>
          </div>

          <p className="hidden md:block text-gray-600 text-sm leading-relaxed line-clamp-4">
            {product.description || "Indulge in the finest craftsmanship with this exquisite piece. Designed for the modern connoisseur of luxury."}
          </p>

          <div className="space-y-4">
            {product.sizes?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(s => {
                    const currentVariant = product.variants?.find(v => v.color === color);
                    const isSizeOut = currentVariant?.inventory ? (currentVariant.inventory.find(i => i.size === s)?.stock || 0) <= 0 : false;

                    return (
                    <button
                      key={s}
                      disabled={isSizeOut}
                      onClick={() => setSize(s)}
                      className={`relative px-5 py-3 sm:px-4 sm:py-2 text-xs sm:text-[10px] font-bold uppercase border transition-all rounded-xl overflow-hidden ${
                        isSizeOut ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' :
                        size === s ? 'bg-black text-white border-black' : 'bg-transparent text-gray-600 border-gray-200 hover:border-black'
                      }`}
                    >
                      <span className={isSizeOut ? 'line-through' : ''}>{s}</span>
                      {isSizeOut && (
                        <svg className="absolute inset-0 w-full h-full text-red-500/30" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="4" />
                        </svg>
                      )}
                    </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.colors?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">Select Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(c => {
                    const variant = product.variants?.find(v => v.color === c);
                    const isColorOut = variant?.inventory ? variant.inventory.reduce((sum, it) => sum + (Number(it.stock) || 0), 0) <= 0 : false;

                    return (
                    <button
                      key={c}
                      disabled={isColorOut}
                      onClick={() => setColor(c)}
                      className={`relative px-5 py-3 sm:px-4 sm:py-2 text-xs sm:text-[10px] font-bold uppercase border transition-all rounded-xl items-center overflow-hidden ${
                        isColorOut ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' :
                        color === c ? 'bg-black text-white border-black' : 'bg-transparent text-gray-600 border-gray-200 hover:border-black'
                      }`}
                    >
                      {c}
                      {isColorOut && (
                        <svg className="absolute inset-0 w-full h-full text-red-600/50" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="6" />
                        </svg>
                      )}
                    </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleQuickAdd}
              className="flex-1 btn-primary justify-center rounded-xl"
            >
              Add to Cart
            </button>
            <button 
              onClick={() => toggleWishlist(product._id)}
              className={`p-3 border transition-colors rounded-xl ${
                isWishlisted(product._id) ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-200 text-gray-400 hover:text-black hover:border-black'
              }`}
            >
              <svg width="20" height="20" fill={isWishlisted(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.89-8.89 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => { navigate(`/product/${product._id}`); onClose(); }}
            className="w-full text-center text-xs sm:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors"
          >
            View Full Details
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

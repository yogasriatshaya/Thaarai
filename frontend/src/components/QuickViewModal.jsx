import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { PRODUCT_FALLBACK } from '../assets/images';
import { createPortal } from 'react-dom';

export default function QuickViewModal({ product, isOpen, onClose }) {
  const { addToCart, BACKEND_URL, toggleWishlist, isWishlisted } = useShop();
  const navigate = useNavigate();
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (product?.sizes?.length > 0) setSize(product.sizes[0]);
      if (product?.colors?.length > 0) setColor(product.colors[0]);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const imageUrl = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${BACKEND_URL}${product.images[0]}`)
    : PRODUCT_FALLBACK;

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
            onError={e => { e.target.src = PRODUCT_FALLBACK; }}
          />
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 flex flex-col overflow-y-auto custom-scrollbar pr-2 space-y-4 sm:space-y-6 pb-2">
          <div>
            <p className="text-xs sm:text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">{product.category}</p>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900 mb-2">{product.name}</h2>
            <p className="text-xl font-bold text-gray-900">
              {product.price?.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
              })}
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
                  {product.sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`px-5 py-3 sm:px-4 sm:py-2 text-xs sm:text-[10px] font-bold uppercase border transition-all rounded-xl ${
                        size === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-gray-600 border-gray-200 hover:border-blue-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">Select Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`px-5 py-3 sm:px-4 sm:py-2 text-xs sm:text-[10px] font-bold uppercase border transition-all rounded-xl ${
                        color === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-gray-600 border-gray-200 hover:border-blue-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => { addToCart(product._id, size, color); onClose(); }}
              className="flex-1 btn-primary justify-center rounded-xl"
            >
              Add to Cart
            </button>
            <button 
              onClick={() => toggleWishlist(product._id)}
              className={`p-3 border transition-colors rounded-xl ${
                isWishlisted(product._id) ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-600'
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

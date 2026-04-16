import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useCurrency } from '../context/CurrencyContext';
import { getProductPrice, getProductOriginalPrice, getOfferPrice, getOfferActive } from '../utils/priceUtils';

const HeartIcon = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke={filled ? "currentColor" : "currentColor"} strokeWidth={filled ? "0" : "1.5"}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.89-8.89 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { BACKEND_URL, getFullImgUrl, wishlist, toggleWishlist, settings } = useShop();
  const { formatPrice, country } = useCurrency();
  const [currentImg, setCurrentImg] = useState(0);
  const isWishlisted = wishlist.includes(product._id);
  const isActiveOffer = getOfferActive(product, country);

  const cardFallback = settings?.productFallback ? getFullImgUrl(settings.productFallback) : '';
  
  let extractedImages = [];
  if (product.variants && product.variants.length > 0 && product.variants[0].images && product.variants[0].images.length > 0) {
    extractedImages = product.variants[0].images;
  } else if (product.images && product.images.length > 0) {
    extractedImages = product.images;
  }

  const images = extractedImages.length > 0 ? extractedImages : (cardFallback ? [cardFallback] : []);

  const nextImg = (e) => {
    e.stopPropagation();
    setCurrentImg(prev => (prev + 1) % images.length);
  };

  const prevImg = (e) => {
    e.stopPropagation();
    setCurrentImg(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div 
      className="product-card group cursor-pointer" 
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <div className="relative product-img-wrap bg-[#f0ece5] mb-1.5 overflow-hidden" style={{ aspectRatio: '3/4' }}>
        {images.length > 0 ? (
          <img
            src={getFullImgUrl(images[currentImg])}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            onError={e => { 
               if (cardFallback && e.target.src !== cardFallback) {
                  e.target.src = cardFallback;
               } else {
                  e.target.style.display = 'none';
               }
            }}
          />
        ) : (
           <div className="absolute inset-0 flex items-center justify-center bg-[#f7f3ed]">
              <span className="text-[10px] tracking-widest text-gray-300 font-serif opacity-30">THAARAI_IMAGE</span>
           </div>
        )}
        
        {/* Navigation Arrows for multi-image products */}
        {images.length > 1 && (
          <>
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button 
                onClick={prevImg}
                className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white text-gray-900 transition-all hover:scale-110"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button 
                onClick={nextImg}
                className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white text-gray-900 transition-all hover:scale-110"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
            {/* Image Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              {images.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentImg ? 'w-4 bg-white' : 'w-1 bg-white/50'}`} />
              ))}
            </div>
          </>
        )}

        {(() => {
          // Calculate discount based on current country/currency
          const base = getProductPrice(product, country);
          const current = (isActiveOffer && getOfferPrice(product, country) > 0)
            ? getOfferPrice(product, country)
            : base;
          const original = getProductOriginalPrice(product, country) || base;

          if (original > current && current > 0) {
            const disc = Math.round(((original - current) / original) * 100);
            return (
              <span className="absolute top-3 left-3 z-[5] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] bg-teal-500 text-white rounded-full shadow-lg">
                -{disc}%
              </span>
            );
          }
          return null;
        })()}

        {product.label && (() => {
          const label = product.label;
          const lowerLabel = label.toLowerCase().trim();

          // Don't show any discount percentage labels (contains both - and %)
          if (lowerLabel.includes('-') && lowerLabel.includes('%')) return null;

          // --- NEW ARRIVAL ---
          if (lowerLabel.includes('new arrival') || lowerLabel === 'new') return (
            <span className="absolute top-3 left-3 z-[5] flex items-center gap-1 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em]"
              style={{ background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', borderRadius: '3px', boxShadow: '0 2px 8px rgba(16,185,129,0.4)', fontFamily: 'sans-serif' }}>
              {/* Sparkle icon */}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm0 10l.9 2.7L16 16l-3.1.9L12 19.6l-.9-2.7L8 16l3.1-.9L12 12z" />
              </svg>
              New Arrival
            </span>
          );

          // --- HOT ---
          if (lowerLabel === 'hot') return (
            <span className="absolute top-3 left-3 z-[5] flex items-center gap-1 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em]"
              style={{ background: 'linear-gradient(135deg,#dc2626,#f97316)', color: '#fff', borderRadius: '3px', boxShadow: '0 2px 8px rgba(220,38,38,0.45)', fontFamily: 'sans-serif' }}>
              {/* Flame icon */}
              <svg width="8" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-2-1-4-2.5-5.5C14.5 9 14 11 13 11.5 13 9.5 12 2 12 2z" />
              </svg>
              Hot
            </span>
          );

          // --- TRENDING ---
          if (lowerLabel === 'trending') return (
            <span className="absolute top-3 left-3 z-[5] flex items-center gap-1 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em]"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', borderRadius: '3px', boxShadow: '0 2px 8px rgba(99,58,220,0.4)', fontFamily: 'sans-serif' }}>
              {/* Lightning bolt */}
              <svg width="7" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
              </svg>
              Trending
            </span>
          );

          // --- SOLD OUT ---
          if (lowerLabel.includes('sold out')) return (
            <span className="absolute top-3 left-3 z-[5] flex items-center gap-1 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em]"
              style={{ background: 'rgba(30,30,30,0.82)', color: '#aaa', borderRadius: '3px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'sans-serif', textDecoration: 'line-through', textDecorationColor: '#666' }}>
              Sold Out
            </span>
          );

          // --- BESTSELLER ---
          if (lowerLabel === 'bestseller') return (
            <span className="absolute top-3 left-3 z-[5] flex items-center gap-1 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em]"
              style={{ background: 'linear-gradient(135deg,#b45309,#c9a96e)', color: '#fff', borderRadius: '3px', boxShadow: '0 2px 8px rgba(180,83,9,0.4)', fontFamily: 'sans-serif' }}>
              {/* Star icon */}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Bestseller
            </span>
          );

          // --- LIMITED EDITION ---
          if (lowerLabel.includes('limited')) return (
            <span className="absolute top-3 left-3 z-[5] flex items-center gap-0.5 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em]"
              style={{ background: '#1a1a1a', color: '#c9a96e', borderRadius: '3px', border: '1px solid #c9a96e44', fontFamily: 'sans-serif' }}>
              {/* Diamond icon */}
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 2l10 9-10 11L2 11z" />
              </svg>
              Limited
            </span>
          );

          // --- FINAL PIECES ---
          if (lowerLabel.includes('final')) return (
            <span className="absolute top-3 left-3 z-[5] flex items-center gap-1 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em]"
              style={{ background: 'linear-gradient(135deg,#991b1b,#b91c1c)', color: '#fecaca', borderRadius: '3px', boxShadow: '0 2px 8px rgba(153,27,27,0.4)', fontFamily: 'sans-serif' }}>
              {/* Alert icon */}
              <svg width="8" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6zm-1 4v4h2v-4h-2zm0 6v2h2v-2h-2z" />
              </svg>
              Final Pieces
            </span>
          );

          // --- DEFAULT FALLBACK ---
          return (
            <span className="absolute top-3 left-3 z-[5] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em]"
              style={{ background: 'rgba(255,255,255,0.92)', color: '#1a1a1a', borderRadius: '3px', backdropFilter: 'blur(4px)', fontFamily: 'sans-serif' }}>
              {label}
            </span>
          );
        })()}

        <button 
          onClick={(e) => { 
            e.stopPropagation();
            toggleWishlist(product._id);
          }} 
          className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:scale-110 z-20 ${
            isWishlisted 
              ? 'bg-red-500 text-white' 
              : 'text-charcoal bg-white/80 hover:text-black hover:bg-white'
          }`}
        >
          <HeartIcon filled={isWishlisted} />
        </button>
      </div>
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted font-sans mb-0.5">
          {product.category && product.subcategory ? `${product.category} • ${product.subcategory}` : (product.subcategory || product.category)}
        </p>
        <h3 className="font-serif text-sm text-charcoal mb-0.5 leading-tight">{product.name}</h3>
        
        {/* Rating and Reviews */}
        <div className="flex items-center gap-1 mb-1">
          <div className="flex text-amber-500">
            {[1, 2, 3, 4, 5].map(i => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill={i <= Math.round(product.averageRating || 0) ? "#d4a017" : "none"} stroke="#d4a017" strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span className="text-[9px] font-medium text-muted">({product.reviewCount || 0})</span>
        </div>

        {product.material && <p className="text-[10px] text-muted font-sans mb-1">{product.material}</p>}
        <div className="flex items-baseline gap-2 mt-0.5">
          {isActiveOffer ? (
            <>
              <span className="text-sm font-sans font-bold text-charcoal">
                {formatPrice(getOfferPrice(product, country))}
              </span>
              <span className="text-[11px] text-muted line-through">
                {formatPrice(getProductPrice(product, country))}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-sans font-medium text-charcoal">
                {formatPrice(getProductPrice(product, country))}
              </span>
              {getProductOriginalPrice(product, country) > getProductPrice(product, country) && (
                <span className="text-[11px] text-muted line-through">
                  {formatPrice(getProductOriginalPrice(product, country))}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

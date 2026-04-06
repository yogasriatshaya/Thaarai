import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useCurrency } from '../context/CurrencyContext';
import { getProductPrice } from '../utils/priceUtils';

const HeartIcon = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke={filled ? "currentColor" : "currentColor"} strokeWidth={filled ? "0" : "1.5"}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

import { PRODUCT_FALLBACK } from '../assets/images';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { BACKEND_URL, getFullImgUrl, wishlist, toggleWishlist } = useShop();
  const { formatPrice, country } = useCurrency();
  const [currentImg, setCurrentImg] = useState(0);
  const isWishlisted = wishlist.includes(product._id);

  const images = product.images && product.images.length > 0 ? product.images : [PRODUCT_FALLBACK];


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
        <img
          src={getFullImgUrl(images[currentImg])}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          onError={e => { e.target.src = PRODUCT_FALLBACK; }}
        />
        
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

        {product.label && (
          <span className={`absolute top-3 left-3 text-[9px] tracking-[0.2em] uppercase font-sans font-medium px-2.5 py-1 z-[5] ${
            product.label === 'BESTSELLER' ? 'bg-black text-white' :
            product.label === 'LIMITED EDITION' ? 'bg-charcoal text-white' :
            product.label === 'FINAL PIECES' ? 'bg-red-700 text-white' :
            'bg-white text-charcoal'
          }`}>
            {product.label}
          </span>
        )}
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
        <p className="text-sm font-sans font-medium text-charcoal mt-0.5">{formatPrice(getProductPrice(product, country))}</p>
      </div>
    </div>
  );
}

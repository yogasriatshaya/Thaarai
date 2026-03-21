import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { PRODUCT_FALLBACK } from '../assets/images';
import QuickViewModal from './QuickViewModal';

export default function ProductCard({ product }) {
  const { BACKEND_URL, toggleWishlist, isWishlisted, addToCart } = useShop();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const navigate = useNavigate();

  const handleBuyNow = async (e) => {
    e.preventDefault();
    await addToCart(product._id, product.sizes?.[0], product.colors?.[0]);
    navigate('/checkout');
  };

  const imageUrl = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${BACKEND_URL}${product.images[0]}`)
    : PRODUCT_FALLBACK;

  const secondaryImageUrl = product.images?.[1]
    ? (product.images[1].startsWith('http') ? product.images[1] : `${BACKEND_URL}${product.images[1]}`)
    : imageUrl;

  const wishlisted = isWishlisted(product._id);

  return (
    <>
      <div className="group cursor-pointer animate-fade-in">
        <div className="relative card-premium p-0 border-none group">
          {/* Image Container */}
          <div className="relative overflow-hidden bg-gray-50 mb-4 transition-all duration-700 rounded-xl" style={{ aspectRatio: '3/4' }}>
            <Link to={`/product/${product._id}`} className="block w-full h-full">
              {/* Main Image */}
              <img
                src={imageUrl}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 ${product.images?.[1] ? 'group-hover:opacity-0' : ''}`}
                onError={e => { e.target.src = PRODUCT_FALLBACK; }}
              />
              
              {/* Secondary Image (Hover) */}
              {product.images?.[1] && (
                <img
                  src={secondaryImageUrl}
                  alt={`${product.name} alternate`}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-110"
                  loading="lazy"
                />
              )}
            </Link>

            {/* Quick Actions Overlay - Always visible on mobile, hover on desktop */}
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-500 z-10 flex flex-col gap-2">
              <button
                onClick={(e) => { e.preventDefault(); setIsQuickViewOpen(true); }}
                className="w-full py-3 sm:py-2.5 bg-white/90 backdrop-blur-md text-gray-900 text-xs sm:text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all hover:scale-105 rounded-xl shadow-xl"
              >
                Quick View
              </button>
              <button
                onClick={(e) => { e.preventDefault(); addToCart(product._id, product.sizes?.[0], product.colors?.[0]); }}
                className="w-full py-3 sm:py-2.5 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all rounded-xl shadow-xl"
                style={{ backgroundColor: '#aba0e3' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#9589d4'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#aba0e3'}
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full py-3 sm:py-2.5 bg-emerald-500 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 hover:scale-105 transition-all duration-300 rounded-xl shadow-xl"
              >
                Buy Now
              </button>
            </div>

            {/* Wishlist Toggle - Always visible on mobile */}
            <button
              onClick={(e) => { e.preventDefault(); toggleWishlist(product._id); }}
              className={`absolute top-4 right-4 z-10 p-2 sm:p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
                wishlisted
                  ? 'bg-red-500 text-white scale-110'
                  : 'bg-white/70 text-gray-900 sm:bg-white/20 sm:text-white hover:bg-white hover:text-gray-900 sm:opacity-0 sm:group-hover:opacity-100'
              }`}
            >
              <svg className="w-4 h-4 sm:w-4 sm:h-4" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.89-8.89 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>

            {/* Label Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              {product.label && (
                <span className={`px-3 py-1 text-[10px] sm:text-[9px] font-bold tracking-[0.1em] uppercase rounded-full shadow-lg ${
                  product.label === 'Hot' || product.label === 'BESTSELLER'
                    ? 'bg-red-600 text-white'
                    : product.label === 'Sold Out'
                    ? 'bg-gray-800 text-white'
                    : product.label === 'Trending'
                    ? 'bg-purple-600 text-white'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {product.label}
                </span>
              )}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="px-3 py-1 text-[10px] sm:text-[9px] font-bold tracking-[0.1em] uppercase rounded-full shadow-lg bg-emerald-500 text-white">
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <Link to={`/product/${product._id}`} className="block space-y-1.5 px-2 pb-4">
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-serif text-base font-bold text-gray-900 transition-colors duration-300 line-clamp-1"
                style={{ '--hover-color': '#aba0e3' }}>
                {product.name}
              </h3>
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-gray-900">
                  {product.price?.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  })}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="block text-xs text-gray-400 line-through">
                    {product.originalPrice.toLocaleString('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    })}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {product.fabric || product.subcategory || product.category}
            </p>
          </Link>
        </div>
      </div>

      <QuickViewModal 
        product={product} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />
    </>
  );
}

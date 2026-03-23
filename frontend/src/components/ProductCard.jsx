import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const HeartIcon = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

export default function ProductCard({ product }) {
  const { BACKEND_URL } = useShop();
  const imageUrl = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${BACKEND_URL}${product.images[0]}`)
    : 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop';

  return (
    <div className="product-card group cursor-pointer">
      <Link to={`/product/${product._id}`}>
        <div className="relative product-img-wrap bg-[#f0ece5] mb-3 overflow-hidden" style={{ aspectRatio: '3/4' }}>
          <img
            src={imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop'; }}
          />
          {product.label && (
            <span className={`absolute top-3 left-3 text-[9px] tracking-[0.2em] uppercase font-sans font-medium px-2.5 py-1 ${
              product.label === 'BESTSELLER' ? 'bg-gold-600 text-white' :
              product.label === 'LIMITED EDITION' ? 'bg-charcoal text-white' :
              product.label === 'FINAL PIECES' ? 'bg-red-700 text-white' :
              'bg-white text-charcoal'
            }`}>
              {product.label}
            </span>
          )}
          <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-charcoal bg-white/80 p-1.5 rounded-full hover:text-gold-600">
            <HeartIcon />
          </button>
        </div>
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted font-sans mb-1">{product.subcategory || product.category}</p>
          <h3 className="font-serif text-base text-charcoal mb-1 leading-tight">{product.name}</h3>
          {product.material && <p className="text-[11px] text-muted font-sans mb-2">{product.material}</p>}
          <p className="text-sm font-sans font-medium text-charcoal">₹{product.price?.toLocaleString('en-IN')}</p>
        </div>
      </Link>
    </div>
  );
}

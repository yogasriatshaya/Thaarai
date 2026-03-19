import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
import { toast } from 'react-toastify';
import { PRODUCT_FALLBACK } from '../assets/images';
import { MOCK_PRODUCTS } from '../data/mockProducts';

const StarIcon = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#d4a017" : "none"} stroke="#d4a017" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, BACKEND_URL, isWishlisted, toggleWishlist } = useShop();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState('details');
  const [stockLeft] = useState(() => Math.floor(Math.random() * 4) + 1); // 1–4 units
  const [countdown, setCountdown] = useState({ h: 3, m: 47, s: 22 });

  useEffect(() => {
    setLoading(true);

    // ── Handle Mock IDs ──────────────────────────────────────────────────
    if (id?.startsWith('mock_')) {
      const mockProduct = MOCK_PRODUCTS.find(p => p._id === id);
      if (mockProduct) {
        setProduct(mockProduct);
        if (mockProduct.sizes?.length > 0) setSelectedSize(mockProduct.sizes[0]);
        if (mockProduct.colors?.length > 0) setSelectedColor(mockProduct.colors[0]);
        
        // Pull related from mocks
        const relatedMocks = MOCK_PRODUCTS.filter(p => p.category === mockProduct.category && p._id !== id).slice(0, 4);
        setRelated(relatedMocks);
        setLoading(false);
        return;
      }
    }

    // ── Handle Local Admin IDs ───────────────────────────────────────────
    if (id?.startsWith('local_')) {
      const localData = localStorage.getItem('thaarai_local_products');
      const localProducts = localData ? JSON.parse(localData) : [];
      const localProduct = localProducts.find(p => p._id === id);
      
      if (localProduct) {
        setProduct(localProduct);
        if (localProduct.sizes?.length > 0) setSelectedSize(localProduct.sizes[0]);
        if (localProduct.colors?.length > 0) setSelectedColor(localProduct.colors[0]);
        
        // Pull related from locals + mocks
        const relatedLocals = localProducts.filter(p => p.category === localProduct.category && p._id !== id);
        const relatedMocks = MOCK_PRODUCTS.filter(p => p.category === localProduct.category && !relatedLocals.some(rl => rl.name === p.name));
        setRelated([...relatedLocals, ...relatedMocks].slice(0, 4));
        setLoading(false);
        return;
      }
    }

    // ── Real API Fallback ────────────────────────────────────────────────
    API.get(`/products/${id}`).then(r => {
      const realProduct = r.data.product;
      setProduct(realProduct);
      if (realProduct.sizes?.length > 0) setSelectedSize(realProduct.sizes[0]);
      if (realProduct.colors?.length > 0) setSelectedColor(realProduct.colors[0]);
      return API.get(`/products?category=${realProduct.category}&limit=6`);
    }).then(r => {
      let realRelated = r.data.products?.filter(p => p._id !== id) || [];
      if (realRelated.length < 4 && product) {
        const mocks = MOCK_PRODUCTS.filter(p => p.category === product.category && !realRelated.some(rp => rp.name === p.name)).slice(0, 4 - realRelated.length);
        setRelated([...realRelated, ...mocks]);
      } else {
        setRelated(realRelated.slice(0, 4));
      }
    }).catch(() => {
      // Final fallback if real API fails completely for a non-mock ID
      const fallbackMock = MOCK_PRODUCTS.find(p => p._id === id) || MOCK_PRODUCTS[0];
      setProduct(fallbackMock);
      
      let relatedItems = [];
      if (fallbackMock.relatedProductIds?.length > 0) {
        relatedItems = MOCK_PRODUCTS.filter(p => fallbackMock.relatedProductIds.includes(p._id));
      }
      
      if (relatedItems.length < 4) {
        const remaining = MOCK_PRODUCTS.filter(p => 
          p.category === fallbackMock.category && 
          p._id !== fallbackMock._id &&
          !relatedItems.find(r => r._id === p._id)
        ).slice(0, 4 - relatedItems.length);
        relatedItems = [...relatedItems, ...remaining];
      }
      
      setRelated(relatedItems.slice(0, 4));
    }).finally(() => setLoading(false));
  }, [id, product?.category]);

  // Track recently viewed in localStorage
  useEffect(() => {
    if (!product) return;
    const raw = localStorage.getItem('thaarai_recently_viewed');
    let list = [];
    try { list = raw ? JSON.parse(raw) : []; } catch {}
    const filtered = list.filter(p => p._id !== product._id);
    filtered.unshift({ _id: product._id, name: product.name, price: product.price, images: product.images });
    localStorage.setItem('thaarai_recently_viewed', JSON.stringify(filtered.slice(0, 10)));
  }, [product]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        clearInterval(timer);
        return { h: 0, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-white min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
        <div className="bg-gray-100 rounded-3xl" style={{ aspectRatio: '3/4' }} />
        <div className="space-y-6 pt-10">
          <div className="h-10 bg-gray-100 rounded-xl w-3/4" />
          <div className="h-6 bg-gray-100 rounded-lg w-1/2" />
          <div className="h-4 bg-gray-100 rounded-lg w-full" />
          <div className="h-4 bg-gray-100 rounded-lg w-full" />
          <div className="h-16 bg-gray-100 rounded-2xl w-full mt-10" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-24">
      <p className="font-serif text-2xl mb-4">Product not found</p>
      <Link to="/collection" className="btn-primary">Back to Collection</Link>
    </div>
  );

  const getImg = (img) => img?.startsWith('http') ? img : `${BACKEND_URL}${img}`;
  const images = product.images?.length > 0 ? product.images : [PRODUCT_FALLBACK];

  const ratingBars = [5,4,3,2,1].map(n => ({
    n,
    count: product.reviews?.filter(r => r.rating === n).length || 0,
    pct: product.reviews?.length ? Math.round((product.reviews.filter(r => r.rating === n).length / product.reviews.length) * 100) : (n === 5 ? 92 : n === 4 ? 6 : n === 3 ? 2 : 0)
  }));

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) { toast.error('Please select a size'); return; }
    addToCart(product._id, selectedSize, selectedColor);
  };

  const handleBuyNow = async () => {
    if (product.sizes?.length > 0 && !selectedSize) { toast.error('Please select a size'); return; }
    await addToCart(product._id, selectedSize, selectedColor);
    navigate('/checkout');
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-12">
          <Link to="/" className="hover:text-gray-900 transition-colors border-b border-transparent hover:border-gray-900">Home</Link>
          <span className="text-gray-200">/</span>
          <Link to="/collection" className="hover:text-gray-900 transition-colors border-b border-transparent hover:border-gray-900">Collection</Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 mb-32">
          {/* Image Gallery */}
          <div className="lg:col-span-7">
            <div className="flex flex-col-reverse md:flex-row gap-8">
              <div className="flex md:flex-col gap-4 overflow-auto no-scrollbar md:w-24 shrink-0">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-20 md:w-full aspect-[3/4] overflow-hidden border transition-all duration-500 rounded-lg ${selectedImage === i ? 'border-blue-600 shadow-xl scale-105' : 'border-gray-100 opacity-60 hover:opacity-100 hover:border-gray-200'}`}>
                    <img src={getImg(img)} alt="" className="w-full h-full object-cover"
                      loading="lazy" decoding="async"
                      onError={e => { e.target.src = PRODUCT_FALLBACK; }} />
                  </button>
                ))}
              </div>
              <div className="flex-1 relative aspect-[3/4] bg-gray-50 overflow-hidden group border border-gray-100 rounded-xl shadow-2xl">
                <img src={getImg(images[selectedImage])} alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  fetchPriority="high" decoding="async"
                  onError={e => { e.target.src = PRODUCT_FALLBACK; }} />
                <button 
                  onClick={() => toggleWishlist(product._id)}
                  className={`absolute top-8 right-8 w-14 h-14 backdrop-blur-md border flex items-center justify-center rounded-full shadow-2xl transition-all duration-500 group/fav ${
                    isWishlisted(product._id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/80 border-gray-100 text-gray-400 hover:text-blue-600'
                  }`}
                >
                  <svg width="20" height="20" fill={isWishlisted(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.89-8.89 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </button>
                {product.label && (
                   <span className="absolute top-8 left-8 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-[0.3em] px-6 py-2.5 shadow-2xl skew-x-[-10deg]">
                      {product.label}
                   </span>
                )}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-5 pt-4">
            <div className="sticky top-32">
              <div className="flex items-center gap-4 mb-8">
                <span className="w-10 h-px bg-blue-600/30" />
                <span className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.4em]">{product.subcategory || product.category}</span>
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">{product.name}</h1>
              
              <div className="flex items-center gap-10 mb-12">
                <p className="text-5xl font-serif font-bold text-gray-900 tracking-tight">
                  {product.price?.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  })}
                </p>
                <div className="flex items-center gap-4 py-2 px-5 bg-gray-50 border border-gray-100 rounded-sm">
                   <div className="flex text-amber-500">{[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= Math.round(product.averageRating || 4.5)} />)}</div>
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{product.reviewCount || 128} Reviews</span>
                </div>
              </div>

              <div className="space-y-8 mb-12 border-l-2 border-blue-600/10 pl-8">
                <p className="text-gray-600 leading-relaxed text-base font-light tracking-wide">
                  {product.description || "A masterfully crafted piece designed for those who appreciate the finer details of modern luxury. Sustainable, elegant, and timeless."}
                </p>
              </div>

              {/* Size Selector */}
              {product.sizes?.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Size Options</p>
                    <button className="text-[9px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-600 border-b border-blue-100">Care Instructions</button>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {product.sizes.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        className={`w-14 h-14 text-[10px] font-bold tracking-widest border transition-all duration-500 rounded-sm ${selectedSize === size ? 'border-gray-900 bg-gray-900 text-white shadow-xl scale-105' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-900 hover:text-gray-900'}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.colors?.length > 0 && (
                <div className="mb-12">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
                    Color: <span className="text-gray-900 ml-2">{selectedColor}</span>
                  </p>
                  <div className="flex gap-4">
                    {product.colors.map(color => (
                      <button key={color} onClick={() => setSelectedColor(color)}
                        className={`group relative w-8 h-8 rounded-full transition-all duration-500 ${selectedColor === color ? 'ring-2 ring-gray-900 ring-offset-4 ring-offset-white scale-110 shadow-lg' : 'ring-1 ring-gray-100 hover:scale-105 opacity-80 hover:opacity-100'}`}
                        style={{ backgroundColor: color.toLowerCase() === 'imperial gold' ? '#d4a017' : color.toLowerCase() === 'midnight' ? '#1a1a2e' : color?.toLowerCase() === 'ivory' ? '#faf8f3' : color }}
                        title={color}
                      >
                         {selectedColor === color && (
                            <span className="absolute inset-0 flex items-center justify-center">
                               <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            </span>
                         )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Indicator + Countdown */}
              <div className="mb-8 space-y-3">
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-5 py-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="text-red-700 text-xs font-bold uppercase tracking-widest">
                    Only {stockLeft} left in stock — order soon!
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-5 py-3">
                  <span className="text-amber-600 text-xs font-bold uppercase tracking-widest flex-1">Limited Edition Offer ends in</span>
                  <span className="font-mono font-bold text-amber-700 text-sm tabular-nums">
                    {String(countdown.h).padStart(2,'0')}:{String(countdown.m).padStart(2,'0')}:{String(countdown.s).padStart(2,'0')}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-20">
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 py-4 border-2 border-blue-600 text-blue-600 font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all duration-500 rounded-xl"
                >
                  Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="flex-1 py-4 bg-emerald-500 text-white font-bold uppercase tracking-widest hover:bg-emerald-600 hover:scale-[1.02] transition-all duration-500 rounded-xl shadow-xl shadow-emerald-500/20"
                >
                  Buy Now
                </button>
              </div>

              {/* Accordions */}
              <div className="space-y-4 border-t border-gray-100 pt-12">
                {[
                  { id: 'details', label: 'Item Specifics', content: `Composition: ${product.material || 'Premium Sustainable Fiber'}\nMade in: Italy\nCollection: Fall/Winter 2024\nFit: Contemporary Tailored` },
                  { id: 'shipping', label: 'Delivery & Returns', content: 'Enjoy complimentary express shipping on all orders. Returns are accepted within 30 days of delivery for a full refund or exchange.' },
                  { id: 'sustainability', label: 'Our Impact', content: 'This garment is produced using 100% renewable energy and ethically sourced materials. Part of our commitment to a zero-waste future.' }
                ].map(section => (
                  <div key={section.id} className="bg-gray-50 overflow-hidden border border-transparent hover:border-gray-100 transition-all rounded-xl">
                    <button onClick={() => setOpenSection(openSection === section.id ? '' : section.id)}
                      className="flex items-center justify-between w-full p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-gray-900 transition-colors">
                      {section.label}
                      <span className={`transition-transform duration-500 ${openSection === section.id ? 'rotate-180' : ''} text-blue-500`}>
                         <ChevronIcon />
                      </span>
                    </button>
                    <div className={`transition-all duration-700 ease-in-out ${openSection === section.id ? 'max-h-[500px] opacity-100 p-8 pt-0' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                      <p className="text-sm text-gray-500 font-light leading-relaxed whitespace-pre-line tracking-wide">{section.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="py-32 border-t border-gray-100 mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-4">
              <span className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.4em] mb-4 block">Client Perspectives</span>
              <h2 className="font-serif text-5xl lg:text-6xl font-bold text-gray-900 mb-10 tracking-tight">The Experience</h2>
              <div className="flex items-baseline gap-6 mb-6">
                <span className="text-8xl font-serif font-bold text-gray-900 tracking-tighter">4.9</span>
                <span className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Client Scale</span>
              </div>
              <div className="flex mb-10 text-amber-500">{[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= 5} />)}</div>
              <p className="text-gray-500 font-light leading-relaxed text-sm tracking-wide">Derived from 128 verified acqusitions across our global ateliers.</p>
            </div>
            <div className="lg:col-span-8 flex flex-col justify-center gap-8 pl-0 lg:pl-16">
              {ratingBars.map(({ n, pct }) => (
                <div key={n} className="flex items-center gap-10 group">
                  <span className="text-[10px] font-bold text-gray-300 w-4 group-hover:text-blue-500 transition-colors">{n}</span>
                  <div className="flex-1 h-1.5 bg-gray-50 overflow-hidden rounded-xl shadow-inner">
                    <div className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.2)]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-900 w-12 text-right tracking-widest">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recommendations */}
        {related.length > 0 && (
          <section className="pt-32 border-t border-gray-100">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
               <div>
                  <span className="text-red-500 font-bold text-[10px] uppercase tracking-[0.4em] mb-4 block">Curated Ensemble</span>
                  <h2 className="font-serif text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">Complete The Look</h2>
               </div>
               <Link to="/collection" className="btn-ghost text-gray-400 hover:text-gray-900 flex items-center gap-2 group transition-all">
                  View Full Collection <span className="group-hover:translate-x-1 transition-transform">→</span>
               </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

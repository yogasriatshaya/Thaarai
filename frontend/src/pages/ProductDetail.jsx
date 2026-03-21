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
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
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
      const localData = localStorage.getItem('aara_local_products');
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
    const raw = localStorage.getItem('aara_recently_viewed');
    let list = [];
    try { list = raw ? JSON.parse(raw) : []; } catch {}
    const filtered = list.filter(p => p._id !== product._id);
    filtered.unshift({ _id: product._id, name: product.name, price: product.price, images: product.images });
    localStorage.setItem('aara_recently_viewed', JSON.stringify(filtered.slice(0, 10)));
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Image Gallery - Sticky */}
          <div className="lg:col-span-6">
            <div className="lg:sticky lg:top-24">
              <div className="flex flex-col-reverse md:flex-row gap-4">
                <div className="flex md:flex-col gap-3 overflow-auto no-scrollbar md:w-20 shrink-0">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`shrink-0 w-16 md:w-full aspect-[3/4] overflow-hidden border transition-all duration-500 rounded-lg ${selectedImage === i ? 'border-blue-600 shadow-xl scale-105' : 'border-gray-100 opacity-60 hover:opacity-100 hover:border-gray-200'}`}>
                      <img src={getImg(img)} alt="" className="w-full h-full object-cover"
                        loading="lazy" decoding="async"
                        onError={e => { e.target.src = PRODUCT_FALLBACK; }} />
                    </button>
                  ))}
                </div>
                <div className="flex-1 relative aspect-[3/4] bg-gray-50 overflow-hidden group border border-gray-100 rounded-xl shadow-2xl">
                  <img src={getImg(images[selectedImage])} alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    fetchpriority="high" decoding="async"
                    onError={e => { e.target.src = PRODUCT_FALLBACK; }} />
                  <button
                    onClick={() => toggleWishlist(product._id)}
                    className={`absolute top-6 right-6 w-12 h-12 backdrop-blur-md border flex items-center justify-center rounded-full shadow-2xl transition-all duration-500 group/fav ${
                      isWishlisted(product._id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/80 border-gray-100 text-gray-400 hover:text-blue-600'
                    }`}
                  >
                    <svg width="18" height="18" fill={isWishlisted(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.89-8.89 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </button>
                  {product.label && (
                     <span className={`absolute top-6 left-6 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 shadow-xl rounded-full ${
                       product.label === 'Hot' ? 'bg-red-500' : product.label === 'Sold Out' ? 'bg-gray-800' : product.label === 'Trending' ? 'bg-purple-600' : 'bg-emerald-500'
                     }`}>
                        {product.label}
                     </span>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="absolute top-6 left-6 mt-10 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 shadow-xl rounded-full">
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Info - Scrollable */}
          <div className="lg:col-span-6">
            <div className="space-y-6">
              {/* Category */}
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-purple-400" />
                <span className="text-purple-500 font-bold text-[10px] uppercase tracking-[0.3em]">{product.subcategory || product.category}</span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">{product.name}</h1>

              {/* Price Section */}
              <div className="space-y-3">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <p className="text-3xl md:text-4xl font-serif font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="font-sans text-2xl md:text-3xl">₹</span>
                    {product.price?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-xl text-gray-400 line-through flex items-baseline gap-0.5">
                        <span className="font-sans text-lg">₹</span>
                        {product.originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex text-amber-500">{[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= Math.round(product.averageRating || 4.5)} />)}</div>
                  <span className="text-[11px] font-medium text-gray-500">{product.reviewCount || 128} Reviews</span>
                </div>
              </div>

              {/* Description */}
              <div className="border-l-2 border-purple-200 pl-4">
                <p className="text-gray-600 leading-relaxed text-sm">
                  {product.description || "A masterfully crafted piece designed for those who appreciate the finer details. Sustainable, elegant, and timeless."}
                </p>
              </div>

              {/* Fabric & Style Info */}
              {(product.fabric || product.style) && (
                <div className="flex flex-wrap gap-2">
                  {product.fabric && (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      {product.fabric}
                    </span>
                  )}
                  {product.style && (
                    <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                      {product.style}
                    </span>
                  )}
                  {product.availability && product.availability !== 'Available' && (
                    <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                      {product.availability}
                    </span>
                  )}
                </div>
              )}

              {/* Size Selector */}
              {product.sizes?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Select Size</p>
                    <button className="text-[10px] font-medium text-purple-500 hover:text-purple-600">Size Guide</button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] h-11 px-3 text-[11px] font-bold tracking-wide border transition-all duration-300 rounded-lg ${selectedSize === size ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.colors?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                    Color: <span className="text-gray-900 normal-case ml-1">{selectedColor}</span>
                  </p>
                  <div className="flex gap-3">
                    {product.colors.map(color => (
                      <button key={color} onClick={() => setSelectedColor(color)}
                        className={`group relative w-9 h-9 rounded-full transition-all duration-300 ${selectedColor === color ? 'ring-2 ring-gray-900 ring-offset-2 scale-110' : 'ring-1 ring-gray-200 hover:scale-105'}`}
                        style={{ backgroundColor: color.toLowerCase() === 'imperial gold' ? '#d4a017' : color.toLowerCase() === 'midnight' ? '#1a1a2e' : color?.toLowerCase() === 'ivory' ? '#faf8f3' : color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Stock & Offer Alerts */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-700 text-xs font-semibold">
                    Only {stockLeft} left in stock — order soon!
                  </span>
                </div>
                <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
                  <span className="text-amber-700 text-xs font-semibold">Limited offer ends in</span>
                  <span className="font-mono font-bold text-amber-800 text-sm">
                    {String(countdown.h).padStart(2,'0')}:{String(countdown.m).padStart(2,'0')}:{String(countdown.s).padStart(2,'0')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 border-2 border-purple-500 text-purple-600 font-bold text-sm uppercase tracking-wider hover:bg-purple-500 hover:text-white transition-all duration-300 rounded-xl"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3.5 bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-emerald-600 transition-all duration-300 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Buy Now
                </button>
              </div>

              {/* Accordions */}
              <div className="space-y-3 pt-4">
                {[
                  { id: 'details', label: 'Product Details', content: `Fabric: ${product.fabric || product.material || 'Premium Cotton'}\nStyle: ${product.style || 'Traditional'}\nAvailability: ${product.availability || 'Available'}\nCollection: ${product.subcategory || 'Latest Collection'}` },
                  { id: 'shipping', label: 'Delivery & Returns', content: 'Free shipping on orders above ₹999. Standard delivery within 5-7 business days. Returns accepted within 7 days of delivery for exchange or store credit.' },
                  { id: 'care', label: 'Care Instructions', content: 'Hand wash or gentle machine wash in cold water. Do not bleach. Dry in shade. Iron on medium heat. Do not tumble dry.' }
                ].map(section => (
                  <div key={section.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button onClick={() => setOpenSection(openSection === section.id ? '' : section.id)}
                      className="flex items-center justify-between w-full px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                      {section.label}
                      <ChevronIcon open={openSection === section.id} />
                    </button>
                    <div className={`transition-all duration-500 ${openSection === section.id ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                      <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed whitespace-pre-line">{section.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="py-20 mt-20 border-t border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-purple-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-3 block">Client Perspectives</span>
              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-gray-900 mb-8">The Experience</h2>
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-6xl font-serif font-bold text-gray-900">4.9</span>
                <span className="text-gray-400 font-medium text-sm">out of 5</span>
              </div>
              <div className="flex gap-1 mb-6 text-amber-500">{[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= 5} />)}</div>
              <p className="text-gray-500 text-sm">Based on {product.reviewCount || 128} verified reviews</p>
            </div>
            <div className="space-y-4">
              {ratingBars.map(({ n, pct }) => (
                <div key={n} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 w-6">{n}★</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-12 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recommendations */}
        {related.length > 0 && (
          <section className="py-20 border-t border-gray-100">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className="text-purple-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-3 block">You May Also Like</span>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">Complete The Look</h2>
              </div>
              <Link to="/collection" className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors">
                View All <span>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

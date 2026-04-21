import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
import { useCurrency } from '../context/CurrencyContext';
import { getProductPrice, getProductOriginalPrice, getOfferPrice, getOfferActive } from '../utils/priceUtils';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import ConfirmModal from '../components/ConfirmModal';

const StarIcon = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#d4a017" : "none"} stroke="#d4a017" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.89-8.89 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, getFullImgUrl, isWishlisted, toggleWishlist, user, token, settings } = useShop();
  const { formatPrice, country, currencySymbol } = useCurrency();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState('details');
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [offerExpired, setOfferExpired] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(5);

  const currentVariant = product?.variants?.find(v => v.color === selectedColor);
  
  let displayStock = product?.stock;
  if (currentVariant) {
    if (selectedSize && currentVariant.inventory?.length > 0) {
        const inv = currentVariant.inventory.find(i => i.size === selectedSize);
        if (inv) displayStock = inv.stock;
        else displayStock = currentVariant.stock;
    } else {
        displayStock = currentVariant.stock;
    }
  }

  const isSoldOut = product ? (displayStock <= 0 || product.label === 'Sold Out') : false;
  const stockLow = product ? displayStock <= 10 && displayStock > 0 : false;


  const isNotAvailableInCurrentCountry = product ? (
    (country === 'IN' && product.availableInIndia === false) ||
    (country === 'US' && product.availableInUS === false)
  ) : false;

  const handleUpdateReview = async (reviewId) => {
    try {
      const res = await API.put(`/products/${id}/reviews/${reviewId}`, { rating: editRating, comment: editComment });
      if (res.data.success) {
        toast.success('Review updated!');
        setProduct(res.data.product);
        setEditingReviewId(null);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to remove your review? This action cannot be undone.')) return;
    try {
      const res = await API.delete(`/products/${id}/reviews/${String(reviewId)}`);
      if (res.data.success) {
        toast.success('Review deleted!');
        setProduct(res.data.product);
      }
    } catch (err) { 
      console.error('Delete failed:', err);
      toast.error(err.response?.data?.message || 'Delete failed'); 
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment) { toast.error('Please add a review text'); return; }
    setSubmittingReview(true);
    try {
      const res = await API.post(`/products/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
        name: reviewName
      });
      if (res.data.success) {
        toast.success('Review submitted successfully!');
        setProduct(res.data.product);
        setReviewComment('');
        setReviewName('');
        setReviewRating(5);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review. Try logging in.');
    } finally { setSubmittingReview(false); }
  };

  useEffect(() => {
    setLoading(true);

    // ── Handle Local Admin IDs ───────────────────────────────────────────
    if (id?.startsWith('local_')) {
      const localData = localStorage.getItem('thaarai_local_products');
      const localProducts = localData ? JSON.parse(localData) : [];
      const localProduct = localProducts.find(p => p._id === id);

      if (localProduct) {
        setProduct(localProduct);
        if (localProduct.sizes?.length > 0) setSelectedSize(localProduct.sizes[0]);
        if (localProduct.colors?.length > 0) setSelectedColor(localProduct.colors[0]);

        // Pull related from locals only
        const relatedLocals = localProducts.filter(p => p.category === localProduct.category && p._id !== id);
        setRelated([...relatedLocals].slice(0, 4));
        setLoading(false);
        return;
      }
    }

    // ── Real API Fallback ────────────────────────────────────────────────
    API.get(`/products/${id}`).then(r => {
      const realProduct = r.data.product;
      setProduct(realProduct);
      if (realProduct.sizes?.length > 0) setSelectedSize(realProduct.sizes[0]);
      if (realProduct.variants?.length > 0) setSelectedColor(realProduct.variants[0].color);
      else if (realProduct.colors?.length > 0) setSelectedColor(realProduct.colors[0]);
      return API.get(`/products?category=${realProduct.category}&limit=6`);
    }).then(r => {
      let realRelated = r.data.products?.filter(p => p._id !== id) || [];
      setRelated(realRelated.slice(0, 4));
    }).catch(() => {
      // If API fails, show error
      setProduct(null);
      setRelated([]);
    }).finally(() => setLoading(false));
  }, [id, product?.category]);

  // Track recently viewed in localStorage
  useEffect(() => {
    if (!product) return;
    const raw = localStorage.getItem('thaarai_recently_viewed');
    let list = [];
    try { list = raw ? JSON.parse(raw) : []; } catch { }
    const filtered = list.filter(p => p._id !== product._id);
    filtered.unshift({ _id: product._id, name: product.name, price: product.price, images: product.images });
    localStorage.setItem('thaarai_recently_viewed', JSON.stringify(filtered.slice(0, 10)));
  }, [product]);

  // Auto-select first in-stock size when color changes or on load
  useEffect(() => {
    if (!product || !selectedColor || !product.sizes || product.sizes.length === 0) return;
    const variant = product.variants?.find(v => v.color === selectedColor);
    if (!variant || !variant.inventory) return;

    const isCurrentSizeOut = (variant.inventory.find(i => i.size === selectedSize)?.stock || 0) <= 0;
    if (isCurrentSizeOut) {
      const availableSize = product.sizes.find(s => (variant.inventory.find(i => i.size === s)?.stock || 0) > 0);
      if (availableSize) setSelectedSize(availableSize);
    }
  }, [product, selectedColor, selectedSize]);

  useEffect(() => {
    setShareUrl(window.location.href);
    
    // Calculate countdown from region-specific offerEndTime
    const calculateCountdown = () => {
      // Determine which offer to use based on country
      const offerEndTime = country === 'US' ? product?.offerEndTimeUSA : product?.offerEndTimeIndia;
      const offerActive = country === 'US' ? product?.offerActiveUSA : product?.offerActiveIndia;

      if (!offerEndTime || !offerActive) {
        setOfferExpired(true);
        setCountdown({ h: 0, m: 0, s: 0 });
        return;
      }

      const endTime = new Date(offerEndTime).getTime();
      const now = new Date().getTime();
      const timeDiff = endTime - now;

      if (timeDiff <= 0) {
        setOfferExpired(true);
        setCountdown({ h: 0, m: 0, s: 0 });
      } else {
        const h = Math.floor(timeDiff / (1000 * 60 * 60));
        const m = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((timeDiff % (1000 * 60)) / 1000);
        setOfferExpired(false);
        setCountdown({ h, m, s });
      }
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);
    return () => clearInterval(timer);
  }, [product, country]);

  // Freeze scroll for Size Guide Modal
  useEffect(() => {
    if (showSizeGuide) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showSizeGuide]);


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

  const detailFallback = settings?.productFallback ? getFullImgUrl(settings.productFallback) : '';
  const images = product.images?.length > 0 ? product.images : [detailFallback];

  const ratingBars = [5, 4, 3, 2, 1].map(n => {
    const count = product.reviews?.filter(r => r.rating === n).length || 0;
    const total = product.reviews?.length || 0;
    return {
      n,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0
    };
  });

  const handleAddToCart = () => {
    if (country === 'IN' && product.availableInIndia === false) { toast.error('This product is not available in India'); return; }
    if (country === 'US' && product.availableInUS === false) { toast.error('This product is not available in USA'); return; }
    if (product.sizes?.length > 0 && !selectedSize) { toast.error('Please select a size'); return; }

    const isSizeOut = currentVariant?.inventory ? (currentVariant.inventory.find(i => i.size === selectedSize)?.stock || 0) <= 0 : false;
    if (product.sizes?.length > 0 && isSizeOut) { toast.error(`Size ${selectedSize} is out of stock in this color`); return; }

    const isColorOut = product.variants?.length > 0 && currentVariant?.inventory ? currentVariant.inventory.reduce((sum, item) => sum + (Number(item.stock) || 0), 0) <= 0 : false;
    if (isColorOut) { toast.error(`Color ${selectedColor} is currently out of stock`); return; }

    addToCart(product._id, selectedSize, selectedColor);
  };

  const handleBuyNow = async () => {
    if (country === 'IN' && product.availableInIndia === false) { toast.error('This product is not available in India'); return; }
    if (country === 'US' && product.availableInUS === false) { toast.error('This product is not available in USA'); return; }
    if (product.sizes?.length > 0 && !selectedSize) { toast.error('Please select a size'); return; }

    const isSizeOut = currentVariant?.inventory ? (currentVariant.inventory.find(i => i.size === selectedSize)?.stock || 0) <= 0 : false;
    if (product.sizes?.length > 0 && isSizeOut) { toast.error(`Size ${selectedSize} is out of stock in this color`); return; }

    const isColorOut = product.variants?.length > 0 && currentVariant?.inventory ? currentVariant.inventory.reduce((sum, item) => sum + (Number(item.stock) || 0), 0) <= 0 : false;
    if (isColorOut) { toast.error(`Color ${selectedColor} is currently out of stock`); return; }

    await addToCart(product._id, selectedSize, selectedColor);
    navigate('/checkout');
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-8">
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
                <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto no-scrollbar md:w-20 shrink-0">
                  {/* Aggregate images: product images + selected variant images */}
                  {(() => {
                    const variantImgs = [];
                    if (currentVariant) {
                       if (currentVariant.images && currentVariant.images.length > 0) {
                          currentVariant.images.forEach(img => variantImgs.push(img));
                       } else if (currentVariant.image) {
                          variantImgs.push(currentVariant.image);
                       }
                    }
                    
                    // User requested: Not to show product.images in detail page. 
                    // Show variant images if available, otherwise just use them as the source.
                    const displayImages = variantImgs.length > 0 ? variantImgs : (product.images || []);
                    
                    return displayImages.map((img, i) => (
                      <button key={i} onClick={() => setSelectedImage(i)}
                        className={`shrink-0 w-16 md:w-full aspect-[3/4] overflow-hidden border transition-all duration-500 rounded-lg ${selectedImage === i ? 'border-black shadow-xl scale-105' : 'border-gray-100 opacity-60 hover:opacity-100 hover:border-gray-200'}`}>
                        <img src={getFullImgUrl(img)} alt="" className="w-full h-full object-cover"
                          loading="lazy" decoding="async"
                          onError={e => { 
                             if (detailFallback && e.target.src !== detailFallback) {
                                e.target.src = detailFallback;
                             }
                          }} />
                      </button>
                    ));
                  })()}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden group border border-gray-100 rounded-xl shadow-2xl">
                    {(() => {
                      const variantImgs = [];
                      if (currentVariant) {
                        if (currentVariant.images && currentVariant.images.length > 0) {
                          currentVariant.images.forEach(img => variantImgs.push(img));
                        } else if (currentVariant.image) {
                          variantImgs.push(currentVariant.image);
                        }
                      }
                      const displayImages = variantImgs.length > 0 ? variantImgs : (product.images || []);
                      const mainImg = displayImages[selectedImage] || displayImages[0];

                      return (
                        <img src={getFullImgUrl(mainImg)} alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                          fetchpriority="high" decoding="async"
                          onError={e => {
                            if (detailFallback && e.target.src !== detailFallback) {
                              e.target.src = detailFallback;
                            }
                          }} />
                      );
                    })()}

                    <button
                      onClick={() => toggleWishlist(product._id)}
                      className={`absolute top-6 right-6 w-12 h-12 backdrop-blur-md border flex items-center justify-center rounded-full shadow-2xl transition-all duration-500 group/fav ${isWishlisted(product._id) ? 'bg-red-500 border-red-500 text-white' : 'bg-white/80 border-gray-100 text-gray-400 hover:text-black'
                        }`}
                    >
                      <HeartIcon filled={isWishlisted(product._id)} />
                    </button>

                    <div className="absolute top-6 left-6 flex flex-col gap-3">
                      {(product.label || isSoldOut) && (() => {
                        const lowerLabel = (product.label || '').toLowerCase().trim();
                        if (lowerLabel.includes('-') && lowerLabel.includes('%')) return null;

                        return (
                          <span className={`text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 shadow-xl rounded-full ${isSoldOut ? 'bg-gray-800' : product.label === 'Hot' ? 'bg-red-500' : 'bg-emerald-500'
                            }`}>
                            {isSoldOut ? 'Sold Out' : product.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
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
                <span className="text-purple-500 font-bold text-[10px] uppercase tracking-[0.3em]">
                  {product.category && product.subcategory ? `${product.category} • ${product.subcategory}` : (product.subcategory || product.category)}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">{product.name}</h1>

              {/* Price Section */}
              <div className="space-y-3">
                <div className="flex items-baseline gap-3 flex-wrap">
                  {getOfferActive(product, country) && !offerExpired && getOfferPrice(product, country) > 0 ? (
                    <>
                      <p className="text-3xl md:text-4xl font-serif font-bold text-black">
                        {formatPrice(getOfferPrice(product, country))}
                      </p>
                      <span className="text-xl text-gray-400 line-through">
                        {formatPrice(getProductPrice(product, country))}
                      </span>
                      <span className="text-sm font-bold text-white bg-teal-600 px-3 py-1 rounded-full">
                        {Math.round(((getProductPrice(product, country) - getOfferPrice(product, country)) / getProductPrice(product, country)) * 100)}% OFF
                      </span>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
                        {formatPrice(getProductPrice(product, country))}
                      </p>
                      {getProductOriginalPrice(product, country) > 0 && getProductOriginalPrice(product, country) > getProductPrice(product, country) && (
                        <>
                          <span className="text-xl text-gray-400 line-through">
                            {formatPrice(getProductOriginalPrice(product, country))}
                          </span>
                          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            {Math.round(((getProductOriginalPrice(product, country) - getProductPrice(product, country)) / getProductOriginalPrice(product, country)) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex text-amber-500">{[1, 2, 3, 4, 5].map(i => <StarIcon key={i} filled={i <= Math.round(product.averageRating || 0)} />)}</div>
                  <span className="text-[11px] font-medium text-gray-500">{product.reviewCount || 0} Reviews</span>
                </div>
              </div>

              {/* Description */}
              <div className="border-l-2 border-purple-200 pl-4">
                <p className="text-gray-600 leading-snug text-sm line-clamp-2">
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
                    <button onClick={() => setShowSizeGuide(true)} className="text-[10px] font-medium text-purple-500 hover:text-purple-600">Size Guide</button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map(size => {
                      const isSizeOut = currentVariant?.inventory ? (currentVariant.inventory.find(i => i.size === size)?.stock || 0) <= 0 : false;
                      return (
                      <button key={size} 
                        disabled={isSizeOut}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 relative flex items-center justify-center text-[11px] font-bold tracking-wide border transition-all duration-300 rounded-lg ${isSizeOut ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400' : selectedSize === size ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}>
                        <span className={isSizeOut ? 'line-through' : ''}>{size}</span>
                        {isSizeOut && (
                          <svg className="absolute w-full h-full text-red-500/30" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="4" />
                          </svg>
                        )}
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {(product.variants?.length > 0 || product.colors?.length > 0) && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                    Color: <span className="text-gray-900 normal-case ml-1">{selectedColor}</span>
                  </p>
                  <div className="flex gap-3">
                     {(product.variants?.length > 0 ? product.variants : (product.colors || []).map(c => ({ color: c }))).map(v => {
                       const getColorValue = (colorName) => {
                         const colors = {
                           'imperial gold': '#d4a017', 'midnight': '#1a1a2e', 'ivory': '#faf8f3', 'pink': '#FFC0CB',
                           'burgundy': '#800020', 'teal': '#008080', 'charcoal': '#1C1C1C', 'wine': '#722F37'
                         };
                         return colors[colorName?.toLowerCase()] || colorName;
                       };
                       
                       const isColorOut = product.variants?.length > 0 && v.inventory ? v.inventory.reduce((sum, item) => sum + (Number(item.stock) || 0), 0) <= 0 : false;

                       return (
                         <button key={v.color} 
                           disabled={isColorOut}
                           onClick={() => { setSelectedColor(v.color); setSelectedImage(0); }}
                           className={`relative w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center overflow-hidden ${isColorOut ? 'opacity-40 cursor-not-allowed ring-1 ring-gray-200' : selectedColor === v.color ? 'ring-2 ring-gray-900 ring-offset-2 scale-110 shadow-lg' : 'ring-1 ring-gray-200 hover:scale-105'}`}
                           style={{ backgroundColor: getColorValue(v.color) }}
                           title={v.color}
                         >
                           {isColorOut && (
                             <svg className="absolute w-full h-full text-red-600" viewBox="0 0 100 100" preserveAspectRatio="none">
                               <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="8" />
                             </svg>
                           )}
                         </button>
                       );
                     })}
                  </div>
                </div>
              )}

              {/* Stock & Offer Alerts */}
              <div className="space-y-2">
                {stockLow && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-700 text-xs font-semibold">
                      Only {displayStock} left in stock — order soon!
                    </span>
                  </div>
                )}
                {((country === 'US' ? product?.offerActiveUSA : product?.offerActiveIndia) && !offerExpired) && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
                    <span className="text-amber-700 text-xs font-semibold">Limited offer ends in</span>
                    <span className="font-mono font-bold text-amber-800 text-sm">
                      {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {isSoldOut ? (
                  <button disabled className="w-full py-4 bg-gray-200 text-gray-400 font-bold text-sm uppercase tracking-wider rounded-xl cursor-not-allowed text-center">
                    SOLD OUT
                  </button>
                ) : isNotAvailableInCurrentCountry ? (
                  <button disabled className="w-full py-4 bg-gray-200 text-gray-400 font-bold text-sm uppercase tracking-wider rounded-xl cursor-not-allowed text-center">
                    NOT AVAILABLE IN THIS REGION
                  </button>
                ) : settings?.maintenanceMode ? (
                  <button disabled className="w-full py-4 bg-red-50 text-red-500 font-bold text-sm uppercase tracking-wider rounded-xl cursor-not-allowed text-center border border-red-100">
                    PURCHASING DISABLED
                  </button>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Share and Socials */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Share Product</span>
                <div className="flex gap-1.5">
                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product.name}: ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-green-500 bg-green-50 border border-green-100 rounded-full hover:bg-green-100 hover:scale-105 transition-all" title="WhatsApp">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.5-27.4-16.4-14.6-27.5-32.8-30.7-38.3-3.2-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.2 3.7-5.6 5.6-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.7 23.6 9.1 31.6 11.7 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" /></svg>
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-black bg-blue-50 border border-blue-100 rounded-full hover:bg-blue-100 hover:scale-105 transition-all" title="Facebook">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 320 512"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" /></svg>
                  </a>
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this product: ${product.name}`)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-sky-500 bg-sky-50 border border-sky-100 rounded-full hover:bg-sky-100 hover:scale-105 transition-all" title="Twitter / X">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 512 512"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" /></svg>
                  </a>
                  <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied to clipboard!'); }}
                    className="p-2 text-gray-600 bg-gray-50 border border-gray-100 rounded-full hover:bg-gray-100 hover:scale-105 transition-all" title="Copy Link">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              </div>

              {/* Accordions */}
              <div className="space-y-3 pt-4">
                {[
                  { id: 'details', label: 'Product Details', content: `Fabric: ${product.fabric || product.material || 'Premium Cotton'}\nStyle: ${product.style || 'Traditional'}\nAvailability: ${product.availability || 'Available'}\nCollection: ${product.subcategory || 'Latest Collection'}` },
                  { id: 'shipping', label: 'Delivery & Returns', content: `Free shipping on orders above ${currencySymbol}${country === 'US' ? '50' : '999'}. Standard delivery within ${country === 'US' ? '7-10' : '5-7'} business days. Returns accepted within 7 days of delivery for exchange or store credit.` },
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start pb-12 border-b border-gray-100">
            <div>
              <span className="text-purple-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-3 block">Client Perspectives</span>
              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-gray-900 mb-8">The Experience</h2>
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-6xl font-serif font-bold text-gray-900">{(product.averageRating || 0).toFixed(1)}</span>
                <span className="text-gray-400 font-medium text-sm">out of 5</span>
              </div>
              <div className="flex gap-1 mb-6 text-amber-500">{[1, 2, 3, 4, 5].map(i => <StarIcon key={i} filled={i <= Math.round(product.averageRating || 0)} />)}</div>
              <p className="text-gray-500 text-sm">Based on {product.reviewCount || 0} verified reviews</p>
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

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Submit Review */}
            <div className="lg:col-span-4 bg-gray-50/80 p-6 rounded-2xl border border-gray-100 space-y-4">
              <h3 className="font-serif text-lg font-bold text-gray-900">Add a Review</h3>
              {!token ? (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center space-y-1">
                  <p className="text-xs font-bold text-amber-800">Please login to add a review.</p>
                  <Link to="/login" className="text-[10px] text-purple-600 font-bold hover:underline block mt-1">Login Now</Link>
                </div>
              ) : product.reviews?.some(r => user && (r.userId === user._id || r.userId === user.id)) ? (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center space-y-1">
                  <p className="text-xs font-bold text-emerald-800">You have already reviewed this product.</p>
                  <p className="text-[10px] text-emerald-600">Thank you for sharing your experience!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Rating</label>
                    <div className="flex gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map(i => (
                        <button type="button" key={i} onClick={() => setReviewRating(i)}>
                          <StarIcon filled={i <= reviewRating} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Your Name (Optional)</label>
                    <input type="text" value={reviewName} onChange={e => setReviewName(e.target.value)} placeholder="Anonymous"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Review</label>
                    <textarea rows="4" value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white resize-none" required />
                  </div>
                  <button type="submit" disabled={submittingReview}
                    className="w-full py-2.5 bg-purple-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50">
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              )}
            </div>

            {/* Review List */}
            <div className="lg:col-span-8 space-y-6">
              <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">Customer Reviews ({product.reviews?.length || 0})</h3>
              {(!product.reviews || product.reviews.length === 0) ? (
                <div className="py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium italic text-sm">No reviews yet. Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {product.reviews.map((r, i) => {
                    const isOwner = user && (String(r.userId) === String(user._id) || String(r.userId) === String(user.id));
                    const isAdmin = user && (user.role === 'admin');
                    const canManage = isOwner || isAdmin;
                    const isEditing = editingReviewId === r._id;

                    return (
                      <div key={r._id || i} className="py-5 first:pt-0">
                        {isEditing ? (
                          <div className="space-y-3 p-4 bg-white border border-gray-100 rounded-xl">
                            <div>
                              <div className="flex gap-1 text-amber-500 mb-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button type="button" key={star} onClick={() => setEditRating(star)}>
                                    <StarIcon filled={star <= editRating} />
                                  </button>
                                ))}
                              </div>
                              <textarea rows="3" value={editComment} onChange={e => setEditComment(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleUpdateReview(r._id)} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700">Update</button>
                              <button onClick={() => setEditingReviewId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold text-gray-900">{r.name || 'Customer'}</p>
                                  {r.verifiedPurchase && (
                                    <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
                                      <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                      Verified Buyer
                                    </span>
                                  )}
                                  <div className="flex gap-2 ml-2">
                                    {isOwner && (
                                      <button onClick={() => { setEditingReviewId(r._id); setEditComment(r.comment); setEditRating(r.rating); }} className="text-[10px] text-purple-500 hover:underline">Edit</button>
                                    )}
                                    {canManage && (
                                      <button onClick={() => handleDeleteReview(r._id)} className="text-[10px] text-red-500 hover:underline">Delete</button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'Recently'}</p>
                              </div>
                              <div className="flex text-amber-500">
                                {[1, 2, 3, 4, 5].map(star => <StarIcon key={star} filled={star <= r.rating} />)}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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

      {/* Size Guide Modal */}
      {showSizeGuide && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div className="absolute inset-0" onClick={() => setShowSizeGuide(false)}></div>

          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-fade-in flex flex-col transform scale-100" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif text-xl font-bold text-gray-900">Size Guide</h3>
              <button onClick={() => setShowSizeGuide(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <table className="w-full text-xs font-sans text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-3 font-bold uppercase tracking-wider text-gray-500">Size</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-gray-500">Chest (Inches)</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-gray-500">Waist (Inches)</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-gray-500">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s, idx) => (
                  <tr key={s} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-bold text-gray-900">{s}</td>
                    <td className="p-3 text-gray-600">{32 + idx * 2}"</td>
                    <td className="p-3 text-gray-600">{26 + idx * 2}"</td>
                    <td className="p-3 text-gray-600">{42 + (idx % 2)}"</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-[10px] text-gray-400 italic font-sans border-t border-gray-50 pt-2">
              * Measurements shown are in inches. Product cuts can vary by ±1 inch depending on exact fabric craft styles.
            </p>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

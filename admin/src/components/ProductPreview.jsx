import React, { useState, useEffect } from 'react';
import { X, Star, Heart, Share2, ChevronRight, ChevronDown } from 'lucide-react';
import { getFullUrl } from '../api';

export default function ProductPreview({ product, images, onClose }) {
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.variants?.[0]?.color || product.colors?.[0] || 'Default');
  const [manualImg, setManualImg] = useState(null);

  const mainImages = [
    ...(product.existingImages || []).map(img => getFullUrl(img)),
    ...(images || []).map(file => URL.createObjectURL(file))
  ];

  const variantImages = [];
  (product.variants || []).forEach(v => {
     (v.images || []).forEach(img => variantImages.push(getFullUrl(img)));
     (v.pendingFiles || []).forEach(file => variantImages.push(URL.createObjectURL(file)));
  });

  // Map color selection to specific variant images
  const currentVariant = product.variants?.find(v => v.color === selectedColor);
  const variantImgUrls = [];
  if (currentVariant) {
     (currentVariant.images || []).forEach(img => variantImgUrls.push(getFullUrl(img)));
     (currentVariant.pendingFiles || []).forEach(file => variantImgUrls.push(URL.createObjectURL(file)));
  }

  // Final image to display logic
  const galleryImages = variantImgUrls.length > 0 ? variantImgUrls : variantImages;
  const currentMainImage = manualImg || galleryImages[0] || (product.existingImages?.[0] ? getFullUrl(product.existingImages[0]) : null);

  // Price Logic: Sync with storefront offer behavior
  const offerPrice = Number(product.offerPriceIndia);
  const isOfferActive = product.offerActiveIndia && offerPrice > 0;
  
  const displayPrice = isOfferActive ? offerPrice : (Number(product.price) || 0);
  const displayOriginalPrice = isOfferActive ? (Number(product.price) || 0) : (Number(product.originalPrice) || 0);
  const discount = displayOriginalPrice > displayPrice ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) : 0;
  
  const variantStock = currentVariant ? Number(currentVariant.stock) : Number(product.stock);
  const isSoldOut = variantStock <= 0 || product.label === 'Sold Out';

  // ── Live offer countdown ──────────────────────────────────────────
  const toBool = (val) => val === true || val === 'true';
  const offerEndTime = product.offerEndTimeIndia;
  const offerIsActive = toBool(product.offerActiveIndia) &&
    Number(product.offerPriceIndia) > 0 &&
    offerEndTime &&
    new Date(offerEndTime).getTime() > Date.now();

  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [offerExpired, setOfferExpired] = useState(false);

  useEffect(() => {
    if (!offerIsActive || !offerEndTime) { setOfferExpired(true); return; }
    const calc = () => {
      const diff = new Date(offerEndTime).getTime() - Date.now();
      if (diff <= 0) { setOfferExpired(true); return; }
      setCountdown({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [offerEndTime, offerIsActive]);

  const StarIcon = ({ filled }) => (
    <Star size={14} fill={filled ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth={1.5} />
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/40 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-[1400px] h-[90vh] rounded-[3rem] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col md:flex-row transform transition-all duration-700 animate-in zoom-in-95 slide-in-from-bottom-10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-[110] w-14 h-14 bg-white/80 backdrop-blur-md border border-gray-100 flex items-center justify-center rounded-full hover:bg-black hover:text-white transition-all duration-500 shadow-xl group hover:rotate-90"
        >
          <X size={24} className="transition-transform" />
        </button>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col md:flex-row p-8 md:p-12 lg:p-16 gap-12 lg:gap-24">
          
          <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-12">
              <span className="cursor-default">HOME</span> <span className="text-gray-200">/</span>
              <span className="cursor-default">COLLECTION</span> <span className="text-gray-200">/</span>
              <span className="text-gray-900">{product.name || 'PROFESSSIOAL SHOE'}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              
              {/* Visuals Column */}
              <div className="lg:col-span-6">
                <div className="flex flex-col-reverse md:flex-row gap-4">
                   <div className="flex md:flex-col gap-4 overflow-x-auto no-scrollbar md:w-24 shrink-0 px-1 py-1">
                    {(galleryImages || []).map((img, i) => (
                      <button key={i} onClick={() => { setActiveImg(i); setManualImg(img); }} 
                        className={`shrink-0 w-20 md:w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-500 shadow-sm ${currentMainImage === img ? 'border-gray-900 shadow-xl scale-105 opacity-100' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                        <img src={img} className="w-full h-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex-1 relative aspect-[3/4] bg-gray-50 overflow-hidden rounded-[2.5rem] shadow-2xl group border border-gray-100">
                    {currentMainImage ? (
                      <img 
                         src={currentMainImage} 
                         className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                         alt="Product" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 font-serif text-xl italic">Luxury Placeholder</div>
                    )}
                    
                    {/* Badges & Actions */}
                    <div className="absolute top-8 left-8 flex flex-col gap-3">
                      {product.label && (
                        <span className="bg-black text-white text-[10px] font-bold tracking-[0.3em] px-6 py-2.5 rounded-full shadow-2xl backdrop-blur-md bg-black/80">
                          {product.label}
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="bg-teal-500 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-xl self-start">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    <button className="absolute top-8 right-8 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shadow-xl">
                      <Heart size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Column */}
              <div className="lg:col-span-6 space-y-12 py-4">
                <div className="space-y-4">
                  <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">{product.name || 'Sample Product Name'}</h1>
                  
                  <div className="flex items-baseline gap-4">
                    <span className="text-3xl md:text-4xl font-serif font-bold text-black">₹{displayPrice.toLocaleString()}</span>
                    {displayOriginalPrice > displayPrice && (
                      <span className="text-xl text-gray-400 line-through font-sans">₹{displayOriginalPrice.toLocaleString()}</span>
                    )}
                    {discount > 0 && (
                      <span className="bg-teal-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">{discount}% OFF</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex gap-0.5 text-amber-400">
                       {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= (product.averageRating || 0)} />)}
                    </div>
                    <span className="text-sm font-medium text-gray-400">
                      {product.reviews?.length || 0} reviews
                    </span>
                  </div>
                </div>

                {/* Sub-description accent */}
                <div className="flex items-center gap-4 border-l-[3px] border-purple-100 pl-4 py-1">
                   <p className="text-[13px] text-muted font-light italic tracking-wide">{product.subcategory?.toLowerCase() || 'professional'}</p>
                </div>
                
                {/* Meta Pills - Sync with storefront design */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {product.fabric && (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {product.fabric}
                    </span>
                  )}
                  {product.style && (
                    <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {product.style}
                    </span>
                  )}
                  {product.availability && product.availability !== 'Available' && (
                    <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {product.availability}
                    </span>
                  )}
                </div>

                <div className="space-y-8 pt-4">
                   {/* Size Selector */}
                   <div className="relative">
                     <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Select Size</label>
                        <button className="text-[9px] uppercase font-bold tracking-[0.2em] text-purple-500 border-b border-purple-200 pb-0.5">Size Guide</button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {(product.sizes && product.sizes.length > 0 ? product.sizes : ['8', '9']).map((s, i) => (
                         <button key={s} className="w-14 h-14 border border-gray-100 flex items-center justify-center text-xs font-bold transition-all hover:border-gray-900 rounded-xl focus:bg-black focus:text-white focus:border-black shadow-sm">{s}</button>
                       ))}
                     </div>
                   </div>

                   {/* Color Selector */}
                   <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-4">COLOR: <span className="text-charcoal normal-case ml-2">{selectedColor}</span></p>
                       <div className="flex gap-4">
                          {product.variants?.map((v, i) => {
                           const getColorValue = (colorName) => {
                             const colors = { 
                               'imperial gold': '#d4a017', 'midnight': '#1a1a2e', 
                               'ivory': '#faf8f3', 'pink': '#FFC0CB',
                               'burgundy': '#800020', 'teal': '#008080', 
                               'charcoal': '#1C1C1C', 'wine': '#722F37' 
                             };
                             return colors[colorName.toLowerCase()] || colorName;
                           };

                           return (
                            <button 
                              key={i} 
                              onClick={() => { setSelectedColor(v.color); setManualImg(null); }}
                              className={`w-14 h-14 rounded-full border-2 transition-all p-1 ${selectedColor === v.color ? 'border-gray-900 scale-110 shadow-lg' : 'border-gray-100'}`}
                            >
                               <div className="w-full h-full rounded-full overflow-hidden" 
                                    style={{ backgroundColor: getColorValue(v.color) }} />
                            </button>
                          )})}
                       </div>
                   </div>

                   {/* Add to Bag */}
                    {/* Offer Countdown - SYNCED WITH FRONTEND DESIGN */}
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-6 py-4 shadow-sm">
                       <span className="text-amber-700 text-xs font-bold uppercase tracking-widest">Limited offer ends in</span>
                       <span className="font-mono font-bold text-amber-800 text-lg tracking-wider">
                         67 : 23 : 58
                       </span>
                    </div>

                    <div className="space-y-4">
                      {isSoldOut ? (
                        <button disabled className="w-full bg-[#E5E7EB] text-gray-400 h-20 rounded-2xl text-xs font-black uppercase tracking-[0.4em] cursor-not-allowed">
                          SOLD OUT
                        </button>
                      ) : (
                        <button className="w-full bg-black text-white h-20 rounded-2xl text-xs font-black uppercase tracking-[0.4em] hover:bg-gold-600 transition-all shadow-2xl flex items-center justify-center gap-4 group">
                          ADD TO BAG <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </button>
                      )}
                    </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import API, { BACKEND_URL, getImgUrl } from '../api';
import { toast } from 'react-toastify';
import { Trash2, Pencil, Check, X, Plus } from 'lucide-react';

// Labels and constants - DEFAULT_SIZES as fallback
const LABELS = ['', 'Hot', 'New Arrival', 'Trending', 'Sold Out'];
const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];
const AVAILABILITY = ['Available', 'Limited Stock', 'Made to Order', 'Pre-Order'];

const initialForm = {
  name: '', description: '', category: 'Kurti', subcategory: '', price: '',
  originalPrice: '', stock: '', fabric: '', style: '', label: '', bestseller: false,
  availability: 'Available', sizes: [], colors: [], variants: [],
  priceUSD: '', originalPriceUSD: '', availableInIndia: true, availableInUS: false,
  offerEndTimeIndia: '', offerActiveIndia: false, offerPriceIndia: '', offerPriceUSDIndia: '',
  offerEndTimeUSA: '', offerActiveUSA: false, offerPriceUSDUSA: ''
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const duplicateId = new URLSearchParams(location.search).get('duplicateId');
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit || Boolean(duplicateId));
  const [status, setStatus] = useState('Publish');
  const [isPreview, setIsPreview] = useState(false);
  const [priceTab, setPriceTab] = useState('INR');
  const [categories, setCategories] = useState([]);
  const [matchingSubcats, setMatchingSubcats] = useState([]);
  const [availableFabrics, setAvailableFabrics] = useState([]);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [availableSizes, setAvailableSizes] = useState(DEFAULT_SIZES);

  // 1. Initial Load: Fetch Categories
  useEffect(() => {
    API.get('/categories').then(res => {
      if (res.data.success) {
        setCategories(res.data.categories || []);
      }
    }).catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  // 2. Fetch product data if editing/duplicating
  useEffect(() => {
    const loadId = id || duplicateId;
    if (loadId) {
      API.get(`/products/${loadId}`).then(r => {
        const p = r.data.product;
        const formatDateTimeLocal = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setForm({
          name: duplicateId ? `${p.name} (Copy)` : p.name, 
          description: p.description, category: p.category,
          subcategory: p.subcategory || '', price: p.price, originalPrice: p.originalPrice || '',
          stock: p.stock, fabric: p.fabric || p.material || '', style: p.style || '',
          label: p.label || '', bestseller: p.bestseller || false,
          availability: p.availability || 'Available',
          sizes: p.sizes || [], colors: p.colors || [], variants: p.variants || [],
          priceUSD: p.priceUSD || '', originalPriceUSD: p.originalPriceUSD || '',
          availableInIndia: p.availableInIndia !== false, availableInUS: p.availableInUS || false,
          offerEndTimeIndia: formatDateTimeLocal(p.offerEndTimeIndia),
          offerActiveIndia: p.offerActiveIndia || false,
          offerPriceIndia: p.offerPriceIndia || '',
          offerPriceUSDIndia: p.offerPriceUSDIndia || '',
          offerEndTimeUSA: formatDateTimeLocal(p.offerEndTimeUSA),
          offerActiveUSA: p.offerActiveUSA || false,
          offerPriceUSDUSA: p.offerPriceUSDUSA || '',
          averageRating: p.averageRating,
          reviews: p.reviews || []
        });
        setStatus(p.status || 'Publish');
        if (!duplicateId) setExistingImages(p.images || []);
      }).finally(() => setFetchLoading(false));
    } else {
      setFetchLoading(false);
    }
  }, [id, duplicateId]);

  // 3. Sync matching subcategories, fabrics, styles and sizes
  useEffect(() => {
    if (!form.category || categories.length === 0) {
      setMatchingSubcats([]);
      setAvailableFabrics([]);
      setAvailableStyles([]);
      setAvailableSizes(DEFAULT_SIZES);
      return;
    }

    const catObj = categories.find(c => 
      (c.name || '').toLowerCase() === (form.category || '').toLowerCase()
    );

    if (catObj) {
      const subs = catObj.subcategories || [];
      setMatchingSubcats(subs);
      
      const subObj = subs.find(s => 
        (typeof s === 'string' ? s : s?.name || '').toLowerCase() === (form.subcategory || '').toLowerCase()
      );
      
      let currentFabrics = [
        ...(subObj && typeof subObj !== 'string' ? (subObj.fabrics || []) : []),
        ...(catObj.defaultFabrics || [])
      ];
      let currentStyles = [
        ...(subObj && typeof subObj !== 'string' ? (subObj.styles || []) : []),
        ...(catObj.defaultStyles || [])
      ];

      // Dynamic sizes from category
      let currentSizes = catObj.availableSizes && catObj.availableSizes.length > 0 
        ? [...catObj.availableSizes] 
        : [...DEFAULT_SIZES];

      currentFabrics = [...new Set(currentFabrics)].filter(Boolean).sort();
      currentStyles = [...new Set(currentStyles)].filter(Boolean).sort();

      const isPersistent = isEdit || Boolean(duplicateId);
      if (isPersistent) {
        if (form.fabric && !currentFabrics.includes(form.fabric)) currentFabrics.push(form.fabric);
        if (form.style && !currentStyles.includes(form.style)) currentStyles.push(form.style);
        form.sizes.forEach(s => { if (!currentSizes.includes(s)) currentSizes.push(s); });
      }

      setAvailableFabrics(currentFabrics);
      setAvailableStyles(currentStyles);
      setAvailableSizes(currentSizes);
    }
  }, [form.category, form.subcategory, categories, isEdit, duplicateId, form.fabric, form.style]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const toggleSize = size => {
    setForm({ ...form, sizes: form.sizes.includes(size) ? form.sizes.filter(s => s !== size) : [...form.sizes, size] });
  };

  const addColor = () => {
    if (colorInput && !form.colors.includes(colorInput)) {
      setForm({ ...form, colors: [...form.colors, colorInput] });
      setColorInput('');
    }
  };

  const removeColor = c => setForm({ ...form, colors: form.colors.filter(x => x !== c) });

  const handleSubmit = async (e, submitStatus = 'Publish') => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'sizes' || k === 'colors' || k === 'variants') {
           if (k === 'variants') {
              const cleanVariants = v.map(varItem => ({ color: varItem.color, stock: varItem.stock, image: varItem.image }));
              data.append(k, JSON.stringify(cleanVariants));
              
              v.forEach((varItem, i) => {
                 if (varItem.file) {
                    data.append(`variantImage_${i}`, varItem.file);
                 }
              });
           } else {
              data.append(k, JSON.stringify(v));
           }
        }
        else if ((k === 'offerEndTimeIndia' || k === 'offerEndTimeUSA') && v) {
          data.append(k, new Date(v).toISOString());
        }
        else data.append(k, v);
      });
      data.append('status', submitStatus);
      images.forEach(img => data.append('images', img));

      if (isEdit) {
        data.append('existingImages', JSON.stringify(existingImages));
        await API.put(`/products/${id}`, data);
        toast.success('Product updated successfully');
      } else {
        await API.post('/products', data);
        toast.success('Product added successfully');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
    setLoading(false);
  };

  if (fetchLoading) return <Layout title="Loading..."><div className="animate-pulse h-96 bg-gray-100 rounded" /></Layout>;

  return (
    <Layout title={isEdit ? 'Edit Product' : 'Add Product'}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Product Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} className="input-field" required placeholder="e.g. Chanderi Silk Anarkali Kurti" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Description *</label>
                  <textarea name="description" value={form.description} onChange={handleChange} className="input-field min-h-[100px] resize-none" required placeholder="Describe the product details..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Category *</label>
                    <select name="category" value={form.category} onChange={handleChange} className="input-field shadow-sm" required>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Subcategory</label>
                     <select name="subcategory" value={form.subcategory} onChange={handleChange} className="input-field shadow-sm">
                        <option value="">— No Subcategory —</option>
                         {matchingSubcats.map(s => {
                           const name = typeof s === 'string' ? s : s?.name || '';
                           return <option key={name} value={name}>{name}</option>;
                         })}
                     </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Fabric / Material *</label>
                    <select name="fabric" value={form.fabric} onChange={handleChange} className="input-field">
                      <option value="">Select Fabric</option>
                      {availableFabrics.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Style</label>
                    <select name="style" value={form.style} onChange={handleChange} className="input-field">
                      <option value="">Select Style</option>
                      {availableStyles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Sizes</h3>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => (
                  <button type="button" key={size} onClick={() => toggleSize(size)}
                    className={`w-14 h-10 text-xs font-sans border-2 transition-all ${form.sizes.includes(size) ? 'border-gold-600 bg-gold-600 text-white' : 'border-gray-200 hover:border-gray-400'}`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Color Variants</h3>
              <div className="space-y-4 mb-4">
                {form.variants.map((v, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-lg relative">
                    <button type="button" onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }))} className="absolute -top-2 -right-2 bg-red-100 border border-red-200 text-red-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs hover:bg-red-200 transition-colors z-10">&times;</button>
                    
                    <div className="flex-1 w-full">
                       <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Color Name</label>
                       <input value={v.color} onChange={e => setForm(f => ({ ...f, variants: f.variants.map((varItem, idx) => idx === i ? { ...varItem, color: e.target.value } : varItem) }))} placeholder="e.g. Red" className="input-field bg-white" />
                    </div>
                    
                    <div className="w-full sm:w-24">
                       <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Stock</label>
                       <input type="number" value={v.stock} onChange={e => setForm(f => ({ ...f, variants: f.variants.map((varItem, idx) => idx === i ? { ...varItem, stock: parseInt(e.target.value) || 0 } : varItem) }))} placeholder="0" className="input-field bg-white" />
                    </div>

                    <div className="w-full sm:w-auto">
                       <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">Specific Image</label>
                       <div className="flex items-center gap-2">
                           {v.image && typeof v.image === 'string' && !v.file && (
                               <a href={getImgUrl(v.image)} target="_blank" rel="noopener noreferrer">
                                 <img src={getImgUrl(v.image)} className="w-10 h-10 object-cover rounded border border-gray-200 hover:border-gold-400 transition-colors" alt="" />
                               </a>
                           )}
                           {v.file && (
                               <img src={URL.createObjectURL(v.file)} className="w-10 h-10 object-cover rounded border border-gray-200" alt="" />
                           )}
                           <label className="cursor-pointer bg-white border border-gray-200 px-3 py-2 rounded text-xs hover:border-gold-400 transition-colors whitespace-nowrap">
                              {v.file || v.image ? 'Change' : '+ Upload'}
                              <input type="file" accept="image/*" className="hidden" onChange={e => {
                                 if (e.target.files[0]) {
                                     setForm(f => ({ ...f, variants: f.variants.map((varItem, idx) => idx === i ? { ...varItem, file: e.target.files[0] } : varItem) }));
                                 }
                              }} />
                           </label>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, variants: [...f.variants, { color: '', stock: 0, image: '', file: null }] }))} className="w-full btn-outline flex items-center justify-center gap-2 border-dashed">
                <Plus size={16} /> Add New Color Variant
              </button>
            </div>

            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Product Images</h3>
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-3">Current Images</p>
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <a href={getImgUrl(img)} target="_blank" rel="noopener noreferrer">
                          <img src={getImgUrl(img)} alt="" className="w-20 h-24 object-cover bg-gray-100 rounded-lg hover:ring-2 hover:ring-gold-400 transition-all" />
                        </a>
                        <button type="button" onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {images.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-3">Newly Added Images</p>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={URL.createObjectURL(img)} alt="" className="w-20 h-24 object-cover bg-gray-100 rounded-lg" />
                        <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <label className="block border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-gold-400 transition-all">
                <input type="file" accept="image/*" multiple onChange={e => setImages([...images, ...Array.from(e.target.files)])} className="hidden" />
                <div className="flex flex-col items-center gap-2">
                  <Plus className="w-8 h-8 text-gray-300" />
                  <p className="text-sm font-sans text-gray-500">Click or Drag & Drop to upload images</p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-4">Pricing & Stock</h3>
              <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg">
                <button type="button" onClick={() => setPriceTab('INR')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all ${priceTab === 'INR' ? 'bg-white text-charcoal shadow-sm' : 'text-gray-400'}`}>🇮🇳 India</button>
                <button type="button" onClick={() => setPriceTab('USD')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all ${priceTab === 'USD' ? 'bg-white text-charcoal shadow-sm' : 'text-gray-400'}`}>🇺🇸 USA</button>
              </div>
              <div className="space-y-4">
                {priceTab === 'INR' ? (
                  <>
                    <input name="price" type="number" value={form.price} onChange={handleChange} className="input-field" placeholder="Sale Price (₹)" required />
                    <input name="originalPrice" type="number" value={form.originalPrice} onChange={handleChange} className="input-field" placeholder="Original Price (₹)" />
                    <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="availableInIndia" checked={form.availableInIndia} onChange={handleChange} className="accent-green-600" /><span className="text-xs font-sans">Available in India</span></label>
                  </>
                ) : (
                  <>
                    <input name="priceUSD" type="number" value={form.priceUSD} onChange={handleChange} className="input-field" placeholder="Sale Price ($)" />
                    <input name="originalPriceUSD" type="number" value={form.originalPriceUSD} onChange={handleChange} className="input-field" placeholder="Original Price ($)" />
                    <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="availableInUS" checked={form.availableInUS} onChange={handleChange} className="accent-blue-600" /><span className="text-xs font-sans">Available in USA</span></label>
                  </>
                )}
                <input name="stock" type="number" value={form.stock} onChange={handleChange} className="input-field" placeholder="Stock Quantity" required />
                <select name="availability" value={form.availability} onChange={handleChange} className="input-field">
                  {AVAILABILITY.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Status & Labels</h3>
              <select name="label" value={form.label} onChange={handleChange} className="input-field mb-4">
                {LABELS.map(l => <option key={l} value={l}>{l || '— None —'}</option>)}
              </select>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="bestseller" checked={form.bestseller} onChange={handleChange} className="accent-gold-600" />
                <span className="text-sm font-sans">Mark as Bestseller</span>
              </label>
            </div>

            {/* Flash Offers */}
            <div className="card p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
               <h3 className="font-serif text-lg text-charcoal mb-4">Flash Sale Offers</h3>
               <div className="space-y-4">
                  <div className="bg-white p-3 rounded border border-amber-100">
                     <p className="text-[10px] font-bold mb-2">🇮🇳 India Offer</p>
                     <label className="flex items-center gap-2 mb-2"><input type="checkbox" name="offerActiveIndia" checked={form.offerActiveIndia} onChange={handleChange} /><span className="text-[10px]">Active</span></label>
                     {form.offerActiveIndia && (
                        <div className="space-y-2">
                           <input type="datetime-local" name="offerEndTimeIndia" value={form.offerEndTimeIndia} onChange={handleChange} className="text-[10px] w-full border p-1" />
                           <input type="number" name="offerPriceIndia" value={form.offerPriceIndia} onChange={handleChange} placeholder="Offer Price (₹)" className="text-[10px] w-full border p-1" />
                        </div>
                     )}
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-100">
                     <p className="text-[10px] font-bold mb-2">🇺🇸 USA Offer</p>
                     <label className="flex items-center gap-2 mb-2"><input type="checkbox" name="offerActiveUSA" checked={form.offerActiveUSA} onChange={handleChange} /><span className="text-[10px]">Active</span></label>
                     {form.offerActiveUSA && (
                        <div className="space-y-2">
                           <input type="datetime-local" name="offerEndTimeUSA" value={form.offerEndTimeUSA} onChange={handleChange} className="text-[10px] w-full border p-1" />
                           <input type="number" name="offerPriceUSDUSA" value={form.offerPriceUSDUSA} onChange={handleChange} placeholder="Offer Price ($)" className="text-[10px] w-full border p-1" />
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => setIsPreview(true)} className="btn-outline w-full py-2">Preview</button>
              <div className="flex gap-2">
                <button type="button" onClick={(e) => handleSubmit(e, 'Draft')} disabled={loading} className="btn-outline flex-1">Draft</button>
                <button type="button" onClick={(e) => handleSubmit(e, 'Publish')} disabled={loading} className="btn-primary flex-1">{isEdit ? 'Update' : 'Publish'}</button>
              </div>
              <button type="button" onClick={() => navigate('/products')} className="btn-outline w-full">Cancel</button>
            </div>
          </div>
        </div>
      </form>

      {isEdit && form.reviews && (
        <div className="mt-12 pt-12 border-t pb-20">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-serif text-2xl text-charcoal">Customer Perspectives</h3>
              <div className="flex gap-4">
                 <div className="text-right"><p className="text-xl font-bold font-serif">{(form.averageRating || 0).toFixed(1)}</p><p className="text-[9px] uppercase tracking-widest text-gray-400">Avg Rating</p></div>
                 <div className="text-right"><p className="text-xl font-bold font-serif">{form.reviews.length}</p><p className="text-[9px] uppercase tracking-widest text-gray-400">Reviews</p></div>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {form.reviews.map((r, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border relative group">
                  <button onClick={async () => {
                    if (window.confirm('Delete review?')) {
                      await API.delete(`/products/${id}/reviews/${r._id}`);
                      setForm(prev => ({ ...prev, reviews: prev.reviews.filter(item => item._id !== r._id) }));
                    }
                  }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                  <p className="text-sm font-bold">{r.name}</p>
                  <div className="flex text-gold-500">{'★'.repeat(r.rating)}</div>
                  <p className="text-sm italic mt-2">"{r.comment}"</p>
                  <p className="text-[10px] text-gray-400 mt-4">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
           </div>
        </div>
      )}
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import API, { BACKEND_URL, getFullUrl } from '../api';
import { toast } from 'react-toastify';
import { Trash2, Pencil, Check, X, Plus, Crop, Eye } from 'lucide-react';
import CropModal from '../components/CropModal';
import ProductPreview from '../components/ProductPreview';

// Labels and constants
const LABELS = ['', 'Hot', 'New Arrival', 'Trending', 'Sold Out'];
const DEFAULT_CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];
const DEFAULT_SHOE_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12', 'Free Size'];
const DEFAULT_SIZES = DEFAULT_CLOTHING_SIZES;
const AVAILABILITY = ['Available', 'Limited Stock', 'Made to Order', 'Pre-Order'];

// Returns true if a category name is shoe/footwear type
const isShoesCategory = (catName = '') => {
  const n = catName.toLowerCase();
  return n.includes('shoe') || n.includes('footwear') || n.includes('sandal') || n.includes('slipper') || n.includes('boot') || n.includes('heel');
};

const initialForm = {
  name: '', description: '', category: 'Kurti', subcategory: '', price: '',
  originalPrice: '', stock: '', fabric: '', style: '', label: '', bestseller: false,
  availability: 'Available', sizes: [], colors: [], variants: [],
  priceUSD: '', originalPriceUSD: '', availableInIndia: true, availableInUS: false,
  offerEndTimeIndia: '', offerActiveIndia: false, offerPriceIndia: '', offerPriceUSDIndia: '',
  offerEndTimeUSA: '', offerActiveUSA: false, offerPriceUSDUSA: '',
  codAllowed: true, returnWindowDays: ''
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
  const [quickAdd, setQuickAdd] = useState({ isOpen: false, type: '' });
  const [cropData, setCropData] = useState({ isOpen: false, image: null, aspect: 3 / 4, onComplete: null });

  const initiateCrop = (file, aspect, onComplete) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropData({
        isOpen: true,
        image: reader.result,
        aspect,
        onComplete: (blob) => {
          const croppedFile = new File([blob], file.name, { type: 'image/jpeg' });
          onComplete(croppedFile);
          setCropData({ isOpen: false, image: null, aspect: 3 / 4, onComplete: null });
        }
      });
    };
    reader.readAsDataURL(file);
  };

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
          sizes: p.sizes || [], colors: p.colors || [], 
          variants: (p.variants || []).map(v => ({
             ...v,
             inventory: v.inventory || [],
             images: v.images || (v.image ? [v.image] : []),
             pendingFiles: []
          })),
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
          reviews: p.reviews || [],
          codAllowed: p.codAllowed !== false,
          returnWindowDays: p.returnWindowDays !== null && p.returnWindowDays !== undefined ? p.returnWindowDays : ''
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

      // ── Smart size preset based on category type ──────────────────────────
      // Priority: 1) DB availableSizes  2) Shoe preset  3) Clothing preset
      let currentSizes;
      if (catObj.availableSizes && catObj.availableSizes.length > 0) {
        currentSizes = [...catObj.availableSizes];
      } else if (isShoesCategory(form.category)) {
        currentSizes = [...DEFAULT_SHOE_SIZES];
      } else {
        currentSizes = [...DEFAULT_CLOTHING_SIZES];
      }

      currentFabrics = [...new Set(currentFabrics)].filter(Boolean).sort();
      currentStyles = [...new Set(currentStyles)].filter(Boolean).sort();

      // On edit/duplicate: preserve only the product's sizes that are VALID
      // for the current size set — don't inject alien sizes from other categories
      const isPersistent = isEdit || Boolean(duplicateId);
      if (isPersistent) {
        if (form.fabric && !currentFabrics.includes(form.fabric)) currentFabrics.push(form.fabric);
        if (form.style && !currentStyles.includes(form.style)) currentStyles.push(form.style);
        // Only keep saved sizes that belong to the current size set
        form.sizes.forEach(s => {
          if (currentSizes.includes(s) && !currentSizes.includes(s)) currentSizes.push(s);
        });
        // Remove selected sizes that are no longer valid for this category
        const validSelected = form.sizes.filter(s => currentSizes.includes(s));
        if (validSelected.length !== form.sizes.length) {
          setForm(f => ({ ...f, sizes: validSelected }));
        }
      }

      setAvailableFabrics(currentFabrics);
      setAvailableStyles(currentStyles);
      setAvailableSizes(currentSizes);
    }
  }, [form.category, form.subcategory, categories, isEdit, duplicateId, form.fabric, form.style]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;

    // Auto-clean price/stock fields
    const numericFields = ['price', 'originalPrice', 'priceUSD', 'originalPriceUSD', 'offerPriceIndia', 'offerPriceUSDUSA', 'stock'];
    if (numericFields.includes(name)) {
      const cleanValue = value.replace(/[^\d.]/g, '').split('.').slice(0, 2).join('.');
      setForm({ ...form, [name]: cleanValue });
      return;
    }

    // When category changes — clear dependent fields (fabric, style, subcategory, sizes)
    if (name === 'category') {
      setForm({ ...form, category: value, sizes: [], subcategory: '', fabric: '', style: '' });
      return;
    }

    // When subcategory changes — clear fabric & style since available options change
    if (name === 'subcategory') {
      setForm({ ...form, subcategory: value, fabric: '', style: '' });
      return;
    }

    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleQuickAddSubmit = async (val) => {
    if (!val || !val.trim()) return toast.error('Name cannot be empty');
    const name = val.trim();
    const type = quickAdd.type;
    
    setLoading(true);
    try {
      if (type === 'category') {
         const res = await API.post('/categories', { name, subcategories: [], defaultFabrics: [], defaultStyles: [] });
         setCategories(prev => [...prev, res.data.category]);
         setForm(f => ({ ...f, category: res.data.category.name, subcategory: '', fabric: '', style: '' }));
         toast.success('Category created');
      } else {
         const catObj = categories.find(c => (c.name || '').toLowerCase() === (form.category || '').toLowerCase());
         if (!catObj) throw new Error("Please select a category first.");
         
         const payload = new FormData();
         payload.append('name', catObj.name);
         payload.append('description', catObj.description || '');
         
         const currSubs = catObj.subcategories || [];
         const currFabrics = catObj.defaultFabrics || [];
         const currStyles = catObj.defaultStyles || [];
         
         if (type === 'subcategory') {
            currSubs.push({ name });
         } else if (type === 'fabric' || type === 'style') {
            if (form.subcategory) {
               const subIdx = currSubs.findIndex(s => {
                  const sName = typeof s === 'string' ? s : s.name;
                  return (sName || '').toLowerCase() === (form.subcategory || '').toLowerCase();
               });
               
               if (subIdx !== -1) {
                  if (typeof currSubs[subIdx] === 'string') {
                     currSubs[subIdx] = { name: currSubs[subIdx], fabrics: [], styles: [] };
                  }
                  if (type === 'fabric') {
                     currSubs[subIdx].fabrics = [...(currSubs[subIdx].fabrics || []), name];
                  } else {
                     currSubs[subIdx].styles = [...(currSubs[subIdx].styles || []), name];
                  }
               } else {
                  if (type === 'fabric') currFabrics.push(name);
                  if (type === 'style') currStyles.push(name);
               }
            } else {
               if (type === 'fabric') currFabrics.push(name);
               if (type === 'style') currStyles.push(name);
            }
         }
         
         payload.append('subcategories', JSON.stringify(currSubs));
         payload.append('defaultFabrics', JSON.stringify(currFabrics));
         payload.append('defaultStyles', JSON.stringify(currStyles));
         payload.append('availableSizes', JSON.stringify(catObj.availableSizes || []));
         
         const res = await API.put(`/categories/${catObj._id}`, payload);
         setCategories(prev => prev.map(c => c._id === catObj._id ? res.data.category : c));
         
         if (type === 'subcategory') setForm(f => ({ ...f, subcategory: name }));
         if (type === 'fabric') setForm(f => ({ ...f, fabric: name }));
         if (type === 'style') setForm(f => ({ ...f, style: name }));
         
         toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`);
      }
      setQuickAdd({ isOpen: false, type: '' });
    } catch(err) {
      toast.error(err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  const toggleSize = size => {
    setForm({ ...form, sizes: form.sizes.includes(size) ? form.sizes.filter(s => s !== size) : [...form.sizes, size] });
  };

  const handleSubmit = async (e, submitStatus = 'Publish') => {
    if (e) e.preventDefault();

    // Stock Validation
    if (form.stock === undefined || form.stock === '' || isNaN(form.stock) || parseInt(form.stock) < 0) {
      return toast.error("Please enter a valid total stock quantity.");
    }
    
    if (form.variants && form.variants.length > 0) {
      let totalVariantStock = 0;
      for (const v of form.variants) {
        if (!v.color || !v.color.trim()) {
          return toast.error("Please enter a color identity for all variants.");
        }
        
        let varStockSum = 0;
        if (form.sizes.length > 0 && v.inventory) {
           // Sum all size stocks for this variant
           for (const inv of v.inventory) {
              if (inv.stock === undefined || inv.stock === '' || isNaN(inv.stock) || parseInt(inv.stock) < 0) {
                 return toast.error(`Please enter valid stock for variant: ${v.color}, size: ${inv.size}`);
              }
              varStockSum += parseInt(inv.stock);
           }
        } else {
           if (v.stock === undefined || v.stock === '' || isNaN(v.stock) || parseInt(v.stock) < 0) {
              return toast.error(`Please enter a valid stock for variant: ${v.color || 'Unknown'}.`);
           }
           varStockSum = parseInt(v.stock);
        }
        
        totalVariantStock += varStockSum;
      }
      
      if (totalVariantStock !== parseInt(form.stock)) {
        return toast.error(`Total product stock (${form.stock}) must precisely match the sum of matrix variants (${totalVariantStock}).`);
      }
    }

    // India & USA Availability Validation (Sale Price only)
    if (form.availableInIndia) {
      if (form.price === undefined || form.price === '' || isNaN(form.price) || parseInt(form.price) <= 0) {
        return toast.error("Please enter a valid India Sale Price (₹) when marking product as available in India.");
      }
    }

    if (form.availableInUS) {
      if (form.priceUSD === undefined || form.priceUSD === '' || isNaN(form.priceUSD) || parseFloat(form.priceUSD) <= 0) {
        return toast.error("Please enter a valid USA Sale Price ($) when marking product as available in USA.");
      }
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'sizes' || k === 'colors' || k === 'variants') {
           if (k === 'variants') {
              const cleanVariants = v.map(varItem => ({ 
                color: varItem.color, 
                stock: varItem.stock || 0,
                inventory: varItem.inventory || [],
                images: varItem.images || [] 
              }));
              data.append(k, JSON.stringify(cleanVariants));
              
              v.forEach((varItem, i) => {
                 if (varItem.pendingFiles && varItem.pendingFiles.length > 0) {
                    varItem.pendingFiles.forEach((file, fileIdx) => {
                       data.append(`variantImage_${i}_${fileIdx}`, file);
                    });
                 }
              });
           } else {
              data.append(k, JSON.stringify(v));
           }
        }
        else if ((k === 'offerEndTimeIndia' || k === 'offerEndTimeUSA') && v) {
          data.append(k, new Date(v).toISOString());
        }
        else if (k === 'returnWindowDays') {
          if (v !== '' && v !== null && v !== undefined) {
            data.append(k, parseInt(v));
          } else {
             data.append(k, ''); // Or omit sending so it stays null
          }
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">
                       <span>Category *</span>
                       <button type="button" onClick={() => setQuickAdd({ isOpen: true, type: 'category' })} className="text-gold-600 hover:text-gold-700 font-bold capitalize tracking-normal flex items-center gap-1"><Plus size={10}/> Add New</button>
                    </label>
                    <select name="category" value={form.category} onChange={handleChange} className="input-field shadow-sm" required>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">
                       <span>Subcategory</span>
                       {form.category && <button type="button" onClick={() => setQuickAdd({ isOpen: true, type: 'subcategory' })} className="text-gold-600 hover:text-gold-700 font-bold capitalize tracking-normal flex items-center gap-1"><Plus size={10}/> Add New</button>}
                    </label>
                     <select name="subcategory" value={form.subcategory} onChange={handleChange} className="input-field shadow-sm">
                        <option value="">— No Subcategory —</option>
                         {matchingSubcats.map(s => {
                           const name = typeof s === 'string' ? s : s?.name || '';
                           return <option key={name} value={name}>{name}</option>;
                         })}
                     </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">
                       <span>Fabric / Material *</span>
                       {form.category && <button type="button" onClick={() => setQuickAdd({ isOpen: true, type: 'fabric' })} className="text-gold-600 hover:text-gold-700 font-bold capitalize tracking-normal flex items-center gap-1"><Plus size={10}/> Add New</button>}
                    </label>
                    <select name="fabric" value={form.fabric} onChange={handleChange} className="input-field">
                      <option value="">Select Fabric</option>
                      {availableFabrics.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">
                       <span>Style</span>
                       {form.category && <button type="button" onClick={() => setQuickAdd({ isOpen: true, type: 'style' })} className="text-gold-600 hover:text-gold-700 font-bold capitalize tracking-normal flex items-center gap-1"><Plus size={10}/> Add New</button>}
                    </label>
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
                  <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 relative group/variant overflow-hidden">
                    <button type="button" onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }))} className="absolute top-4 right-4 bg-red-50/50 hover:bg-red-500 text-red-500 hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-all opacity-0 group-hover/variant:opacity-100">&times;</button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                       <div className="space-y-4">
                          <div>
                             <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">Color Identity</label>
                             <input value={v.color} onChange={e => setForm(f => ({ ...f, variants: f.variants.map((varItem, idx) => idx === i ? { ...varItem, color: e.target.value } : varItem) }))} placeholder="e.g. Midnight Black" className="input-field bg-white shadow-sm" />
                          </div>

                          {/* Matrix Inventory: Map over selected global sizes */}
                          {form.sizes.length > 0 ? (
                            <div>
                               <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">Size Inventory</label>
                               <div className="space-y-2">
                                  {form.sizes.map(size => {
                                      const existingInv = (v.inventory || []).find(inv => inv.size === size);
                                      const stockVal = existingInv ? existingInv.stock : '';
                                      return (
                                        <div key={size} className="flex items-center gap-3 bg-white p-2 rounded shadow-sm border border-gray-100">
                                            <span className="w-16 text-xs font-bold text-gray-600">{size}</span>
                                            <input 
                                                type="number" min="0" placeholder="0" value={stockVal}
                                                className="input-field py-1 text-sm bg-gray-50 flex-1 border-none"
                                                onChange={e => {
                                                    const newStock = e.target.value === '' ? '' : parseInt(e.target.value);
                                                    setForm(f => ({
                                                        ...f, 
                                                        variants: f.variants.map((varItem, idx) => {
                                                            if (idx !== i) return varItem;
                                                            let invArray = varItem.inventory ? [...varItem.inventory] : [];
                                                            const itemIdx = invArray.findIndex(inv => inv.size === size);
                                                            if (itemIdx >= 0) invArray[itemIdx].stock = newStock;
                                                            else invArray.push({ size, stock: newStock });
                                                            return { ...varItem, inventory: invArray };
                                                        })
                                                    }));
                                                }}
                                            />
                                        </div>
                                      );
                                  })}
                               </div>
                            </div>
                          ) : (
                             <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">Fallback Stock (No Sizes)</label>
                                <input 
                                   type="number" min="0"
                                   value={v.stock === undefined ? '' : v.stock} 
                                   onChange={e => {
                                      const clean = e.target.value.replace(/[^\d]/g, '');
                                      setForm(f => ({ ...f, variants: f.variants.map((varItem, idx) => idx === i ? { ...varItem, stock: clean === '' ? '' : parseInt(clean) } : varItem) }));
                                   }} 
                                   placeholder="0" 
                                   className="input-field bg-white shadow-sm" 
                                 />
                             </div>
                          )}
                       </div>
                       
                       <div className="space-y-4">
                          <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-bold">Variant Lookbook</label>
                          <div className="flex flex-wrap gap-2 mt-3">
                             {/* Existing Images */}
                             {(v.images || (v.image ? [v.image] : [])).map((imgUrl, imgIdx) => (
                                <div key={`ex-${imgIdx}`} className="relative group">
                                   <img src={getFullUrl(imgUrl)} className="w-16 h-20 object-cover rounded-lg border border-gray-100" alt="" />
                                   <button type="button" onClick={() => {
                                      const newImages = (v.images || [v.image]).filter((_, idx) => idx !== imgIdx);
                                      setForm(f => ({ ...f, variants: f.variants.map((varItem, idx) => idx === i ? { ...varItem, images: newImages, image: newImages[0] || '' } : varItem) }));
                                   }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                </div>
                             ))}
                             {/* Pending Multiple Files */}
                             {(v.pendingFiles || []).map((file, fileIdx) => (
                                <div key={`pnd-${fileIdx}`} className="relative group">
                                   <img src={URL.createObjectURL(file)} className="w-16 h-20 object-cover rounded-lg border border-teal-200" alt="" />
                                   <button type="button" onClick={() => {
                                      const newFiles = v.pendingFiles.filter((_, idx) => idx !== fileIdx);
                                      setForm(f => ({ ...f, variants: f.variants.map((varItem, idx) => idx === i ? { ...varItem, pendingFiles: newFiles } : varItem) }));
                                   }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                </div>
                             ))}
                             
                             <label className="w-16 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gold-400 transition-colors bg-white">
                                <Plus size={16} className="text-gray-300" />
                                <span className="text-[7px] font-bold uppercase tracking-tighter text-gray-400 mt-1">Add Photo</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                                   const files = Array.from(e.target.files);
                                   if (files.length === 0) return;
                                   let ci = 0;
                                   const proc = () => {
                                      if (ci < files.length) {
                                         initiateCrop(files[ci], 3/4, (cropped) => {
                                            setForm(f => ({ ...f, variants: f.variants.map((vItem, idx) => idx === i ? { ...vItem, pendingFiles: [...(vItem.pendingFiles || []), cropped] } : vItem) }));
                                            ci++;
                                            proc();
                                         });
                                      }
                                   };
                                   proc();
                                }} />
                             </label>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, variants: [...f.variants, { color: '', stock: 0, images: [], pendingFiles: [] }] }))} className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:border-gold-400 hover:text-gold-500 transition-all bg-gray-50/50">
                <Plus size={16} /> Add New Color Lookbook
              </button>
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
                    <input name="price" type="text" value={form.price} onChange={e => handleChange({ target: { name: 'price', value: e.target.value.replace(/[^\d]/g, '') } })} className="input-field" placeholder="Sale Price (₹)" required />
                    <input name="originalPrice" type="text" value={form.originalPrice} onChange={e => handleChange({ target: { name: 'originalPrice', value: e.target.value.replace(/[^\d]/g, '') } })} className="input-field" placeholder="Original Price (₹)" />
                    <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="availableInIndia" checked={form.availableInIndia} onChange={handleChange} className="accent-green-600" /><span className="text-xs font-sans">Available in India</span></label>
                  </>
                ) : (
                  <>
                    <input name="priceUSD" type="text" value={form.priceUSD} onChange={e => handleChange({ target: { name: 'priceUSD', value: e.target.value.replace(/[^\d.]/g, '') } })} className="input-field" placeholder="Sale Price ($)" />
                    <input name="originalPriceUSD" type="text" value={form.originalPriceUSD} onChange={e => handleChange({ target: { name: 'originalPriceUSD', value: e.target.value.replace(/[^\d.]/g, '') } })} className="input-field" placeholder="Original Price ($)" />
                    <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" name="availableInUS" checked={form.availableInUS} onChange={handleChange} className="accent-blue-600" /><span className="text-xs font-sans">Available in USA</span></label>
                  </>
                )}
                <input name="stock" type="text" value={form.stock} onChange={e => handleChange({ target: { name: 'stock', value: e.target.value.replace(/[^\d]/g, '') } })} className="input-field" placeholder="Stock Quantity" required />
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

            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Advanced Settings</h3>
              
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer mb-2">
                  <input type="checkbox" name="codAllowed" checked={form.codAllowed} onChange={handleChange} className="accent-teal-600" />
                  <span className="text-sm font-sans text-gray-700">Cash on Delivery Available</span>
                </label>
                <p className="text-[10px] text-gray-500 ml-6">Uncheck this to disable COD for this specific product.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Return Window (Days)</label>
                <input 
                  name="returnWindowDays" 
                  type="number" 
                  min="0"
                  value={form.returnWindowDays !== undefined && form.returnWindowDays !== null ? form.returnWindowDays : ''} 
                  onChange={handleChange} 
                  className="input-field" 
                  placeholder="e.g. 7 (Leave empty for Global Setting)" 
                />
                <p className="text-[10px] text-gray-500 mt-1">If blank, it uses the global return window from settings.</p>
              </div>
            </div>

            {/* Flash Offers */}
            <div className="card p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
               <h3 className="font-serif text-lg text-charcoal mb-4">Flash Sale Offers</h3>
               <div className="space-y-4">
                  <div className="bg-white p-4 rounded border border-amber-100">
                     <p className="text-sm font-bold mb-3">🇮🇳 India Offer</p>
                     <label className="flex items-center gap-2 mb-3 cursor-pointer"><input type="checkbox" name="offerActiveIndia" checked={form.offerActiveIndia} onChange={handleChange} className="w-4 h-4 accent-amber-500" /><span className="text-sm font-medium">Active</span></label>
                     {form.offerActiveIndia && (
                        <div className="space-y-2">
                           <input type="datetime-local" name="offerEndTimeIndia" value={form.offerEndTimeIndia || ''} onChange={handleChange} className="text-sm w-full border rounded px-3 py-2 focus:outline-none focus:border-amber-400" />
                           <input type="text" name="offerPriceIndia" value={form.offerPriceIndia || ''} onChange={e => handleChange({ target: { name: 'offerPriceIndia', value: e.target.value.replace(/[^\d]/g, '') } })} placeholder="Offer Price (₹)" className="text-sm w-full border rounded px-3 py-2 focus:outline-none focus:border-amber-400" />
                        </div>
                     )}
                  </div>
                  <div className="bg-white p-4 rounded border border-blue-100">
                     <p className="text-sm font-bold mb-3">🇺🇸 USA Offer</p>
                     <label className="flex items-center gap-2 mb-3 cursor-pointer"><input type="checkbox" name="offerActiveUSA" checked={form.offerActiveUSA} onChange={handleChange} className="w-4 h-4 accent-blue-500" /><span className="text-sm font-medium">Active</span></label>
                     {form.offerActiveUSA && (
                        <div className="space-y-2">
                           <input type="datetime-local" name="offerEndTimeUSA" value={form.offerEndTimeUSA || ''} onChange={handleChange} className="text-sm w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-400" />
                           <input type="text" name="offerPriceUSDUSA" value={form.offerPriceUSDUSA || ''} onChange={e => handleChange({ target: { name: 'offerPriceUSDUSA', value: e.target.value.replace(/[^\d.]/g, '') } })} placeholder="Offer Price ($)" className="text-sm w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-400" />
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => setIsPreview(true)} className="w-full h-12 bg-white border border-gray-200 text-charcoal rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                <Eye size={14} /> Preview
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={(e) => handleSubmit(e, 'Draft')} disabled={loading} className={`flex-1 h-12 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-all ${loading ? 'opacity-50' : ''}`}>
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
                <button type="button" onClick={(e) => handleSubmit(e, 'Publish')} disabled={loading} className={`flex-1 h-12 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gold-600 transition-all shadow-lg hover:shadow-gold-500/20 ${loading ? 'opacity-50' : ''}`}>
                  {loading ? 'Processing...' : (isEdit ? 'Update Live' : 'Publish Now')}
                </button>
              </div>
              <button type="button" onClick={() => navigate('/products')} className="w-full h-12 bg-red-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-sm">Discard & Exit</button>
            </div>
          </div>
        </div>
      </form>

      {isPreview && (
        <ProductPreview 
          product={{ ...form, existingImages }} 
          images={images} 
          onClose={() => setIsPreview(false)} 
        />
      )}


      {cropData.isOpen && (
        <CropModal 
          image={cropData.image} 
          aspect={cropData.aspect}
          onCropComplete={cropData.onComplete}
          onCancel={() => setCropData({ isOpen: false, image: null, aspect: 3/4, onComplete: null })}
        />
      )}

      {quickAdd.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-serif text-lg text-charcoal">Add New {quickAdd.type.charAt(0).toUpperCase() + quickAdd.type.slice(1)}</h3>
              <button type="button" onClick={() => setQuickAdd({ isOpen: false, type: '' })} className="text-gray-400 hover:text-red-500 transition-colors p-1"><X size={18}/></button>
            </div>
            <div className="p-6">
               <input autoFocus type="text" id="quickAddInput" placeholder={`Enter ${quickAdd.type} name...`} className="w-full border-2 border-gray-200 focus:border-gold-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors mb-4" onKeyDown={e => {
                  if (e.key === 'Enter') {
                     e.preventDefault();
                     handleQuickAddSubmit(document.getElementById('quickAddInput').value);
                  }
               }}/>
               <div className="flex gap-3">
                  <button type="button" onClick={() => handleQuickAddSubmit(document.getElementById('quickAddInput').value)} className="w-full bg-black text-white rounded-xl py-3.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-gold-600 transition-all shadow-lg hover:shadow-gold-500/20">
                     Create & Select
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

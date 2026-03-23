import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import API, { BACKEND_URL } from '../api';
import { toast } from 'react-toastify';

const CATEGORIES = ['Women', 'Kurti', 'Kurti with Dupatta', 'Anarkali', 'Maxi', 'Co-Ord Sets', 'Sarees', 'Dress Materials'];
const LABELS = ['', 'Hot', 'New Arrival', 'Trending', 'Sold Out'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];
const FABRICS = [
  'Chanderi', 'Chettinadu Cotton', 'Jaipur Cotton', 'Pure Handloom Cotton',
  'Mul Chanderi', 'Raw Silk', 'Mangalagiri Cotton', 'Chennuri Silk',
  'Vichitra Silk', 'Silk Cotton', 'Ikkat', 'Rayon', 'Georgette', 'Crepe'
];
const STYLES = ['Kurti', 'A-Line', 'Anarkali', 'Maxi', '2-Piece Set', '3-Piece Set', 'Co-Ord Set', 'Straight Cut'];
const AVAILABILITY = ['Available', 'Limited Stock', 'Made to Order', 'Pre-Order'];

const initialForm = {
  name: '', description: '', category: 'Women', subcategory: '', price: '',
  originalPrice: '', stock: '', fabric: '', style: '', label: '', bestseller: false,
  availability: 'Available', sizes: [], colors: []
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

  useEffect(() => {
    const loadId = id || duplicateId;
    if (loadId) {
      API.get(`/products/${loadId}`).then(r => {
        const p = r.data.product;
        setForm({
          name: duplicateId ? `${p.name} (Copy)` : p.name, 
          description: p.description, category: p.category,
          subcategory: p.subcategory || '', price: p.price, originalPrice: p.originalPrice || '',
          stock: p.stock, fabric: p.fabric || p.material || '', style: p.style || '',
          label: p.label || '', bestseller: p.bestseller || false,
          availability: p.availability || 'Available',
          sizes: p.sizes || [], colors: p.colors || []
        });
        setStatus(p.status || 'Publish');
        // Do not prefill images for duplicates (user must upload new) to avoid form-multipart mismatch, 
        // OR let it append text only. Let's prefill existingImages just for visual, but handleSubmit must know what to upload.
        if (!duplicateId) {
           setExistingImages(p.images || []);
        }
      }).finally(() => setFetchLoading(false));
    }
  }, [id, duplicateId]);

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
        if (k === 'sizes' || k === 'colors') data.append(k, JSON.stringify(v));
        else data.append(k, v);
      });
      data.append('status', submitStatus);
      images.forEach(img => data.append('images', img));

      // Send existing images that weren't removed (for edit mode)
      if (isEdit) {
        data.append('existingImages', JSON.stringify(existingImages));
      }

      if (isEdit) {
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
            {/* Basic Info */}
            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Product Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} className="input-field" required placeholder="e.g. Chanderi Silk Anarkali Kurti" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Description *</label>
                  <textarea name="description" value={form.description} onChange={handleChange} className="input-field min-h-[100px] resize-none" required placeholder="Describe the product details, fabric quality, care instructions..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Category *</label>
                    <select name="category" value={form.category} onChange={handleChange} className="input-field">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Subcategory</label>
                    <input name="subcategory" value={form.subcategory} onChange={handleChange} className="input-field" placeholder="e.g. Festive Collection" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Fabric / Material *</label>
                    <select name="fabric" value={form.fabric} onChange={handleChange} className="input-field">
                      <option value="">Select Fabric</option>
                      {FABRICS.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Style</label>
                    <select name="style" value={form.style} onChange={handleChange} className="input-field">
                      <option value="">Select Style</option>
                      {STYLES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Sizes</h3>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(size => (
                  <button type="button" key={size} onClick={() => toggleSize(size)}
                    className={`w-14 h-10 text-xs font-sans border-2 transition-all ${form.sizes.includes(size) ? 'border-gold-600 bg-gold-600 text-white' : 'border-gray-200 hover:border-gray-400'}`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Colors</h3>
              <div className="flex gap-3 mb-3">
                <input value={colorInput} onChange={e => setColorInput(e.target.value)}
                  className="input-field flex-1" placeholder="e.g. Imperial Gold, Midnight, Ivory" />
                <button type="button" onClick={addColor} className="btn-outline">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.colors.map(c => (
                  <span key={c} className="flex items-center gap-2 text-xs font-sans bg-gray-100 px-3 py-1.5 rounded-full">
                    {c}
                    <button type="button" onClick={() => removeColor(c)} className="text-gray-400 hover:text-red-500 transition-colors">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Product Images</h3>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-3">Current Images</p>
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img.startsWith('http') ? img : `${BACKEND_URL}${img}`} alt=""
                          className="w-20 h-24 object-cover bg-gray-100 rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {images.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-3">New Images to Upload</p>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={URL.createObjectURL(img)} alt="" className="w-20 h-24 object-cover bg-gray-100 rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <label 
                className="block border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-gold-400 hover:bg-gold-50/30 transition-all"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (e.dataTransfer.files) {
                    setImages([...images, ...Array.from(e.dataTransfer.files)]);
                  }
                }}
              >
                <input type="file" accept="image/*" multiple onChange={e => setImages([...images, ...Array.from(e.target.files)])} className="hidden" />
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-sans text-gray-500">Click or Drag & Drop to upload images</p>
                  <p className="text-xs font-sans text-gray-400">PNG, JPG, WEBP up to 10MB each</p>
                </div>
              </label>
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Pricing & Stock</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Sale Price (₹) *</label>
                  <input name="price" type="number" min="0" step="1" value={form.price} onChange={handleChange} className="input-field" required placeholder="e.g. 1499" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Original Price (₹)</label>
                  <input name="originalPrice" type="number" min="0" step="1" value={form.originalPrice} onChange={handleChange} className="input-field" placeholder="e.g. 1999 (leave empty if no discount)" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Stock Quantity *</label>
                  <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} className="input-field" required placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Availability</label>
                  <select name="availability" value={form.availability} onChange={handleChange} className="input-field">
                    {AVAILABILITY.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Status & Labels</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Product Label</label>
                  <select name="label" value={form.label} onChange={handleChange} className="input-field">
                    {LABELS.map(l => <option key={l} value={l}>{l || '— None —'}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="bestseller" checked={form.bestseller} onChange={handleChange} className="accent-gold-600 w-4 h-4" />
                  <span className="text-sm font-sans text-charcoal">Mark as Bestseller</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => setIsPreview(true)} className="btn-outline w-full justify-center">
                Preview Product
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={(e) => handleSubmit(e, 'Draft')} disabled={loading} className="btn-outline flex-1 justify-center disabled:opacity-60 text-[10px] tracking-widest uppercase font-sans py-2.5">
                  Save Draft
                </button>
                <button type="button" onClick={(e) => handleSubmit(e, 'Publish')} disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-60 text-[10px] tracking-widest uppercase font-sans py-2.5">
                  {isEdit ? 'Update' : 'Publish'}
                </button>
                <button type="button" onClick={() => navigate('/products')} className="btn-outline px-3 flex items-center justify-center">
                   <span className="text-gray-400">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Product Preview Modal */}
      {isPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
               <button onClick={() => setIsPreview(false)} className="absolute top-4 right-4 text-xl text-gray-400 hover:text-charcoal">×</button>
               <h3 className="font-serif text-charcoal text-lg mb-4 border-b pb-2">Product Preview</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden">
                     {images.length > 0 ? (
                        <img src={URL.createObjectURL(images[0])} alt="" className="w-full h-full object-cover" />
                     ) : existingImages.length > 0 ? (
                        <img src={existingImages[0].startsWith('http') ? existingImages[0] : `${BACKEND_URL}${existingImages[0]}`} alt="" className="w-full h-full object-cover" />
                     ) : <div className="text-gray-400 text-xs">No image provided</div>}
                  </div>
                  <div className="space-y-2">
                     <span className="text-[10px] tracking-wider text-gray-400 uppercase">{form.category} • {form.subcategory || 'Standard'}</span>
                     <h2 className="font-serif text-xl font-bold text-charcoal">{form.name || 'Unnamed Product'}</h2>
                     <p className="font-sans text-sm text-gray-500 min-h-[50px]">{form.description || 'No description provided'}</p>
                     <div className="py-2">
                        <span className="font-sans text-lg font-semibold text-charcoal mr-2">₹{form.price || 0}</span>
                        {form.originalPrice && <span className="font-sans text-xs text-gray-400 line-through">₹{form.originalPrice}</span>}
                     </div>
                     <div>
                         <span className="text-[10px] text-gray-500 block mb-1">Stock: {form.stock || 0}</span>
                         <span className="text-[10px] text-gray-500 block">Status: {status}</span>
                     </div>
                  </div>
               </div>
           </div>
        </div>
      )}
    </Layout>
  );
}

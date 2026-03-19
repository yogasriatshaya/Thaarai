import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import API, { BACKEND_URL } from '../api';
import { toast } from 'react-toastify';

const CATEGORIES = ['Couture', 'Handbags', 'Silk Scarves', 'Heritage', 'Accessories', 'Limited Edition'];
const LABELS = ['', 'BESTSELLER', 'LIMITED EDITION', 'NEW', 'FINAL PIECES'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

const initialForm = {
  name: '', description: '', category: 'Couture', subcategory: '', price: '',
  stock: '', material: '', heritage: '', label: '', bestseller: false,
  sizes: [], colors: []
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      API.get(`/products/${id}`).then(r => {
        const p = r.data.product;
        setForm({
          name: p.name, description: p.description, category: p.category,
          subcategory: p.subcategory || '', price: p.price, stock: p.stock,
          material: p.material || '', heritage: p.heritage || '',
          label: p.label || '', bestseller: p.bestseller || false,
          sizes: p.sizes || [], colors: p.colors || []
        });
        setExistingImages(p.images || []);
      }).finally(() => setFetchLoading(false));
    }
  }, [id]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'sizes' || k === 'colors') data.append(k, JSON.stringify(v));
        else data.append(k, v);
      });
      images.forEach(img => data.append('images', img));

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
                  <input name="name" value={form.name} onChange={handleChange} className="input-field" required placeholder="e.g. Royal Silk Trench" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Description / The Story *</label>
                  <textarea name="description" value={form.description} onChange={handleChange} className="input-field min-h-[100px] resize-none" required placeholder="Describe the artisanal story behind this piece..." />
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
                    <input name="subcategory" value={form.subcategory} onChange={handleChange} className="input-field" placeholder="e.g. Heritage Gold Collection" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Material</label>
                    <input name="material" value={form.material} onChange={handleChange} className="input-field" placeholder="e.g. 100% Mulberry Silk" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Heritage Label</label>
                    <input name="heritage" value={form.heritage} onChange={handleChange} className="input-field" placeholder="e.g. Heritage Gold Collection" />
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
              {existingImages.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {existingImages.map((img, i) => (
                    <img key={i} src={img.startsWith('http') ? img : `${BACKEND_URL}${img}`} alt=""
                      className="w-20 h-24 object-cover bg-gray-100" />
                  ))}
                  <p className="text-xs text-gray-400 font-sans self-end mb-1">Existing images. Upload new to replace.</p>
                </div>
              )}
              <label className="block border-2 border-dashed border-gray-200 rounded-sm p-8 text-center cursor-pointer hover:border-gold-400 transition-colors">
                <input type="file" accept="image/*" multiple onChange={e => setImages(Array.from(e.target.files))} className="hidden" />
                <p className="text-sm font-sans text-gray-400 mb-1">Click to upload images</p>
                <p className="text-xs font-sans text-gray-300">PNG, JPG, WEBP up to 10MB each</p>
              </label>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {images.map((img, i) => (
                    <img key={i} src={URL.createObjectURL(img)} alt="" className="w-20 h-24 object-cover bg-gray-100" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-serif text-lg text-charcoal mb-5">Pricing & Stock</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Price (USD) *</label>
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} className="input-field" required placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-1.5">Stock Quantity *</label>
                  <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} className="input-field" required placeholder="0" />
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

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-60">
                {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" onClick={() => navigate('/products')} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      </form>
    </Layout>
  );
}

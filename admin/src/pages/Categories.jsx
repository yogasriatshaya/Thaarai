import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, X, Check, Pencil } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [confirmSubModal, setConfirmSubModal] = useState({ open: false, subName: '' });
  const [renameSubModal, setRenameSubModal] = useState({ open: false, oldName: '', newName: '', cat: null });
  const [subProductCount, setSubProductCount] = useState({});
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    subcategories: [], // Array of { name, fabrics: [], styles: [] }
    availableSizes: [],
    defaultFabrics: [],
    defaultStyles: []
  });

  const [subInput, setSubInput] = useState('');
  
  // RAW STRING STATES for comfortable typing
  const [sizesText, setSizesText] = useState('');
  const [fabricsText, setFabricsText] = useState('');
  const [stylesText, setStylesText] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await API.get('/categories');
      if (res.data.success) setCategories(res.data.categories);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategoryProductCount = async (categoryName) => {
    try {
      const res = await API.get(`/products/count-by-subcategory?category=${categoryName}`);
      if (res.data.success) {
        setSubProductCount(res.data.counts || {});
      }
    } catch (err) {
      console.log('Could not fetch product counts');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat = null) => {
    if (cat) {
        setEditingCat(cat);
        const normalizedSubs = (cat.subcategories || []).map(s => 
          typeof s === 'string' 
            ? { name: s, fabrics: [], styles: [] } 
            : { ...s, fabrics: s.fabrics || [], styles: s.styles || [] }
        );
        
        setForm({
          name: cat.name,
          description: cat.description || '',
          subcategories: normalizedSubs,
          defaultFabrics: cat.defaultFabrics || [],
          defaultStyles: cat.defaultStyles || [],
          availableSizes: cat.availableSizes || []
        });

        // Set raw texts for the textareas
        setSizesText((cat.availableSizes || []).join(', '));
        setFabricsText((cat.defaultFabrics || []).join(', '));
        setStylesText((cat.defaultStyles || []).join(', '));

        fetchSubcategoryProductCount(cat.name);
    } else {
        setEditingCat(null);
        setForm({
          name: '',
          description: '',
          subcategories: [],
          defaultFabrics: [],
          defaultStyles: [],
          availableSizes: []
        });
        setSizesText('');
        setFabricsText('');
        setStylesText('');
        setSubProductCount({});
    }
    setModalOpen(true);
  };

  const handleAddSub = () => {
    const trimmed = subInput.trim();
    if (trimmed && !form.subcategories.some(s => s.name === trimmed)) {
      setForm({ 
        ...form, 
        subcategories: [...form.subcategories, { name: trimmed, fabrics: [], styles: [] }] 
      });
      setSubInput('');
    }
  };

  const handleRemoveSub = (subName) => {
    const count = subProductCount[subName] || 0;
    if (count > 0) {
      toast.error(`Cannot delete "${subName}" - it has ${count} product(s). Delete those products first.`);
      return;
    }
    setConfirmSubModal({ open: true, subName });
  };

  const executeRemoveSub = () => {
    const { subName } = confirmSubModal;
    setForm({ ...form, subcategories: form.subcategories.filter(s => s.name !== subName) });
    setConfirmSubModal({ open: false, subName: '' });
  };

  const updateSubOptions = (idx, field, value) => {
    const newSubs = [...form.subcategories];
    // To allow commas whilst typing in the inline subcategory fields, we'll store as array only on change
    // but the issue mentioned is also here.
    // Let's use a simpler approach: allow empty strings during split to preserve commas
    newSubs[idx][field] = value.split(',').map(s => s.trim());
    setForm({ ...form, subcategories: newSubs });
  };

  const handleRenameSub = (oldName) => {
    setRenameSubModal({ open: true, oldName, newName: oldName, cat: editingCat });
  };

  const confirmRenameSub = async () => {
    const { oldName, newName, cat } = renameSubModal;
    if (!newName || newName === oldName) return setRenameSubModal({ ...renameSubModal, open: false });

    if (!cat) {
      setForm({ 
        ...form, 
        subcategories: form.subcategories.map(s => s.name === oldName ? { ...s, name: newName.trim() } : s) 
      });
      setRenameSubModal({ ...renameSubModal, open: false });
    } else {
      try {
        const res = await API.put(`/categories/${cat._id}/rename-subcategory`, { oldName, newName: newName.trim() });
        if (res.data.success) {
          toast.success(res.data.message);
          setForm({ 
            ...form, 
            subcategories: form.subcategories.map(s => s.name === oldName ? { ...s, name: newName.trim() } : s) 
          });
          setRenameSubModal({ ...renameSubModal, open: false });
          fetchCategories();
        }
      } catch (err) {
        toast.error('Failed to rename subcategory');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.warning('Category name is required');

    // CONVERT STRINGS BACK TO ARRAYS ON SUBMIT
    const normalizedForm = {
      ...form,
      name: form.name.trim(),
      availableSizes: sizesText.split(',').map(s => s.trim()).filter(Boolean),
      defaultFabrics: fabricsText.split(',').map(s => s.trim()).filter(Boolean),
      defaultStyles: stylesText.split(',').map(s => s.trim()).filter(Boolean),
      subcategories: form.subcategories.map(s => ({
        ...s,
        name: s.name.trim(),
        fabrics: s.fabrics.map(f => f.trim()).filter(Boolean),
        styles: s.styles.map(st => st.trim()).filter(Boolean)
      }))
    };

    try {
      if (editingCat) {
        await API.put(`/categories/${editingCat._id}`, normalizedForm);
        toast.success(`Category "${normalizedForm.name}" updated.`);
      } else {
        await API.post('/categories', normalizedForm);
        toast.success(`Category "${normalizedForm.name}" created.`);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const setSizesPreset = (sizes) => {
    setSizesText(sizes.join(', '));
  };

  return (
    <Layout title="Categories & Subcategories">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-sm text-gray-400 font-sans uppercase tracking-[0.2em]">Store Catalog</h2>
          <p className="text-xs text-gray-500 mt-1 italic">Note: Changing a category name updates products automatically.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-lg border" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <div key={cat._id} className="card p-5 group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-charcoal">{cat.name}</h3>
                    {cat.description && <p className="text-[11px] text-gray-400 line-clamp-1">{cat.description}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(cat)} className="p-2 text-gray-400 hover:text-gold-600 rounded-full"><Edit2 size={14}/></button>
                    <button onClick={() => API.delete(`/categories/${cat._id}`).then(() => fetchCategories())} className="p-2 text-gray-400 hover:text-red-500 rounded-full"><Trash2 size={14}/></button>
                  </div>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] uppercase tracking-widest text-gray-300 font-bold">Sub-categories</p>
                   <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories?.map(sub => (
                        <span key={typeof sub === 'string' ? sub : sub.name} className="px-2 py-0.5 bg-gray-50 text-[10px] text-gray-500 rounded border">
                           {typeof sub === 'string' ? sub : sub.name}
                        </span>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-lg w-full p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-xl font-bold text-charcoal">{editingCat ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-300 hover:text-charcoal"><X/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-2">Category Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required />
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field min-h-[80px]" />
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-2">Sub-categories</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={subInput} onChange={e => setSubInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSub())} className="input-field flex-1" placeholder="e.g. Shirts" />
                  <button type="button" onClick={handleAddSub} className="p-2 bg-charcoal text-white rounded"><Plus /></button>
                </div>
                <div className="space-y-4 p-4 bg-gray-50 rounded border">
                  {form.subcategories.map((sub, idx) => (
                    <div key={idx} className="bg-white p-3 border rounded shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold">{sub.name}</span>
                        <div className="flex gap-2">
                           <button type="button" onClick={() => handleRenameSub(sub.name)} className="text-gray-400 hover:text-gold-600"><Pencil size={12}/></button>
                           <button type="button" onClick={() => handleRemoveSub(sub.name)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] uppercase tracking-widest text-gray-400 mb-1">Fabrics (comma sep.)</label>
                          <input 
                            value={sub.fabrics.join(', ')} 
                            onChange={(e) => updateSubOptions(idx, 'fabrics', e.target.value)}
                            className="w-full text-[10px] border px-2 py-1 rounded" 
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase tracking-widest text-gray-400 mb-1">Styles (comma sep.)</label>
                          <input 
                            value={sub.styles.join(', ')} 
                            onChange={(e) => updateSubOptions(idx, 'styles', e.target.value)}
                            className="w-full text-[10px] border px-2 py-1 rounded" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {form.subcategories.length === 0 && <p className="text-[10px] text-gray-300 italic">No sub-categories added</p>}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500">Available Sizes</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSizesPreset(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'])} className="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded hover:bg-gold-100 uppercase font-bold">Alpha</button>
                    <button type="button" onClick={() => setSizesPreset(['32', '34', '36', '38', '40', '42', '44', '46'])} className="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded hover:bg-gold-100 uppercase font-bold">Numeric</button>
                    <button type="button" onClick={() => setSizesPreset(['28', '30', '32', '34', '36', '38'])} className="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded hover:bg-gold-100 uppercase font-bold">Pants</button>
                    <button type="button" onClick={() => setSizesPreset(['Free Size'])} className="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded hover:bg-gold-100 uppercase font-bold">One Size</button>
                  </div>
                </div>
                <textarea 
                  value={sizesText} 
                  onChange={(e) => setSizesText(e.target.value)}
                  className="w-full text-[10px] border p-2 min-h-[50px] rounded focus:border-gold-400 outline-none font-sans"
                  placeholder="XS, S, M, L..."
                />
              </div>

              <div className="pt-4 border-t">
                <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-3">Global Category Options (comma sep.)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] uppercase tracking-widest text-gray-400 mb-1">Default Fabrics</label>
                    <textarea 
                      value={fabricsText} 
                      onChange={(e) => setFabricsText(e.target.value)}
                      className="w-full text-[10px] border p-2 min-h-[60px] rounded"
                      placeholder="Cotton, Silk..."
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase tracking-widest text-gray-400 mb-1">Default Styles</label>
                    <textarea 
                      value={stylesText} 
                      onChange={(e) => setStylesText(e.target.value)}
                      className="w-full text-[10px] border p-2 min-h-[60px] rounded"
                      placeholder="Kurti, Maxi..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 btn-primary justify-center py-3">
                  <Check size={18} /> {editingCat ? 'Save Changes' : 'Create Category'}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-outline justify-center px-8 py-3">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renameSubModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded p-8 max-w-sm w-full shadow-2xl">
             <h3 className="font-serif text-lg font-bold text-charcoal mb-4">Rename Sub-category</h3>
             <input type="text" autoFocus value={renameSubModal.newName} onChange={e => setRenameSubModal({...renameSubModal, newName: e.target.value})} className="input-field mb-4" />
             <div className="flex gap-2">
                <button onClick={confirmRenameSub} className="flex-1 btn-primary py-3">Confirm</button>
                <button onClick={() => setRenameSubModal({...renameSubModal, open: false})} className="flex-1 btn-outline py-3">Cancel</button>
             </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmSubModal.open}
        title="Remove Sub-category"
        message={`Remove "${confirmSubModal.subName}"?`}
        onConfirm={executeRemoveSub}
        onCancel={() => setConfirmSubModal({ open: false, subName: '' })}
      />
    </Layout>
  );
}

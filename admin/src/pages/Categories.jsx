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
  const [optionsModal, setOptionsModal] = useState({ open: false, subName: '', fabrics: '', styles: '', cat: null, isGlobal: false });
  
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
    setForm(prev => {
      const newSubs = prev.subcategories.map((s, i) => 
        i === idx ? { ...s, [field]: value.split(',').map(v => v.trim()) } : s
      );
      return { ...prev, subcategories: newSubs };
    });
  };

  const getAllSubcategories = () => {
    const list = [];
    categories.forEach(cat => {
      if (cat.subcategories) {
        cat.subcategories.forEach(sub => {
          list.push({
            name: typeof sub === 'string' ? sub : sub.name,
            parent: cat.name,
            parentId: cat._id,
            fabrics: typeof sub === 'string' ? [] : (sub.fabrics || []),
            styles: typeof sub === 'string' ? [] : (sub.styles || []),
            catRef: cat
          });
        });
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  };

  const handleRenameSub = (oldName) => {
    setRenameSubModal({ open: true, oldName, newName: oldName, cat: editingCat });
  };

  const handleGlobalRenameSub = (oldName, parentCat) => {
    setRenameSubModal({ open: true, oldName, newName: oldName, cat: parentCat });
  };

  const handleOpenOptions = (sub, isGlobal = false) => {
    if (isGlobal) {
      setOptionsModal({
        open: true,
        subName: 'Category Defaults',
        isGlobal: true,
        fabrics: (sub.defaultFabrics || []).join(', '),
        styles: (sub.defaultStyles || []).join(', '),
        cat: sub
      });
    } else {
      setOptionsModal({
        open: true,
        subName: sub.name,
        isGlobal: false,
        fabrics: (sub.fabrics || []).join(', '),
        styles: (sub.styles || []).join(', '),
        cat: sub.catRef
      });
    }
  };

  const saveOptions = async () => {
    const { cat, subName, fabrics, styles, isGlobal } = optionsModal;
    if (!cat) return;

    try {
      const fArr = fabrics.split(',').map(f => f.trim()).filter(Boolean);
      const sArr = styles.split(',').map(s => s.trim()).filter(Boolean);

      let updatedData = { ...cat };
      if (isGlobal) {
        updatedData.defaultFabrics = fArr;
        updatedData.defaultStyles = sArr;
      } else {
        updatedData.subcategories = (cat.subcategories || []).map(s => {
          const sName = typeof s === 'string' ? s : s.name;
          if (sName === subName) {
            return { ...(typeof s === 'string' ? { name: s } : s), fabrics: fArr, styles: sArr };
          }
          return s;
        });
      }

      const res = await API.put(`/categories/${cat._id}`, updatedData);
      if (res.data.success) {
        toast.success('Options updated successfully');
        setOptionsModal({ ...optionsModal, open: false });
        fetchCategories();
      }
    } catch (err) {
      toast.error('Failed to update options');
    }
  };

  const confirmRenameSub = async () => {
    const { oldName, newName, cat } = renameSubModal;
    if (!newName || newName.trim() === oldName) return setRenameSubModal({ ...renameSubModal, open: false });

    if (!cat) {
      setForm(prev => ({ 
        ...prev, 
        subcategories: prev.subcategories.map(s => s.name === oldName ? { ...s, name: newName.trim() } : s) 
      }));
      setRenameSubModal({ ...renameSubModal, open: false });
    } else {
      try {
        const res = await API.put(`/categories/${cat._id}/rename-subcategory`, { oldName, newName: newName.trim() });
        if (res.data.success) {
          toast.success(res.data.message);
          if (editingCat && editingCat._id === cat._id) {
            setForm(prev => ({ 
              ...prev, 
              subcategories: prev.subcategories.map(s => s.name === oldName ? { ...s, name: newName.trim() } : s) 
            }));
          }
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
        name: (s.name || '').trim(),
        fabrics: (s.fabrics || []).map(f => (f || '').trim()).filter(Boolean),
        styles: (s.styles || []).map(st => (st || '').trim()).filter(Boolean)
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

  const allSubs = getAllSubcategories();

  return (
    <Layout title="Categories & Subcategories">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-sm text-gray-400 font-sans uppercase tracking-[0.2em]">Store Catalog</h2>
          <p className="text-xs text-gray-500 mt-1 italic">Note: Changing a category name updates products automatically.</p>
        </div>
        <div className="flex gap-4">
           {/* Anchor links to sections */}
           <a href="#subcategory-list" className="btn-outline flex items-center gap-2 text-[10px]">
             View Fabrics & Styles
           </a>
           <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
             <Plus size={16} /> Add Category
           </button>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#000000] mb-6 border-l-4 border-charcoal pl-4">Parent Categories</h3>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-lg border" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(cat => (
              <div key={cat._id} className="card p-5 group flex flex-col justify-between hover:border-gold-500/50 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-charcoal">{cat.name}</h3>
                      {cat.description && <p className="text-[11px] text-gray-400 line-clamp-1">{cat.description}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(cat)} className="p-2 text-gray-400 hover:text-gold-600 rounded-full"><Edit2 size={14}/></button>
                      <button onClick={() => {
                        if(window.confirm(`Delete ${cat.name}?`)) {
                          API.delete(`/categories/${cat._id}`).then(() => fetchCategories()).catch(e => toast.error(e.response?.data?.message || 'Delete failed'));
                        }
                      }} className="p-2 text-gray-400 hover:text-red-500 rounded-full"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <div className="space-y-3">
                     <p className="text-[10px] uppercase tracking-widest text-gray-300 font-bold">Sub-categories: {cat.subcategories?.length || 0}</p>
                     <button onClick={() => handleOpenOptions(cat, true)} className="text-[9px] font-sans text-gold-600 hover:underline uppercase tracking-widest flex items-center gap-1.5">
                       <Plus size={10} /> Default Fabrics & Styles
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW GLOBAL SUBCATEGORY LIST */}
      <div id="subcategory-list" className="pt-8 border-t mt-12">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xs font-bold uppercase tracking-widest text-[#000000] border-l-4 border-charcoal pl-4">Fabrics, Styles Management</h3>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-500">Sub-category &amp; Parent</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-500">Fabrics &amp; Styles</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-500 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {allSubs.length > 0 ? allSubs.map((sub, idx) => (
                    <tr key={`${sub.parent}-${sub.name}-${idx}`} className="hover:bg-gray-50/50 transition-colors group">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-charcoal">{sub.name}</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[9px] uppercase tracking-widest rounded-sm border">{sub.parent}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="space-y-1">
                             <p className="text-[9px] text-gray-400">Fabrics: <span className="text-gray-600">{sub.fabrics.length > 0 ? sub.fabrics.join(', ') : 'Category Default'}</span></p>
                             <p className="text-[9px] text-gray-400">Styles: <span className="text-gray-600">{sub.styles.length > 0 ? sub.styles.join(', ') : 'Category Default'}</span></p>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                             <button onClick={() => handleOpenOptions(sub)} className="btn-outline text-[9px] px-2.5 py-1.5 uppercase tracking-widest font-bold flex items-center gap-1.5 mr-2">
                                Manage Fabrics/Styles
                             </button>
                             <button onClick={() => handleGlobalRenameSub(sub.name, sub.catRef)} className="p-2 text-gray-300 hover:text-gold-600 transition-colors" title="Rename Sub-category">
                                <Edit2 size={14} />
                             </button>
                             <button onClick={() => handleOpenModal(sub.catRef)} className="p-2 text-gray-300 hover:text-charcoal transition-colors" title="Edit Parent Category">
                                <Plus size={14} />
                             </button>
                          </div>
                       </td>
                    </tr>
                 )) : (
                    <tr>
                       <td colSpan="3" className="px-6 py-12 text-center text-gray-400 italic text-sm">No sub-categories created yet.</td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

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

              <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-gray-500 mb-4 font-bold border-b pb-2">Sub-categories Manager</label>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={subInput} onChange={e => setSubInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSub())} className="input-field flex-1" placeholder="e.g. Shirts" />
                  <button type="button" onClick={handleAddSub} className="p-2 bg-charcoal text-white rounded hover:bg-black transition-colors"><Plus /></button>
                </div>
                <div className="space-y-4">
                  {form.subcategories.map((sub, idx) => (
                    <div key={idx} className="bg-white p-4 border rounded shadow-sm hover:border-gold-300 transition-all flex justify-between items-center">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#000000]">{sub.name}</span>
                        <div className="flex gap-3">
                           <button type="button" title="Rename" onClick={() => handleRenameSub(sub.name)} className="text-gray-300 hover:text-gold-600 transition-colors"><Pencil size={12}/></button>
                           <button type="button" title="Remove" onClick={() => handleRemoveSub(sub.name)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                        </div>
                    </div>
                  ))}
                  {form.subcategories.length === 0 && <p className="text-[10px] text-gray-300 italic py-4 text-center">No sub-categories defined for this category.</p>}
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

      {optionsModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded p-8 max-w-md w-full shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="font-serif text-lg font-bold text-charcoal">{optionsModal.isGlobal ? 'Default Category Options' : 'Sub-category Options'}</h3>
                   <p className="text-[10px] text-gold-600 font-sans uppercase tracking-widest mt-1">
                     {optionsModal.isGlobal ? optionsModal.cat?.name : `${optionsModal.subName} (${optionsModal.cat?.name})`}
                   </p>
                </div>
                <button onClick={() => setOptionsModal({ ...optionsModal, open: false })} className="text-gray-300 hover:text-charcoal"><X size={20}/></button>
             </div>
             
             <div className="space-y-6">
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase font-sans text-gray-400 mb-2 font-bold">Fabrics (comma separated)</label>
                  <textarea 
                    value={optionsModal.fabrics} 
                    onChange={e => setOptionsModal({...optionsModal, fabrics: e.target.value})} 
                    className="w-full text-[11px] border p-3 min-h-[100px] rounded-lg focus:border-gold-500 outline-none transition-colors" 
                    placeholder="Cotton, silk, linen..."
                  />
                </div>
                <div>
                   <label className="block text-[9px] tracking-[0.2em] uppercase font-sans text-gray-400 mb-2 font-bold">Styles (comma separated)</label>
                   <textarea 
                     value={optionsModal.styles} 
                     onChange={e => setOptionsModal({...optionsModal, styles: e.target.value})} 
                     className="w-full text-[11px] border p-3 min-h-[100px] rounded-lg focus:border-gold-500 outline-none transition-colors" 
                     placeholder="A-Line, Straight, Anarkali..."
                   />
                </div>
                
                <div className="flex gap-3 pt-4">
                   <button onClick={saveOptions} className="flex-1 btn-primary py-3 justify-center uppercase tracking-widest text-[10px]">Save Changes</button>
                   <button onClick={() => setOptionsModal({ ...optionsModal, open: false })} className="flex-1 btn-outline py-3 justify-center uppercase tracking-widest text-[10px]">Cancel</button>
                </div>
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

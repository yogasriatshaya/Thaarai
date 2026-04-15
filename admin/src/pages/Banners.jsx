import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API, { getFullUrl } from '../api';
import { toast } from 'react-toastify';
import { Settings as SettingsIcon, Upload, Trash2, Image as ImageIcon, CheckCircle2, AlertCircle, Search, ExternalLink, Crop } from 'lucide-react';
import CropModal from '../components/CropModal';

export default function Banners() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [updatingCategory, setUpdatingCategory] = useState(null); // ID of cat being updated
  const [searchTerm, setSearchTerm] = useState('');
  const [cropData, setCropData] = useState({ isOpen: false, image: null, aspect: 21 / 9, onComplete: null });

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
          setCropData({ isOpen: false, image: null, aspect: 21 / 9, onComplete: null });
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, categoriesRes] = await Promise.all([
        API.get('/settings'),
        API.get('/categories')
      ]);

      if (settingsRes.data.success) {
        setSettings(settingsRes.data.settings);
      }
      
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.categories);
      }
    } catch (err) {
      toast.error('Failed to load gallery data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateFallback = async (type, file) => {
    if (!file) return;
    setUpdatingSettings(true);
    try {
      const data = new FormData();
      data.append(type, file);
      
      const res = await API.put('/settings', data);
      if (res.data.success) {
        setSettings(res.data.settings);
        toast.success(`${type === 'bannerFallback' ? 'Banner' : 'Product'} fallback updated`);
      }
    } catch (err) {
      toast.error('Fallback upload failed');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleUpdateCategoryBanner = async (category, file) => {
    if (!file) return;
    setUpdatingCategory(category._id);
    try {
      const data = new FormData();
      data.append('name', category.name);
      data.append('banner', file);
      
      // Send subcategories as JSON string for easy parsing
      data.append('subcategories', JSON.stringify(category.subcategories));

      const res = await API.put(`/categories/${category._id}`, data);
      if (res.data.success) {
        toast.success(`Banner for ${category.name} updated`);
        fetchData();
      }
    } catch (err) {
      toast.error('Category banner update failed');
    } finally {
      setUpdatingCategory(null);
    }
  };

  const handleRemoveCategoryBanner = async (category) => {
    if (!window.confirm(`Remove banner for ${category.name}?`)) return;
    setUpdatingCategory(category._id);
    try {
      const data = new FormData();
      data.append('name', category.name);
      data.append('existingBanner', ''); 
      data.append('subcategories', JSON.stringify(category.subcategories));

      const res = await API.put(`/categories/${category._id}`, data);
      if (res.data.success) {
        toast.success(`Banner for ${category.name} removed`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to remove category banner');
    } finally {
      setUpdatingCategory(null);
    }
  };

  const handleUpdateSubcategoryBanner = async (category, subName, idx, file) => {
    if (!file) return;
    setUpdatingCategory(`${category._id}_${subName}`);
    try {
      const data = new FormData();
      data.append('name', category.name);
      data.append('subcategories', JSON.stringify(category.subcategories));
      data.append(`subcategoryBanner_${idx}`, file);

      if (category.banner) data.append('existingBanner', category.banner);

      const res = await API.put(`/categories/${category._id}`, data);
      if (res.data.success) {
        toast.success(`Banner for ${subName} updated`);
        fetchData();
      }
    } catch (err) {
      toast.error('Sub-category banner update failed');
    } finally {
      setUpdatingCategory(null);
    }
  };

  const handleDeleteSubcategoryBanner = async (category, subName, idx) => {
    if (!window.confirm(`Remove banner for ${subName}?`)) return;
    setUpdatingCategory(`${category._id}_${subName}`);
    try {
      const data = new FormData();
      data.append('name', category.name);
      data.append('subcategories', JSON.stringify(category.subcategories));
      data.append(`subcategoryBanner_${idx}`, '');

      if (category.banner) data.append('existingBanner', category.banner);

      const res = await API.put(`/categories/${category._id}`, data);
      if (res.data.success) {
        toast.success(`Banner for ${subName} removed`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to remove banner');
    } finally {
      setUpdatingCategory(null);
    }
  };

  const handleDeleteFallback = async (type) => {
    if (!window.confirm(`Delete this global fallback?`)) return;
    setUpdatingSettings(true);
    try {
      const res = await API.put('/settings', { [type]: '' });
      if (res.data.success) {
        setSettings(res.data.settings);
        toast.success('Fallback removed');
      }
    } catch (err) {
      toast.error('Failed to remove fallback');
    } finally {
      setUpdatingSettings(false);
    }
  };


  return (
    <Layout title="Gallery Configuration">
      {/* GLOBAL FALLBACKS SECTION */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 bg-gold-50 rounded-lg flex items-center justify-center text-gold-600">
              <SettingsIcon size={20} />
           </div>
           <div>
              <h2 className="text-sm font-sans font-bold uppercase tracking-[0.2em] text-charcoal">Global Media Fallbacks</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Define default images to use when custom content is missing.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* BANNER FALLBACK */}
           <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Global Banner Fallback</p>
                    <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded font-mono">1920x600</span>
                 </div>
                 {settings?.bannerFallback && (
                    <button onClick={() => handleDeleteFallback('bannerFallback')} className="text-red-500 hover:text-red-600 p-1 bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                 )}
              </div>
              <label className="relative aspect-[21/9] w-full border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gold-400 group overflow-hidden bg-gray-50 transition-all">
                 {settings?.bannerFallback ? (
                    <img src={getFullUrl(settings.bannerFallback)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Banner Fallback" />
                  ) : (
                     <div className="flex flex-col items-center text-gray-400 group-hover:text-gold-500">
                        <Upload size={24} />
                        <span className="text-[10px] mt-2 font-bold uppercase tracking-widest">Upload Banner Image</span>
                     </div>
                  )}
                  {updatingSettings && <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full shadow-lg"/></div>}
                  <input type="file" className="hidden" accept="image/*" onChange={e => initiateCrop(e.target.files[0], 21/9, (file) => handleUpdateFallback('bannerFallback', file))} disabled={updatingSettings} />
               </label>
               <p className="text-[9px] text-gray-400 mt-4 italic">Proportion: Ultra-Wide (Collection Page Banner - 21:9)</p>
            </div>
           <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Product Card Fallback</p>
                 {settings?.productFallback && (
                    <button onClick={() => handleDeleteFallback('productFallback')} className="text-red-500 hover:text-red-600 p-1 bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                 )}
              </div>
              <div className="flex justify-center">
                <label className="relative aspect-[3/4] w-full max-w-[180px] border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gold-400 group overflow-hidden bg-gray-50 transition-all">
                   {settings?.productFallback ? (
                      <img src={getFullUrl(settings.productFallback)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Product Fallback" />
                   ) : (
                      <div className="flex flex-col items-center text-gray-400 group-hover:text-gold-500">
                         <Upload size={24} />
                         <span className="text-[10px] mt-2 font-bold uppercase tracking-widest text-center px-4">Upload Card Image</span>
                      </div>
                   )}
                   {updatingSettings && <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full shadow-lg"/></div>}
                   <input type="file" className="hidden" accept="image/*" onChange={e => initiateCrop(e.target.files[0], 3/4, (file) => handleUpdateFallback('productFallback', file))} disabled={updatingSettings} />
                </label>
              </div>
              <p className="text-[9px] text-gray-400 mt-4 italic text-center">Proportion: 3:4 Portrait (Product Cards)</p>
           </div>
        </div>
      </div>


      {/* COLLECTION BANNERS SECTION */}
      <div className="mb-12">
        {/* ... (new section content) ... */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-sm text-charcoal font-sans font-bold uppercase tracking-[0.2em] mb-1">Collection Banners</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Set unique banners for each category and sub-category filter.</p>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -track-y-1/2 text-gray-400">
               <Search size={14} />
            </span>
            <input 
               type="text" 
               placeholder="Search collections..." 
               className="pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-gold-400 w-full md:w-64 shadow-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-12">
          {categories
            .filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((cat) => (
            <div key={cat._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                    {cat.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif text-charcoal font-bold text-lg leading-tight">{cat.name}</h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Parent Category</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(`${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/collection?category=${cat.name}`, '_blank')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <ExternalLink size={10} />
                  Live View
                </button>
              </div>

              <div className="p-8">
                <div className="flex flex-col gap-16">
                  <div className="max-w-5xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Main Category Banner</p>
                        <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded font-mono">1920x600</span>
                      </div>
                      {cat.banner && (
                        <button onClick={() => handleRemoveCategoryBanner(cat)} className="text-red-500 hover:text-red-600 p-1 bg-red-50 rounded-lg transition-colors"><Trash2 size={12}/></button>
                      )}
                    </div>
                    <label className="relative aspect-[21/9] w-full border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gold-400 group overflow-hidden bg-gray-50 transition-all">
                      {cat.banner ? (
                        <img src={getFullUrl(cat.banner)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={cat.name} />
                      ) : (
                        <div className="flex flex-col items-center text-gray-300 group-hover:text-gold-500 text-center px-4">
                          <ImageIcon size={32} strokeWidth={1.5} className="mb-2 opacity-50" />
                          <Upload size={16} className="text-gold-400 mb-1" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Upload {cat.name} Banner</span>
                          <p className="text-[8px] text-gray-400 mt-1">Recommended: JPG or WebP</p>
                        </div>
                      )}
                      {updatingCategory === cat._id && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={e => initiateCrop(e.target.files[0], 21/9, (file) => handleUpdateCategoryBanner(cat, file))} disabled={updatingCategory === cat._id} />
                    </label>
                  </div>

                  <div className="pt-12 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2 mb-8">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sub-category Banners</p>
                      <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded font-mono text-[7px]">1920x600</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {cat.subcategories.map((sub, i) => {
                        const subLabel = typeof sub === 'string' ? sub : sub.name;
                        const subBanner = typeof sub === 'string' ? null : sub.banner;
                        const isUpdating = updatingCategory === `${cat._id}_${subLabel}`;

                        return (
                          <div key={subLabel} className="bg-gray-50 rounded-xl p-4 border border-gray-100 group">
                            <div className="flex justify-between items-center mb-3">
                              <p className="text-[10px] font-bold text-charcoal truncate pr-2">{subLabel}</p>
                              {subBanner && (
                                <button onClick={() => handleDeleteSubcategoryBanner(cat, subLabel, i)} className="text-red-400 hover:text-red-500 transition-colors">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                            <label className="relative aspect-[21/9] w-full border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gold-400 bg-white overflow-hidden transition-all group-hover:border-gold-200">
                              {subBanner ? (
                                <img src={getFullUrl(subBanner)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={subLabel} />
                              ) : (
                                <div className="flex flex-col items-center text-gray-300 group-hover:text-gold-400 text-center px-3">
                                  <Upload size={14} />
                                  <span className="text-[8px] mt-1 font-bold uppercase tracking-widest">Set Banner</span>
                                </div>
                              )}
                              {isUpdating && (
                                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
                                  <div className="w-4 h-4 border border-white border-t-transparent animate-spin rounded-full" />
                                </div>
                              )}
                                <input type="file" className="hidden" accept="image/*" onChange={e => initiateCrop(e.target.files[0], 21/9, (file) => handleUpdateSubcategoryBanner(cat, subLabel, i, file))} disabled={isUpdating} />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {cropData.isOpen && (
        <CropModal 
          image={cropData.image} 
          aspect={cropData.aspect}
          onCropComplete={cropData.onComplete}
          onCancel={() => setCropData({ isOpen: false, image: null, aspect: 21/9, onComplete: null })}
        />
      )}

    </Layout>
  );
}

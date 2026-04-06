import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import API, { BACKEND_URL, getImgUrl } from '../api';
import { toast } from 'react-toastify';
import { Pencil, Copy, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoryStructure, setCategoryStructure] = useState({});
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [subcategory, setSubcategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [isBulkDiscount, setIsBulkDiscount] = useState(false);
  const [discountForm, setDiscountForm] = useState({ category: 'All', discountType: 'percentage', discountValue: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, name: '' });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.set('search', search);
      if (category !== 'All') params.set('category', category);
      if (subcategory !== 'All') params.set('subcategory', subcategory);
      if (sort) params.set('sort', sort);
      const res = await API.get(`/products?${params}`);
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || Math.ceil((res.data.total || 0) / limit) || 1);
    } catch {
      toast.error('Failed to load products');
    }
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, [page, limit, search, sort, category, subcategory]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const res = await API.get('/categories');
        if (res.data.success) {
          const cats = res.data.categories || [];
          setCategoryOptions(cats.map(c => c.name));
          
          // Store category structure for subcategory filtering
          const structure = {};
          cats.forEach(c => {
            structure[c.name] = (c.subcategories || []).map(sub => 
              typeof sub === 'string' ? sub : sub?.name || ''
            ).filter(name => name !== '');
          });
          setCategoryStructure(structure);
          
          // Set initial subcategories for "All Categories"
          const allSubs = cats.flatMap(c => (c.subcategories || []).map(sub => 
            typeof sub === 'string' ? sub : sub?.name || ''
          )).filter(name => name !== '');
          setSubcategoryOptions([...new Set(allSubs)]);
        }
      } catch {
        setCategoryOptions(['Kurti', 'Maxi', 'Co-ords', 'Anarkali']);
      }
    };
    loadFilterOptions();
  }, []);

  const handleDelete = async (id, name) => {
    setConfirmModal({ open: true, id, name });
  };

  const executeDelete = async () => {
    const { id, name } = confirmModal;
    setConfirmModal({ ...confirmModal, open: false });
    try {
      await API.delete(`/products/${id}`);
      toast.success(`"${name}" deleted successfully`);
      loadProducts();
    } catch { toast.error('Failed to delete product'); }
  };


  return (
    <Layout title="Products">
      {/* Header with Search and Count */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="input-field flex-1 md:flex-none md:w-80"
        />
        <p className="text-xs text-gray-400 font-sans">{total} total</p>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
          <select value={category} onChange={e => { 
            setCategory(e.target.value); 
            setSubcategory('All');
            setPage(1);
            // Update subcategory options based on selected category
            if (e.target.value === 'All') {
              const allSubs = Object.values(categoryStructure).flat();
              setSubcategoryOptions([...new Set(allSubs)]);
            } else {
              setSubcategoryOptions(categoryStructure[e.target.value] || []);
            }
          }} className="input-field w-full sm:w-44 text-xs">
            <option value="All">All Categories</option>
            {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={subcategory} onChange={e => { setSubcategory(e.target.value); setPage(1); }} className="input-field w-full sm:w-48 text-xs">
            <option value="All">All Subcategories</option>
            {subcategoryOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="input-field w-full sm:w-44 text-xs">
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="name_asc">Alphabetical: A to Z</option>
            <option value="name_desc">Alphabetical: Z to A</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={() => setIsBulkDiscount(true)} className="btn-outline flex-1 md:flex-none flex items-center justify-center gap-1 text-[11px] font-sans border border-gray-200 text-gray-500 hover:border-charcoal">
            <span>% Bulk Rules</span>
          </button>
          <Link to="/products/add" className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-1">+ Add Product</Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-serif text-xl text-gray-400 mb-4">No products found</p>
            <Link to="/products/add" className="btn-primary">Add First Product</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Label', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-[0.2em] uppercase text-gray-400 font-sans px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={getImgUrl(p.images?.[0])} alt={p.name}
                        className="w-10 h-12 object-cover bg-gray-100"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=40&h=48&fit=crop'; }} />
                      <p className="text-sm font-serif text-charcoal">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-sans text-gray-500">
                    <span className="font-bold">{p.category}</span>
                    {p.subcategory && <span className="block text-[10px] text-gray-400">{p.subcategory}</span>}
                  </td>
                  <td className="px-5 py-4 text-sm font-sans font-medium text-charcoal">
                    <span>₹{p.price?.toLocaleString()}</span>
                    {p.priceUSD > 0 && <span className="text-xs text-gray-400 ml-1">/ ${p.priceUSD}</span>}
                  </td>
                  <td className="px-5 py-4 text-xs font-sans">
                    <span className={`${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-4">
                    {p.label && (
                      <span className="text-[9px] tracking-wider uppercase font-sans font-medium px-2 py-0.5 bg-gold-100 text-gold-700 rounded-full">{p.label}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                       <Link to={`/products/edit/${p._id}`} title="Edit" className="text-gray-400 hover:text-gold-600 transition-colors">
                          <Pencil size={15} />
                       </Link>
                       <Link to={`/products/add?duplicateId=${p._id}`} title="Duplicate" className="text-gray-400 hover:text-blue-500 transition-colors">
                          <Copy size={15} />
                       </Link>
                       <button onClick={() => handleDelete(p._id, p.name)} title="Delete" className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Footer */}
        {!loading && products.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-6 py-4 border-t border-gray-100 bg-white font-sans">
              <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span>Rows:</span>
                      <select 
                        value={limit} 
                        onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                        className="bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none text-charcoal hover:border-gold-500 transition-colors cursor-pointer"
                      >
                        {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-gray-400">
                      Showing {total === 0 ? 0 : ((page-1)*limit)+1} - {Math.min(page*limit, total)} of {total}
                  </span>
              </div>
              
              <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page === 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gold-600 border border-gray-100 rounded-md disabled:opacity-20 transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                    Prev
                  </button>
                  <button 
                    onClick={() => setPage(p => p + 1)} 
                    disabled={page * limit >= total}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gold-600 border border-gray-100 rounded-md disabled:opacity-20 transition-all"
                  >
                    Next
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </button>
              </div>
          </div>
        )}
      </div>

      {/* Bulk Discount Modal */}
      {isBulkDiscount && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded p-6 max-w-sm w-full relative">
                 <button onClick={() => setIsBulkDiscount(false)} className="absolute top-4 right-4 text-xl text-gray-400 hover:text-charcoal">×</button>
                 <h3 className="font-serif text-charcoal text-lg mb-4">Bulk Category Discount</h3>
                 <form onSubmit={async (e) => {
                     e.preventDefault();
                     try {
                         await API.put('/products/bulk/discount', discountForm);
                         toast.success('Prices updated successfully');
                         setIsBulkDiscount(false);
                         loadProducts();
                     } catch { toast.error('Failed to apply discount'); }
                 }} className="space-y-3 font-sans text-xs">
                     <div>
                         <label className="block text-gray-400 mb-1">Category</label>
                          <select value={discountForm.category} onChange={e => setDiscountForm({...discountForm, category: e.target.value})} className="input-field">
                             <option value="All">All Categories</option>
                           {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                     </div>
                     <div>
                         <label className="block text-gray-400 mb-1">Discount Type</label>
                         <select value={discountForm.discountType} onChange={e => setDiscountForm({...discountForm, discountType: e.target.value})} className="input-field">
                             <option value="percentage">Percentage (%)</option>
                             <option value="fixed">Fixed Amount (₹)</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-gray-400 mb-1">Value</label>
                         <input required type="number" value={discountForm.discountValue} onChange={e => setDiscountForm({...discountForm, discountValue: e.target.value})} className="input-field" placeholder="10" />
                     </div>
                     <button type="submit" className="btn-primary w-full justify-center">Apply Rule</button>
                  </form>
             </div>
         </div>
      )}
      {/* Custom Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmModal.open}
        title="Delete Product"
        message={`Warning: You are about to permanently delete "${confirmModal.name}". This action cannot be undone.`}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, open: false })}
      />
    </Layout>
  );
}

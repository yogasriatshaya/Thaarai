import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import API, { BACKEND_URL, getFullUrl } from '../api';
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
  const [labelFilter, setLabelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sort, setSort] = useState('newest');
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
      if (labelFilter !== 'All') params.set('label', labelFilter);
      if (statusFilter !== 'All') params.set('status', statusFilter);
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

  useEffect(() => { loadProducts(); }, [page, limit, search, sort, category, subcategory, statusFilter, labelFilter]);

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
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8 flex-wrap justify-between">
        <div className="flex flex-col md:flex-row items-center gap-6 flex-1 w-full md:w-auto">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="input-field w-full md:w-80"
          />
          
          <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-100 flex-shrink-0 shadow-inner">
             {[
               { id: 'All', label: 'All Products' },
               { id: 'Publish', label: 'Published' },
               { id: 'Draft', label: 'Drafts' }
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                 className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${statusFilter === tab.id ? 'bg-white text-charcoal shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 {tab.label}
               </button>
             ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 font-sans font-medium">{total} total products</p>
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
          <select value={labelFilter} onChange={e => { setLabelFilter(e.target.value); setPage(1); }} className="input-field w-full sm:w-36 text-xs">
            <option value="All">All Labels</option>
            <option value="Hot">Hot</option>
            <option value="New Arrival">New Arrival</option>
            <option value="Trending">Trending</option>
            <option value="Sold Out">Sold Out</option>
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

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <Link to="/products/add" className="btn-primary w-full md:w-auto flex items-center justify-center gap-1 py-3 md:py-2">+ Add Product</Link>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-serif text-xl text-gray-400 mb-4">No products found</p>
            <Link to="/products/add" className="btn-primary">Add First Product</Link>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px] table-fixed">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs tracking-[0.2em] uppercase text-gray-400 font-sans px-5 py-4 whitespace-nowrap w-1/3">Product</th>
                <th className="text-left text-xs tracking-[0.2em] uppercase text-gray-400 font-sans px-5 py-4 whitespace-nowrap w-28">Category</th>
                 <th className="text-left text-xs tracking-[0.2em] uppercase text-gray-400 font-sans px-5 py-4 whitespace-nowrap w-48">Price / Offer</th>
                <th className="text-left text-xs tracking-[0.2em] uppercase text-gray-400 font-sans px-5 py-4 whitespace-nowrap w-20">Stock</th>
                <th className="text-left text-xs tracking-[0.2em] uppercase text-gray-400 font-sans px-5 py-4 whitespace-nowrap w-32">Label</th>
                <th className="text-left text-xs tracking-[0.2em] uppercase text-gray-400 font-sans px-5 py-4 whitespace-nowrap w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                 const toBool = v => v === true || v === 'true';
                 const indiaOfferActive = toBool(p.offerActiveIndia) && Number(p.offerPriceIndia) > 0 && p.offerEndTimeIndia && new Date(p.offerEndTimeIndia).getTime() > Date.now();
                 const usaOfferActive   = toBool(p.offerActiveUSA)   && Number(p.offerPriceUSDUSA) > 0 && p.offerEndTimeUSA   && new Date(p.offerEndTimeUSA).getTime()   > Date.now();
                 
                 const rowImage = p.variants?.[0]?.images?.[0] ? getFullUrl(p.variants[0].images[0]) : p.images?.[0] ? getFullUrl(p.images[0]) : '';

                 return (
                <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 min-w-0">
                    <div className="flex items-center gap-3">
                      <img src={rowImage} alt={p.name}
                        className="w-10 h-10 object-cover bg-gray-100 rounded shadow-sm border border-gray-100 flex-shrink-0"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=40&h=48&fit=crop'; }} />
                      <p className="text-sm font-serif text-charcoal truncate" title={p.name}>{p.name}</p>
                      {p.status === 'Draft' && (
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">Draft</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-sans text-gray-500 whitespace-nowrap">
                    <span className="font-bold">{p.category}</span>
                    {p.subcategory && <span className="block text-[10px] text-gray-400">{p.subcategory}</span>}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                     {/* India price row */}
                     <div className="flex items-center gap-1.5 mb-0.5">
                       <span className="text-[9px] font-bold text-gray-300 w-4">IN</span>
                       {indiaOfferActive ? (
                         <>
                           <span className="text-sm font-bold text-amber-600">₹{Number(p.offerPriceIndia).toLocaleString()}</span>
                           <span className="text-[11px] text-gray-400 line-through">₹{p.price?.toLocaleString()}</span>
                           <span className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-bold">SALE</span>
                         </>
                       ) : (
                         <span className="text-sm font-medium text-charcoal">₹{p.price?.toLocaleString()}</span>
                       )}
                     </div>
                     {/* US price row */}
                     {p.priceUSD > 0 && (
                       <div className="flex items-center gap-1.5">
                         <span className="text-[9px] font-bold text-gray-300 w-4">US</span>
                         {usaOfferActive ? (
                           <>
                             <span className="text-xs font-bold text-blue-600">${Number(p.offerPriceUSDUSA)}</span>
                             <span className="text-[11px] text-gray-400 line-through">${p.priceUSD}</span>
                             <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold">SALE</span>
                           </>
                         ) : (
                           <span className="text-xs text-gray-400">${p.priceUSD}</span>
                         )}
                       </div>
                     )}
                   </td>
                  <td className="px-5 py-4 text-xs font-sans whitespace-nowrap">
                    <span className={`${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {p.label && (
                      <span className="text-[9px] tracking-wider uppercase font-sans font-medium px-2 py-0.5 bg-gold-100 text-gold-700 rounded-full">{p.label}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
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
                 );
               })}
            </tbody>
          </table>
          </div>
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
                        {[10, 25, 50, 1000].map(v => <option key={v} value={v}>{v === 1000 ? 'All' : v}</option>)}
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

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import API, { BACKEND_URL } from '../api';
import { toast } from 'react-toastify';
import { Pencil, Copy, Trash2 } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [isBulkDiscount, setIsBulkDiscount] = useState(false);
  const [discountForm, setDiscountForm] = useState({ category: 'All', discountType: 'percentage', discountValue: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      const res = await API.get(`/products?${params}`);
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      toast.error('Failed to load products');
    }
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, [page, search, sort]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted');
      loadProducts();
    } catch { toast.error('Failed to delete'); }
  };

  const getImg = img => img?.startsWith('http') ? img : `${BACKEND_URL}${img}`;

  return (
    <Layout title="Products">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="input-field w-64"
          />
          <select value={sort} onChange={e => setSort(e.target.value)} className="input-field w-40 text-xs">
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="name_asc">Alphabetical: A to Z</option>
            <option value="name_desc">Alphabetical: Z to A</option>
          </select>
          <div className="flex items-center gap-2">
           <button onClick={() => setIsBulkDiscount(true)} className="btn-outline flex items-center gap-1 text-[11px] font-sans border border-gray-200 text-gray-500 hover:border-charcoal">
              <span>% Bulk Rules</span>
           </button>
           <Link to="/products/add" className="btn-primary flex items-center gap-1">+ Add Product</Link>
        </div>
        </div>
        <p className="text-xs text-gray-400 font-sans">{total} total</p>
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
                      <img src={p.images?.[0] ? getImg(p.images[0]) : ''} alt={p.name}
                        className="w-10 h-12 object-cover bg-gray-100"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=40&h=48&fit=crop'; }} />
                      <div>
                        <p className="text-sm font-serif text-charcoal">{p.name}</p>
                        <p className="text-[10px] text-gray-400 font-sans">{p.subcategory || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-sans text-gray-500">{p.category}</td>
                  <td className="px-5 py-4 text-sm font-sans font-medium text-charcoal">₹{p.price?.toLocaleString()}</td>
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

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs font-sans border transition-all ${page === p ? 'bg-charcoal text-white border-charcoal' : 'border-gray-200 hover:border-charcoal'}`}>
                {p}
              </button>
            ))}
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
                             {['Women', 'Kurti', 'Kurti with Dupatta', 'Anarkali', 'Maxi', 'Co-Ord Sets', 'Sarees', 'Dress Materials'].map(c => <option key={c} value={c}>{c}</option>)}
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
    </Layout>
  );
}

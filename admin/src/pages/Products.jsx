import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import API, { BACKEND_URL } from '../api';
import { toast } from 'react-toastify';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      const res = await API.get(`/products?${params}`);
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      toast.error('Failed to load products');
    }
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, [page, search]);

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="input-field w-64"
          />
          <p className="text-xs text-gray-400 font-sans">{total} total</p>
        </div>
        <Link to="/products/add" className="btn-primary">+ Add Product</Link>
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
                    <div className="flex gap-3">
                      <Link to={`/products/edit/${p._id}`} className="text-[10px] tracking-widest uppercase text-gold-600 hover:underline font-sans">Edit</Link>
                      <button onClick={() => handleDelete(p._id, p.name)} className="text-[10px] tracking-widest uppercase text-red-500 hover:underline font-sans">Delete</button>
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
    </Layout>
  );
}

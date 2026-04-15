import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/users/all?page=${page}&limit=${limit}`);
      setCustomers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Customers load error:', err.response?.status, err.response?.data?.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, limit]);

  return (
    <Layout title="Customers">
      <div className="mb-6">
        <p className="text-xs text-gray-400 font-sans">{customers.length} registered customers</p>
      </div>
      <div className="card">
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : customers.length === 0 ? (
          <p className="text-center py-16 text-gray-400 font-serif text-xl">No customers yet</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Email', 'Role', 'Joined', 'Wishlist'].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-[0.2em] uppercase text-gray-400 font-sans px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
                        <span className="text-gold-700 text-xs font-serif font-medium">{customer.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-sans text-charcoal">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-sans text-gray-500 whitespace-nowrap">{customer.email}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`text-[9px] tracking-wider uppercase font-sans font-medium px-2 py-0.5 rounded-full ${customer.role === 'admin' ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-500'}`}>
                      {customer.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-sans text-gray-400 whitespace-nowrap">{new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                  <td className="px-5 py-4 text-xs font-sans text-gray-500 whitespace-nowrap">{customer.wishlist?.length || 0} items</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        
        {/* Pagination Footer */}
        {!loading && customers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-6 py-4 border-t border-gray-50 bg-white font-sans">
              <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span>Rows per page:</span>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gold-600 border border-gray-100 rounded-md disabled:opacity-20 transition-all font-sans"
                  >
                    Prev
                  </button>
                  <button 
                    onClick={() => setPage(p => p + 1)} 
                    disabled={page * limit >= total}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gold-600 border border-gray-100 rounded-md disabled:opacity-20 transition-all font-sans"
                  >
                    Next
                  </button>
              </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
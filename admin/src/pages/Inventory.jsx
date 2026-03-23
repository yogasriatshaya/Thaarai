import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import { toast } from 'react-toastify';
import { Package, ArrowUpRight, ArrowDownRight, RefreshCw, Search } from 'lucide-react';

export default function Inventory() {
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustQty, setAdjustQty] = useState({});
  const [adjustReason, setAdjustReason] = useState({});

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const prodRes = await API.get(`/products?limit=50${search ? `&search=${search}` : ''}`);
      const logRes = await API.get('/inventory/logs?limit=30');
      
      setProducts(prodRes.data.products || []);
      setLogs(logRes.data.logs || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory data');
    }
    setLoading(false);
  };

  const handleAdjust = async (id) => {
    const qty = adjustQty[id];
    const reason = adjustReason[id] || 'Manual Adjustment';
    
    if (!qty || isNaN(qty)) {
      toast.warning('Please enter a valid quantity');
      return;
    }

    try {
      const res = await API.put(`/inventory/adjust/${id}`, { quantity: Number(qty), reason });
      if (res.data.success) {
         toast.success('Stock adjusted successfully');
         setAdjustQty({ ...adjustQty, [id]: '' });
         setAdjustReason({ ...adjustReason, [id]: '' });
         loadInventory();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjustment failed');
    }
  };

  return (
    <Layout title="Inventory & Stock">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="card p-5 shadow-sm">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 gap-3">
                  <h3 className="font-serif text-lg text-charcoal flex items-center gap-2"><Package size={18} className="text-gold-600"/> Stock Metrics</h3>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded border border-gray-100 w-full md:w-auto">
                     <Search size={14} className="text-gray-400" />
                     <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="bg-transparent border-none text-xs focus:outline-none w-48 font-sans" />
                  </div>
               </div>

               {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded animate-pulse" />)}</div>
               ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                       <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                             {['Product', 'Stock', 'Quick Adjust', 'Reason', 'Action'].map(h => (
                                <th key={h} className="text-left text-[10px] tracking-wider uppercase font-sans text-gray-400 px-4 py-2.5">{h}</th>
                             ))}
                          </tr>
                       </thead>
                       <tbody>
                          {products.map(p => (
                             <tr key={p._id} className="border-b border-gray-50 text-xs hover:bg-gray-50 transition-colors font-sans">
                                <td className="px-4 py-3 font-medium text-charcoal truncate max-w-[150px]">{p.name}</td>
                                <td className="px-4 py-3"><span className={`${(p.stock || 0) <= 5 ? 'text-red-500 font-bold' : 'text-gray-600'}`}>{p.stock || 0}</span></td>
                                <td className="px-4 py-3">
                                   <input type="number" placeholder="+5 or -2" value={adjustQty[p._id] || ''} onChange={e => setAdjustQty({ ...adjustQty, [p._id]: e.target.value })} className="border border-gray-200 rounded px-2 py-1 w-16 text-center text-xs focus:border-gold-500 focus:outline-none font-sans" />
                                </td>
                                <td className="px-4 py-3">
                                   <input type="text" placeholder="Reason" value={adjustReason[p._id] || ''} onChange={e => setAdjustReason({ ...adjustReason, [p._id]: e.target.value })} className="border border-gray-200 rounded px-2 py-1 text-xs w-28 focus:border-gold-500 focus:outline-none font-sans" />
                                </td>
                                <td className="px-4 py-3">
                                   <button onClick={() => handleAdjust(p._id)} className="bg-charcoal text-white px-3 py-1 text-[10px] tracking-widest uppercase hover:bg-gold-600 transition-colors font-sans">Apply</button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               )}
            </div>
         </div>

         {/* Logs timeline */}
         <div className="card p-5 shadow-sm">
             <h3 className="font-serif text-charcoal mb-4 flex items-center gap-2"><RefreshCw size={16} className="text-blue-500" /> Stock Movement Log</h3>
             <div className="space-y-3 overflow-y-auto max-h-[72vh] px-1">
                {logs.length === 0 ? <p className="text-xs text-gray-400 text-center py-5">No logs available.</p> : logs.map((l, idx) => {
                    const isIncrease = l.action === 'increment';
                    return (
                        <div key={l._id || idx} className="border-b border-gray-50 pb-3 last:border-none flex items-start gap-2 text-xs font-sans">
                           <div className={`p-1 rounded-full mt-0.5 ${isIncrease ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {isIncrease ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                           </div>
                           <div className="flex-1 min-w-0">
                               <p className="font-medium text-charcoal truncate">{l.productId?.name || 'Unknown Item'}</p>
                               <p className="text-[10px] text-gray-400 font-sans">{l.reason}</p>
                               <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                                   <span>Prev: {l.previousStock || 0}</span>
                                   <span>|</span>
                                   <span className="font-bold text-charcoal">Delta: {isIncrease ? '+' : '-'}{l.quantity}</span>
                                   <span>|</span>
                                   <span>Curr: {l.currentStock}</span>
                               </div>
                           </div>
                        </div>
                    );
                })}
             </div>
         </div>
      </div>
    </Layout>
  );
}

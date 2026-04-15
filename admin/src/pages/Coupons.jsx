import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import { toast } from 'react-toastify';
import { Ticket, Plus, Trash2, Pencil } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minAmount: '', expiryDate: '', usageLimit: '' });
  const [editId, setEditId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => { load(); }, [page, limit]);

  const load = async () => {
     setLoading(true);
     try { 
        const res = await API.get(`/coupons?page=${page}&limit=${limit}`); 
        setCoupons(res.data.coupons || []); 
        setTotal(res.data.total || 0);
     } catch { toast.error('Failed to load coupons'); }
     setLoading(false);
  };

  const handleEdit = (c) => {
     setEditId(c._id);
     setForm({
         code: c.code,
         discountType: c.discountType,
         discountValue: c.discountValue,
         minAmount: c.minAmount || '',
         usageLimit: c.usageLimit || '',
         expiryDate: c.expiryDate ? c.expiryDate.split('T')[0] : ''
     });
  };

  const handleSubmit = async (e) => {
     e.preventDefault();
     try { 
         if (editId) {
             await API.put(`/coupons/${editId}`, form);
             toast.success('Coupon updated successfully');
         } else {
             await API.post('/coupons', form); 
             toast.success('Coupon created successfully'); 
         }
         setForm({ code: '', discountType: 'percentage', discountValue: '', minAmount: '', expiryDate: '', usageLimit: '' }); 
         setEditId(null);
         load(); 
     } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const handleDelete = async (id) => {
      setConfirmModal({ open: true, id });
  };

  const executeDelete = async () => {
      const { id } = confirmModal;
      setConfirmModal({ ...confirmModal, open: false });
      try { await API.delete(`/coupons/${id}`); toast.success('Coupon deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  return (
    <Layout title="Promo Codes">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-5">
             <h3 className="font-serif text-charcoal mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">{editId ? <Pencil size={14} /> : <Plus size={16} />} {editId ? 'Edit Coupon' : 'Create Coupon'}</span>
                {editId && <button type="button" onClick={() => { setForm({ code: '', discountType: 'percentage', discountValue: '', minAmount: '', expiryDate: '', usageLimit: '' }); setEditId(null); }} className="text-gray-400 hover:text-charcoal text-[10px] underline">Cancel</button>}
             </h3>
             <form onSubmit={handleSubmit} className="space-y-3 font-sans text-xs">
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Code</label><input required value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="border border-gray-100 rounded-md p-2 w-full outline-none focus:border-gold-500" placeholder="GIFT20" /></div>
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Type</label><select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="border border-gray-100 rounded-md p-2 w-full outline-none focus:border-gold-500"><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (₹)</option></select></div>
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Value</label><input required type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} className="border border-gray-100 rounded-md p-2 w-full outline-none focus:border-gold-500" placeholder="10" /></div>
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Min Bill (₹)</label><input type="number" value={form.minAmount} onChange={e => setForm({...form, minAmount: e.target.value})} className="border border-gray-100 rounded-md p-2 w-full outline-none focus:border-gold-500" placeholder="500" /></div>
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Max Uses (Limit)</label><input type="number" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})} className="border border-gray-100 rounded-md p-2 w-full outline-none focus:border-gold-500" placeholder="100 (Unset for unlimited)" /></div>
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Expiry</label><input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="border border-gray-100 rounded-md p-2 w-full outline-none focus:border-gold-500" /></div>
                 <button type="submit" className="bg-charcoal text-white rounded-md p-2 w-full font-bold uppercase tracking-widest hover:bg-gold-600 transition-colors flex items-center justify-center gap-2">{editId ? 'Update Coupon' : 'Save Coupon'}</button>
             </form>
          </div>
          <div className="md:col-span-2 card p-5 flex flex-col h-full">
              <h3 className="font-serif text-charcoal mb-4 flex items-center gap-2"><Ticket size={16} className="text-gold-600" /> Active Coupons</h3>
              <div className="flex-1 overflow-x-auto no-scrollbar">
                {loading ? <p className="text-xs text-gray-400 p-4">Loading...</p> : coupons.length === 0 ? <p className="text-gray-400 text-xs p-4">No promos created.</p> : (
                    <table className="w-full text-xs font-sans">
                      <thead><tr className="bg-gray-50 border-b"><th className="text-left p-2">Code</th><th className="text-left p-2">Discount</th><th className="text-left p-2">Usage</th><th className="text-left p-2">Expiry</th><th className="text-right p-2"></th></tr></thead>
                      <tbody>
                          {coupons.map(c => (
                              <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                  <td className="p-2 font-bold font-sans text-charcoal">{c.code}</td>
                                  <td className="p-2">{c.discountValue}{c.discountType === 'percentage' ? '%' : '₹'} off</td>
                                  <td className="p-2 text-gray-400">{c.usedCount} / {c.usageLimit || '∞'} uses</td>
                                  <td className="p-2 text-gray-400">{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : '—'}</td>
                                  <td className="p-2 text-right flex items-center justify-end gap-2">
                                      <button onClick={() => handleEdit(c)} title="Edit" className="text-gray-400 hover:text-gold-500 transition-colors"><Pencil size={14} /></button>
                                      <button onClick={() => handleDelete(c._id)} title="Delete" className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                    </table>
                )}
              </div>

               {/* Pagination Footer */}
               {!loading && coupons.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-50 bg-white font-sans text-[10px] select-none flex-none">
                    <div className="flex items-center gap-4 text-gray-400 font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                           <span>Limit:</span>
                           <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="bg-gray-50 border border-gray-100 rounded px-1 py-0.5 outline-none text-charcoal">
                              {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
                           </select>
                        </div>
                        <span>
                            {total === 0 ? 0 : ((page-1)*limit)+1}-{Math.min(page*limit, total)} OF {total}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 font-sans">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 font-bold uppercase border border-gray-100 rounded hover:bg-gray-50 disabled:opacity-20 transition-all">Prev</button>
                        <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="px-2 py-1 font-bold uppercase border border-gray-100 rounded hover:bg-gray-50 disabled:opacity-20 transition-all">Next</button>
                    </div>
                </div>
               )}
          </div>
       </div>
       <ConfirmModal 
        isOpen={confirmModal.open}
        title="Delete Coupon"
        message="Are you sure you want to delete this promo code? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ ...confirmModal, open: false })}
      />
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import { toast } from 'react-toastify';
import { Ticket, Plus, Trash2, Pencil } from 'lucide-react';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minAmount: '', expiryDate: '', usageLimit: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
     setLoading(true);
     try { const res = await API.get('/coupons'); setCoupons(res.data.coupons || []); } catch { toast.error('Failed to load coupons'); }
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
     if (!window.confirm('Delete coupon?')) return;
     try { await API.delete(`/coupons/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
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
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Code</label><input required value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="input-field" placeholder="GIFT20" /></div>
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Type</label><select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="input-field"><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (₹)</option></select></div>
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Value</label><input required type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} className="input-field" placeholder="10" /></div>
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Min Bill (₹)</label><input type="number" value={form.minAmount} onChange={e => setForm({...form, minAmount: e.target.value})} className="input-field" placeholder="500" /></div>
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Max Uses (Limit)</label><input type="number" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})} className="input-field" placeholder="100 (Unset for unlimited)" /></div>
                 <div><label className="block text-[10px] tracking-wider uppercase text-gray-500 mb-1">Expiry</label><input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="input-field" /></div>
                 <button type="submit" className="btn-primary w-full justify-center">{editId ? 'Update Coupon' : 'Save Coupon'}</button>
             </form>
          </div>
          <div className="md:col-span-2 card p-5">
              <h3 className="font-serif text-charcoal mb-4 flex items-center gap-2"><Ticket size={16} className="text-gold-600" /> Active Coupons</h3>
              {loading ? <p>Loading...</p> : coupons.length === 0 ? <p className="text-gray-400 text-xs">No promos created.</p> : (
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
       </div>
    </Layout>
  );
}

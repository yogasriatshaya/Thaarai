import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import { toast } from 'react-toastify';

const ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];
const statusColors = {
  processing: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await API.get(`/orders/all${params}`);
      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load orders'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, field, value) => {
    try {
      await API.put(`/orders/${id}/status`, { [field]: value });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, [field]: value } : o));
      toast.success('Order updated');
    } catch { toast.error('Failed to update order'); }
  };

  return (
    <Layout title="Orders">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {['', ...ORDER_STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-[10px] tracking-widest uppercase font-sans px-4 py-2 border transition-all ${filter === s ? 'bg-charcoal text-white border-charcoal' : 'border-gray-200 text-gray-500 hover:border-charcoal'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 font-sans">{total} orders</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <p className="text-center py-16 text-gray-400 font-serif text-xl">No orders found</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order', 'Customer', 'Items', 'Amount', 'Payment', 'Order Status', 'Payment Status'].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-[0.15em] uppercase text-gray-400 font-sans px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-xs font-sans font-medium text-charcoal">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-[10px] font-sans text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs font-sans text-charcoal">{order.userId?.name || 'Guest'}</p>
                    <p className="text-[10px] font-sans text-gray-400">{order.userId?.email || ''}</p>
                  </td>
                  <td className="px-5 py-4 text-xs font-sans text-gray-500">{order.items?.length || 0} items</td>
                  <td className="px-5 py-4 text-sm font-sans font-medium text-charcoal">₹{order.totalAmount?.toLocaleString()}</td>
                  <td className="px-5 py-4 text-xs font-sans capitalize text-gray-500">{order.paymentMethod}</td>
                  <td className="px-5 py-4">
                    <select value={order.orderStatus} onChange={e => updateStatus(order._id, 'orderStatus', e.target.value)}
                      className={`text-[10px] tracking-wider uppercase font-sans font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[order.orderStatus]}`}>
                      {ORDER_STATUSES.map(s => <option key={s} value={s} className="normal-case bg-white text-charcoal">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <select value={order.paymentStatus} onChange={e => updateStatus(order._id, 'paymentStatus', e.target.value)}
                      className="text-[10px] tracking-wider uppercase font-sans border border-gray-200 px-2 py-1 focus:outline-none focus:border-gold-500 cursor-pointer">
                      {['pending', 'paid', 'failed'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

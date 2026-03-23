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
  const [expandedId, setExpandedId] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [printOrder, setPrintOrder] = useState(null);

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

  const handleUpdateLogistics = async (id) => {
    try {
      const cValue = document.getElementById(`carrier-${id}`).value;
      const tValue = document.getElementById(`tracking-${id}`).value;
      await API.put(`/orders/${id}/status`, { carrierName: cValue, trackingId: tValue });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, carrierName: cValue, trackingId: tValue } : o));
      toast.success('Logistics Updated');
    } catch { toast.error('Failed to update logistics'); }
  };

  const handleBulkAction = async (field, value) => {
    try {
      setLoading(true);
      await Promise.all(selectedOrders.map(id => API.put(`/orders/${id}/status`, { [field]: value })));
      toast.success(`${selectedOrders.length} orders updated`);
      setSelectedOrders([]);
      load();
    } catch { toast.error('Bulk update failed'); setLoading(false); }
  };

  return (
    <Layout title="Orders">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-white p-3 rounded shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          {['', ...ORDER_STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-[10px] tracking-widest uppercase font-sans px-3 py-1.5 border transition-all rounded-sm ${filter === s ? 'bg-charcoal text-white border-charcoal' : 'border-gray-100 text-gray-400 hover:border-charcoal'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {selectedOrders.length > 0 && (
           <div className="flex items-center gap-2 bg-gold-50/50 px-3 py-1.5 rounded border border-gold-100 animate-fadeIn">
              <span className="text-[10px] font-sans text-gold-700 font-bold">{selectedOrders.length} selected</span>
              <select onChange={e => handleBulkAction('orderStatus', e.target.value)} className="text-[10px] border border-gold-200 px-1.5 py-1 focus:outline-none focus:border-gold-500 rounded-sm bg-white cursor-pointer">
                  <option value="">— Bulk Status —</option>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => setSelectedOrders([])} className="text-xs text-gray-400 hover:text-red-500">×</button>
           </div>
        )}
        <p className="text-xs text-gray-400 font-sans">{total} total</p>
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
                <th className="px-5 py-3 w-10">
                   <input type="checkbox" checked={selectedOrders.length === orders.length && orders.length > 0} onChange={() => setSelectedOrders(selectedOrders.length === orders.length ? [] : orders.map(o => o._id))} className="accent-gold-600 rounded-sm" />
                </th>
                {['Order', 'Customer', 'Items', 'Amount', 'Payment', 'Order Status', 'Payment Status'].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-[0.15em] uppercase text-gray-400 font-sans px-3 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.flatMap(order => {
                const isExpanded = expandedId === order._id;
                return [
                    <tr key={order._id} 
                      onClick={() => setExpandedId(isExpanded ? null : order._id)}
                      className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50/50' : ''}`}>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                         <input type="checkbox" checked={selectedOrders.includes(order._id)} onChange={() => setSelectedOrders(prev => prev.includes(order._id) ? prev.filter(id => id !== order._id) : [...prev, order._id])} className="accent-gold-600 rounded-sm" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                          <div>
                            <p className="text-xs font-sans font-medium text-charcoal">#{order._id.slice(-8).toUpperCase()}</p>
                            <p className="text-[10px] font-sans text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                          </div>
                        </div>
                      </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-sans text-charcoal">{order.userId?.name || 'Guest'}</p>
                      <p className="text-[10px] font-sans text-gray-400">{order.userId?.email || ''}</p>
                    </td>
                    <td className="px-5 py-4 text-xs font-sans text-gray-500">{order.items?.length || 0} items</td>
                    <td className="px-5 py-4 text-sm font-sans font-medium text-charcoal">₹{order.totalAmount?.toLocaleString()}</td>
                    <td className="px-5 py-4 text-xs font-sans capitalize text-gray-500">{order.paymentMethod}</td>
                    <td className="px-5 py-4">
                      <select value={order.orderStatus} 
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateStatus(order._id, 'orderStatus', e.target.value)}
                        className={`text-[10px] tracking-wider uppercase font-sans font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[order.orderStatus]}`}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s} className="normal-case bg-white text-charcoal">{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <select value={order.paymentStatus} 
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateStatus(order._id, 'paymentStatus', e.target.value)}
                        className="text-[10px] tracking-wider uppercase font-sans border border-gray-200 px-2 py-1 focus:outline-none focus:border-gold-500 cursor-pointer">
                        {['pending', 'paid', 'failed'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>,
                  isExpanded && (
                    <tr key={`${order._id}-expanded`} className="bg-gray-50/50">
                      <td colSpan="7" className="px-8 py-5 border-b border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-sm">
                          {/* Left: Product List */}
                          <div className="md:col-span-7 space-y-4">
                            <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8b7fc0] mb-3 border-b pb-1">Ordered Items</h4>
                            <div className="space-y-3">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-white p-3 border border-gray-100 rounded-lg">
                                  {item.image && (
                                    <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-sm border" />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-charcoal">{item.name}</p>
                                    <div className="flex gap-4 text-[10px] text-gray-400 mt-1">
                                      {item.size && <span>Size: {item.size}</span>}
                                      {item.color && <span>Color: {item.color}</span>}
                                      <span>Qty: {item.quantity}</span>
                                    </div>
                                  </div>
                                  <p className="text-xs font-medium">₹{item.price?.toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: Shipping Address */}
                          <div className="md:col-span-5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3 border-b pb-1">
                                 <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8b7fc0]">Customer & Shipping Location</h4>
                                 <button onClick={(e) => { e.stopPropagation(); setPrintOrder(order); }} className="text-[10px] font-sans text-gold-600 hover:underline flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3H9v3a2 2 0 002 2zm0-14h10a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v3a2 2 0 002 2z" /></svg>
                                    Invoice
                                 </button>
                              </div>
                            {order.address ? (
                              <div className="bg-white p-4 border border-gray-100 rounded-lg space-y-2">
                                <p className="text-xs font-bold text-gray-900">{order.address.fullName}</p>
                                <p className="text-xs text-gray-600">{order.address.addressLine}</p>
                                <p className="text-xs text-gray-600">{order.address.city}, {order.address.postalCode}</p>
                                <p className="text-xs text-gray-600">{order.address.country}</p>
                                <div className="pt-2 border-t border-gray-50 mt-2 flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400 font-bold">CONTACT:</span>
                                  <span className="text-xs font-medium text-charcoal">{order.address.phone}</span>
                                </div>
                              </div>
                             ) : (
                              <p className="text-xs text-gray-400 italic">No delivery address provided</p>
                            )}

                            {/* Tracking updates */}
                            <div className="mt-4 border-t border-gray-100 pt-3 space-y-2">
                                <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8b7fc0]">Logistics & Tracking</h4>
                                <div className="flex gap-2 text-xs">
                                     <input id={`carrier-${order._id}`} type="text" placeholder="Carrier (e.g. DHL)" defaultValue={order.carrierName} className="border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gold-500 font-sans text-[11px] flex-1" />
                                     <input id={`tracking-${order._id}`} type="text" placeholder="Tracking ID" defaultValue={order.trackingId} className="border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gold-500 font-sans text-[11px] flex-1" />
                                     <button type="button" onClick={() => handleUpdateLogistics(order._id)} className="bg-gold-600 hover:bg-gold-700 text-white font-sans font-bold text-[10px] px-3 py-1.5 rounded shadow-sm transition-colors cursor-pointer">Update</button>
                                </div>
                            </div>
                            </div>
                           </div>
                          </div>
                      </td>
                    </tr>
                  )
                ];
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Printable Invoice View */}
      {printOrder && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative" id="invoice">
               <button onClick={() => setPrintOrder(null)} className="absolute top-4 right-4 text-xl text-gray-400 hover:text-charcoal print:hidden">×</button>
               <button onClick={() => window.print()} className="absolute top-4 right-12 text-[10px] bg-charcoal text-white px-2 py-1 rounded font-sans uppercase tracking-wider print:hidden">Print</button>
               
               <div id="invoice-print-area" className="p-4">
                   <div className="flex justify-between items-start border-b pb-4 mb-4">
                       <div>
                          <h2 className="font-serif text-2xl text-charcoal">AARA</h2>
                          <p className="text-[10px] text-gray-500 font-sans">Designer Studio</p>
                       </div>
                       <div className="text-right font-sans text-xs text-gray-500">
                          <p className="font-bold text-charcoal">Invoice #{printOrder._id.slice(-6).toUpperCase()}</p>
                          <p>{new Date(printOrder.createdAt).toLocaleDateString()}</p>
                       </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-6">
                       <div>
                           <p className="font-bold text-gray-400 text-[10px] uppercase">Bill To:</p>
                           <p className="font-medium">{printOrder.address?.fullName || printOrder.userId?.name || 'Customer'}</p>
                           <p className="text-gray-500">{printOrder.address?.addressLine}</p>
                           <p className="text-gray-500">{printOrder.address?.city}</p>
                       </div>
                       <div className="text-right">
                           <p className="font-bold text-gray-400 text-[10px] uppercase">Payment:</p>
                           <p className="capitalize">{printOrder.paymentMethod}</p>
                           <p className="capitalize text-gray-500">Status: {printOrder.paymentStatus}</p>
                       </div>
                   </div>

                   <table className="w-full text-xs font-sans border-b border-gray-100">
                       <thead className="bg-gray-50 text-gray-500">
                           <tr>
                               <th className="text-left p-2">Item</th>
                               <th className="text-center p-2">Qty</th>
                               <th className="text-right p-2">Price</th>
                           </tr>
                       </thead>
                       <tbody>
                           {printOrder.items?.map((item, i) => (
                               <tr key={i} className="border-b border-gray-50 last:border-none">
                                   <td className="p-2 font-medium">{item.name} {item.size ? `(${item.size})` : ''}</td>
                                   <td className="p-2 text-center">{item.quantity}</td>
                                   <td className="p-2 text-right">₹{item.price?.toLocaleString()}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>

                   <div className="text-right font-sans mt-4 text-sm">
                        <p className="text-gray-500">Subtotal: <span className="text-charcoal font-medium">₹{printOrder.totalAmount?.toLocaleString()}</span></p>
                        <p className="font-bold text-base text-gold-600 mt-1">Total: ₹{printOrder.totalAmount?.toLocaleString()}</p>
                   </div>
               </div>
            </div>
            <style>{`
               @media print {
                   body * { visibility: hidden !important; }
                   #invoice, #invoice * { visibility: visible !important; }
                   #invoice { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; border: none !important; box-shadow: none !important; z-index: 9999 !important; background: white !important; }
                   .print\\:hidden { display: none !important; }
               }
            `}</style>
         </div>
      )}
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import API, { BACKEND_URL, getFullUrl } from '../api';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ConfirmModal from '../components/ConfirmModal';

const ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'returned', 'cancelled'];
const FILTER_TABS = ['', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'];
const statusColors = {
  processing: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  returned: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800'
};

export default function Orders() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get('status');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialStatus === 'pending,processing' ? 'processing' : '');

  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [printOrder, setPrintOrder] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pending update for confirmation
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [pendingBulkUpdate, setPendingBulkUpdate] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      let statusParam = '';
      if (filter) {
        statusParam = `&status=${filter}`;
      }
      
      let searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      
      const res = await API.get(`/orders/all?page=${page}&limit=${limit}${statusParam}${searchParam}`);
      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load orders'); }
    setLoading(false);
  };

  useEffect(() => { 
    const debounceTimer = setTimeout(() => {
      load(); 
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [filter, page, limit, searchQuery]);

  const updateStatus = (id, field, value) => {
    // Just open modal, don't update yet
    setPendingUpdate({ id, field, value });
  };

  const [adminCancelReason, setAdminCancelReason] = useState('');

  const handleConfirmUpdate = async () => {
    if (!pendingUpdate) return;
    const { id, field, value } = pendingUpdate;
    if (value === 'cancelled' && !adminCancelReason.trim()) {
        toast.error("Please provide a reason for cancellation");
        return;
    }
    try {
      const payload = { [field]: value };
      if (value === 'cancelled') payload.cancellationReason = adminCancelReason;
      
      const res = await API.put(`/orders/${id}/status`, payload);
      if (res.data.success && res.data.order) {
        setOrders(prev => prev.map(o => o._id === id ? { ...o, ...res.data.order } : o));
      } else {
        setOrders(prev => prev.map(o => o._id === id ? { ...o, [field]: value, cancellationReason: value === 'cancelled' ? adminCancelReason : o.cancellationReason, cancelledBy: value === 'cancelled' ? 'admin' : o.cancelledBy } : o));
      }
      toast.success('Order status updated successfully');
    } catch { 
      toast.error('Failed to update order'); 
    } finally {
      setPendingUpdate(null);
      setAdminCancelReason('');
    }
  };

  const handleUpdateLogistics = async (id) => {
    try {
      const cValue = document.getElementById(`carrier-${id}`).value;
      const tValue = document.getElementById(`tracking-${id}`).value;
      const res = await API.put(`/orders/${id}/status`, { carrierName: cValue, trackingId: tValue });
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === id ? { ...o, ...res.data.order } : o));
        toast.success('Logistics & Status Updated');
      }
    } catch { toast.error('Failed to update logistics'); }
  };

  const handleBulkAction = (field, value) => {
    if (!value || selectedOrders.length === 0) return;
    setPendingBulkUpdate({ field, value });
  };

  const confirmBulkAction = async () => {
    const { field, value } = pendingBulkUpdate;
    try {
      setLoading(true);
      await Promise.all(selectedOrders.map(id => API.put(`/orders/${id}/status`, { [field]: value })));
      toast.success(`${selectedOrders.length} orders updated`);
      setSelectedOrders([]);
      load();
    } catch { 
      toast.error('Bulk update failed'); 
    } finally {
      setLoading(false);
      setPendingBulkUpdate(null);
    }
  };

  const fetchReportData = async () => {
    try {
      const dateQuery = (startDate && endDate) ? `&startDate=${startDate}T00:00:00Z&endDate=${endDate}T23:59:59Z` : '';
      const statusQuery = filter ? `&status=${filter}` : '';
      const res = await API.get(`/orders/all?limit=1000${statusQuery}${dateQuery}`);
      return res.data.orders || [];
    } catch (err) {
      toast.error('Failed to fetch full order data for export');
      return null;
    }
  };

  const exportToExcel = async () => {
    setDownloading(true);
    const data = await fetchReportData();
    if (!data) { setDownloading(false); return; }

    const wb = XLSX.utils.book_new();
    const orderData = data.map(o => ({
      'Order ID': o._id.toUpperCase(),
      Date: new Date(o.createdAt).toLocaleString(),
      'Customer Name': o.address?.fullName || o.userId?.name || 'Guest',
      'Mail ID': o.address?.email || o.userId?.email || o.guestEmail || 'N/A',
      Items: o.items?.length || 0,
      'Total Amount': `${o.currency === 'USD' ? '$' : '₹'}${o.totalAmount}`,
      Tax: `${o.taxName || 'Tax'} (${o.taxPercentage || 0}%) - ${o.currency === 'USD' ? '$' : '₹'}${o.taxAmount || 0}`,
      'Payment Method': o.paymentMethod,
      'Payment Status': o.paymentStatus,
      'Order Status': o.orderStatus
    }));

    const ws = XLSX.utils.json_to_sheet(orderData);
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    
    const fileName = (startDate && endDate) ? `Orders_Report_${startDate}_to_${endDate}.xlsx` : `Orders_Report_Full.xlsx`;
    XLSX.writeFile(wb, fileName);
    setDownloading(false);
  };

  const exportToPDF = async () => {
    setDownloading(true);
    const data = await fetchReportData();
    if (!data) { setDownloading(false); return; }

    const doc = new jsPDF('landscape');
    const reportTitle = (startDate && endDate) ? `(${startDate} to ${endDate})` : '(Full)';
    
    doc.setFontSize(14);
    doc.text(`Orders Report ${reportTitle}`, 14, 15);
    
    autoTable(doc, {
      startY: 20,
      head: [['ID', 'Date', 'Customer Name', 'Mail ID', 'Items', 'Total', 'Payment', 'Status']],
      body: data.map(o => [
        `#${o._id.slice(-8).toUpperCase()}`,
        new Date(o.createdAt).toLocaleDateString(),
        o.address?.fullName || o.userId?.name || 'Guest',
        o.address?.email || o.userId?.email || o.guestEmail || 'N/A',
        o.items?.length || 0,
        `${o.currency === 'USD' ? '$' : 'INR '}${o.totalAmount}`,
        `${o.paymentMethod} (${o.paymentStatus})`,
        o.orderStatus
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 127, 192] },
      styles: { fontSize: 7 }
    });

    const fileName = (startDate && endDate) ? `Orders_Report_${startDate}_to_${endDate}.pdf` : `Orders_Report_Full.pdf`;
    doc.save(fileName);
    setDownloading(false);
  };

  return (
    <Layout title="Orders">
      <div className="flex flex-col gap-4 mb-6 bg-white p-3 rounded shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
           {/* Tabs and Total Count on Line 1 */}
           <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/50 p-1 rounded-xl border border-gray-100">
             {FILTER_TABS.map(s => (
               <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                 className={`text-[10px] tracking-widest uppercase font-sans px-4 py-2 transition-all rounded-lg font-bold ${filter === s ? 'bg-white text-charcoal shadow-md border border-gray-100 scale-105' : 'text-gray-400 hover:text-charcoal hover:bg-gray-100/50'}`}>
                 {s || 'All'}
               </button>
             ))}
           </div>
           
           <div className="flex items-center gap-2 px-3 py-2 bg-charcoal/5 rounded-lg border border-charcoal/5 ml-auto md:ml-0">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse"></span>
              <p className="text-[10px] text-charcoal/60 font-sans font-bold uppercase tracking-widest">{total} total orders</p>
           </div>
        </div>

        {/* Search Bar */}
        <div className="flex bg-gray-50 border border-gray-100 rounded-lg p-2 mt-4 items-center">
           <svg className="w-4 h-4 text-gray-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           <input 
              type="text" 
              placeholder="Search by Order ID, Email, Name, or Phone..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="bg-transparent w-full focus:outline-none text-sm text-charcoal font-sans"
           />
           {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setPage(1); }} className="text-gray-400 hover:text-red-500 mx-2 text-lg">×</button>
           )}
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-3 border-t border-gray-50 mt-4">
           {/* Bulk Actions */}
           <div className="flex-1">
              {selectedOrders.length > 0 && (
                 <div className="flex items-center gap-2 bg-gold-50/50 px-3 py-2 rounded border border-gold-100 animate-fadeIn">
                    <span className="text-[10px] font-sans text-gold-700 font-bold">{selectedOrders.length} selected</span>
                    <select onChange={e => handleBulkAction('orderStatus', e.target.value)} className="text-[10px] border border-gold-200 px-2 py-1.5 focus:outline-none focus:border-gold-500 rounded-sm bg-white cursor-pointer uppercase tracking-wider font-bold">
                        <option value="">— Bulk Status —</option>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setSelectedOrders([])} className="ml-1 text-xs text-gray-400 hover:text-red-500 transition-colors">×</button>
                 </div>
              )}
           </div>

           <div className="flex flex-wrap items-center gap-3 justify-end">
                <div className="flex items-center group flex-1">
                    <span className="text-[9px] text-gray-500 font-bold px-2 sm:px-3 text-center min-w-[45px]">FROM</span>
                    <input
                       type="date"
                       value={startDate}
                       onChange={e => setStartDate(e.target.value)}
                       className="text-[11px] px-2 py-2.5 sm:py-1.5 focus:outline-none text-gray-600 flex-1 sm:flex-none border-l sm:border-l-0"
                       title="From Date"
                    />
                </div>
                <div className="flex items-center group flex-1">
                    <span className="text-[9px] text-gray-500 font-bold px-2 sm:px-3 text-center min-w-[45px]">TO</span>
                    <input
                       type="date"
                       value={endDate}
                       onChange={e => setEndDate(e.target.value)}
                       className="text-[11px] px-2 py-2.5 sm:py-1.5 focus:outline-none text-gray-600 flex-1 sm:flex-none border-l sm:border-l-0"
                       title="To Date"
                    />
                </div>
                {(startDate || endDate) && (
                    <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] text-gold-600 hover:bg-gold-50 px-3 py-2 sm:py-0 font-bold uppercase tracking-tighter border-t sm:border-t-0 sm:border-l border-gray-100">
                        Clear
                    </button>
                )}
            </div>

            <div className="flex border border-gray-200 rounded divide-x divide-gray-200 bg-white">
                <button disabled={downloading} onClick={exportToExcel} className="hover:bg-green-50 text-green-700 px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold transition-colors disabled:opacity-50">
                  {downloading ? 'WAIT' : 'EXCEL'}
                </button>
                <button disabled={downloading} onClick={exportToPDF} className="hover:bg-red-50 text-red-700 px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold transition-colors disabled:opacity-50">
                   {downloading ? 'WAIT' : 'PDF'}
                </button>
            </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <p className="text-center py-16 text-gray-400 font-serif text-xl">No orders found</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 w-10">
                   <input type="checkbox" checked={selectedOrders.length === orders.length && orders.length > 0} onChange={() => setSelectedOrders(selectedOrders.length === orders.length ? [] : orders.map(o => o._id))} className="accent-gold-600 rounded-sm" />
                </th>
                {['Order', 'Customer', 'Items', 'Amount', 'Payment', 'Order Status', 'Payment Status'].map(h => (
                  <th key={h} className="text-left text-xs tracking-[0.15em] uppercase text-gray-400 font-sans px-3 py-3 whitespace-nowrap">{h}</th>
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
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                          <div>
                            <div className="flex items-center gap-2">
                               <p className="text-xs font-sans font-medium text-charcoal">#{order._id.slice(-8).toUpperCase()}</p>
                               {order.returnRequested && <span className="text-[8px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded shadow-sm">⚠️ RETURN</span>}
                            </div>
                            <p className="text-[10px] font-sans text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</p>
                          </div>
                        </div>
                      </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-sans font-medium text-charcoal">{order.address?.fullName || order.userId?.name || 'Guest User'}</p>
                          {order.isGuest && (
                            <span className="text-[8px] bg-charcoal text-white px-1 py-0.5 rounded-sm font-bold uppercase tracking-widest">Guest</span>
                          )}
                        </div>
                        <p className="text-[10px] font-sans text-gray-400">{order.address?.email || order.userId?.email || order.guestEmail || ''}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-sans text-gray-500 whitespace-nowrap">{order.items?.length || 0} items</td>
                    <td className="px-5 py-4 text-sm font-sans font-medium text-charcoal whitespace-nowrap">{order.currency === 'USD' ? '$' : '₹'}{order.totalAmount?.toLocaleString()}</td>
                    <td className="px-5 py-4 text-xs font-sans capitalize text-gray-500 whitespace-nowrap">{order.paymentMethod}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <select value={order.orderStatus} 
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateStatus(order._id, 'orderStatus', e.target.value)}
                        className={`text-[10px] tracking-wider uppercase font-sans font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[order.orderStatus]}`}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s} className="normal-case bg-white text-charcoal">{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <select value={order.paymentStatus} 
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateStatus(order._id, 'paymentStatus', e.target.value)}
                        className="text-[10px] tracking-wider uppercase font-sans border border-gray-200 px-2 py-1 focus:outline-none focus:border-gold-500 cursor-pointer">
                        {['pending', 'paid', 'failed', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
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
                                    <img 
                                      src={getFullUrl(item.image)} 
                                      alt={item.name} 
                                      className="w-12 h-14 object-cover rounded-sm border" 
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-charcoal">{item.name}</p>
                                    <div className="flex gap-4 text-[10px] text-gray-400 mt-1">
                                      {item.size && <span>Size: {item.size}</span>}
                                      {item.color && <span>Color: {item.color}</span>}
                                      <span>Qty: {item.quantity}</span>
                                    </div>
                                  </div>
                                  <p className="text-xs font-medium">{order.currency === 'USD' ? '$' : '₹'}{item.price?.toLocaleString()}</p>
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
                                <p className="text-xs text-gray-600">{order.address.addressLine1}</p>
                                {order.address.addressLine2 && <p className="text-xs text-gray-600">{order.address.addressLine2}</p>}
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

                            {/* Return Request View */}
                            {order.returnRequested && (
                               <div className="mt-4 border-t border-red-100 pt-3 space-y-2 bg-red-50/30 p-3 rounded-lg border">
                                  <div className="flex items-center justify-between">
                                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-red-600 flex items-center gap-1">⚠️ Return Request</h4>
                                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-widest ${order.returnStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.returnStatus === 'approved' ? 'bg-blue-100 text-blue-700' : order.returnStatus === 'received' ? 'bg-green-100 text-green-700' : order.returnStatus === 'refunded' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>{order.returnStatus}</span>
                                  </div>
                                  <div className="bg-white p-3 border border-red-50 rounded text-xs text-gray-700 font-sans shadow-sm">
                                      <span className="font-bold block mb-1">Reason:</span>
                                      <p className="italic">{order.returnReason}</p>
                                  </div>
                                  
                                  {order.returnImages && order.returnImages.length > 0 && (
                                     <div className="mt-2">
                                        <span className="font-bold text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Attached Evidence:</span>
                                         <div className="flex gap-2.5 overflow-x-auto pb-1">
                                            {order.returnImages.map((img, idx) => {
                                              const fullUrl = getFullUrl(img);
                                              return (
                                                <div key={idx} className="group relative w-20 h-20 cursor-pointer overflow-hidden rounded-md border border-gray-200 hover:border-red-400 transition-all shadow-sm"
                                                  onClick={() => window.open(fullUrl, '_blank')}
                                                  title="Click to view full size">
                                                  <img 
                                                    src={fullUrl} 
                                                    alt="evidence" 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                                  />
                                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                      </svg>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                         </div>
                                     </div>
                                  )}

                                  {order.returnStatus === 'pending' && (
                                     <div className="flex gap-3 mt-3 pt-3 border-t border-red-50">
                                        <button onClick={() => updateStatus(order._id, 'returnStatus', 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 rounded transition-colors">Approve Return</button>
                                        <button onClick={() => updateStatus(order._id, 'returnStatus', 'rejected')} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-[10px] uppercase tracking-wider py-1.5 rounded transition-colors">Reject Request</button>
                                     </div>
                                  )}
                                  
                                  {order.returnStatus === 'approved' && (
                                     <div className="mt-3 pt-3 border-t border-red-50">
                                         <button onClick={() => updateStatus(order._id, 'returnStatus', 'received')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 rounded transition-colors">Mark Item Received</button>
                                     </div>
                                  )}

                                  {order.returnStatus === 'received' && (
                                     <div className="mt-3 pt-3 border-t border-red-50">
                                         <button onClick={() => updateStatus(order._id, 'returnStatus', 'refunded')} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 rounded transition-colors">Process Refund</button>
                                     </div>
                                  )}
                               </div>
                            )}

                            {/* Cancellation Details */}
                            {order.orderStatus === 'cancelled' && (
                               <div className="mt-4 border-t border-red-100 pt-3 space-y-2 bg-red-50/20 p-3 rounded-lg border">
                                   <div className="flex items-center justify-between">
                                       <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-red-600 flex items-center gap-1">🚫 Order Cancelled</h4>
                                       <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-widest bg-red-100 text-red-700">By {order.cancelledBy || 'User'}</span>
                                   </div>
                                   <div className="bg-white p-3 border border-red-50 rounded text-xs text-gray-700 font-sans shadow-sm">
                                       <span className="font-bold block mb-1">Reason for Cancellation:</span>
                                       <p className="italic">{order.cancellationReason || 'No reason provided'}</p>
                                   </div>
                               </div>
                            )}
                           </div>
                          </div>
                      </td>
                    </tr>
                  )
                ];
              })}
            </tbody>
          </table>
          </div>
        )}
        
        {/* Pagination Footer */}
        {!loading && orders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-6 py-4 border-t border-gray-50 bg-white font-sans">
              <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span>Rows per page:</span>
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

      {/* Printable Invoice View */}
      {printOrder && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded max-w-2xl w-full relative my-8 shadow-2xl overflow-hidden" id="invoice">
               {/* Fixed Action Bar - Hidden during print */}
               <div className="flex items-center justify-between px-6 py-3 bg-gray-50/80 border-b border-gray-100 print:hidden">
                   <button onClick={() => window.print()} className="text-[10px] bg-charcoal text-white px-4 py-2 rounded font-sans uppercase tracking-widest shadow-sm hover:bg-gray-800 transition-all active:scale-95">Print Invoice</button>
                   <button onClick={() => setPrintOrder(null)} className="text-2xl text-gray-400 hover:text-charcoal transition-colors leading-none">×</button>
               </div>
               
               <div id="invoice-print-area" className="p-6 pt-4">
                   {/* Header */}
                   <div className="flex justify-between items-start border-b pb-3 mb-3">
                       <div>
                          <h2 className="font-serif text-2xl text-charcoal tracking-tight leading-none">THAARAI</h2>
                          <p className="text-[9px] text-gray-400 font-sans uppercase tracking-[0.2em] mt-0.5">Designer Studio</p>
                       </div>
                       <div className="text-right font-sans text-xs">
                          <p className="font-bold text-charcoal uppercase tracking-widest">Invoice #{printOrder._id.slice(-6).toUpperCase()}</p>
                          <p className="text-gray-500 mt-1">{new Date(printOrder.createdAt).toLocaleDateString()}</p>
                       </div>
                   </div>

                   {/* Info Grid */}
                   <div className="grid grid-cols-2 gap-6 text-xs font-sans mb-5">
                       <div>
                           <p className="font-bold text-gray-400 text-[8px] uppercase tracking-widest mb-1.5 border-b pb-0.5">Bill To:</p>
                           <p className="font-bold text-charcoal text-xs">{printOrder.address?.fullName || printOrder.userId?.name || 'Customer'}</p>
                           <div className="text-gray-500 mt-0.5 leading-tight text-[11px]">
                               <p>{printOrder.address?.addressLine1}</p>
                               {printOrder.address?.addressLine2 && <p>{printOrder.address?.addressLine2}</p>}
                               <p>{printOrder.address?.city}, {printOrder.address?.postalCode}</p>
                               <p>{printOrder.address?.country}</p>
                           </div>
                       </div>
                       <div className="text-right">
                           <p className="font-bold text-gray-400 text-[8px] uppercase tracking-widest mb-1.5 border-b pb-0.5">Billing Details:</p>
                           <p className="text-charcoal font-medium">Payment: <span className="capitalize">{printOrder.paymentMethod}</span></p>
                           <p className="text-gray-500 mt-0.5 text-[11px]">Status: <span className="capitalize">{printOrder.paymentStatus}</span></p>
                           <p className="text-gray-500 text-[11px]">Order: <span className="capitalize">{printOrder.orderStatus}</span></p>
                       </div>
                   </div>

                   {/* Item Table */}
                   <table className="w-full text-xs font-sans border-t border-gray-100">
                       <thead className="bg-gray-50/50 text-gray-400">
                           <tr>
                               <th className="text-left font-bold uppercase tracking-widest text-[8px] p-2">Item Description</th>
                               <th className="text-center font-bold uppercase tracking-widest text-[8px] p-2 w-16">Qty</th>
                               <th className="text-right font-bold uppercase tracking-widest text-[8px] p-2 w-28">Amount</th>
                           </tr>
                       </thead>
                       <tbody>
                           {printOrder.items?.map((item, i) => (
                               <tr key={i} className="border-b border-gray-50 last:border-none">
                                   <td className="p-2">
                                       <p className="font-bold text-charcoal text-[11px]">{item.name}</p>
                                       {(item.size || item.color) && (
                                           <p className="text-[10px] text-gray-400">
                                               {item.size && <span>Size: {item.size}</span>}
                                               {item.size && item.color && <span className="mx-1">|</span>}
                                               {item.color && <span>Color: {item.color}</span>}
                                           </p>
                                       )}
                                   </td>
                                   <td className="p-2 text-center text-gray-600">{item.quantity}</td>
                                   <td className="p-2 text-right font-medium text-charcoal">{printOrder.currency === 'USD' ? '$' : '₹'}{item.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>

                   {/* Orderly Summary Column */}
                   <div className="flex justify-end mt-3 pt-3 border-t border-double border-gray-200">
                       <table className="w-full md:w-3/5 text-[11px] font-sans">
                           <tbody className="divide-y divide-gray-50">
                               <tr className="text-gray-500">
                                   <td className="py-1 px-2 text-right font-medium">Subtotal</td>
                                   <td className="py-1 px-2 text-right w-28 text-charcoal font-semibold">
                                       {printOrder.currency === 'USD' ? '$' : '₹'}{(printOrder.subtotal || (printOrder.totalAmount - (printOrder.shippingAmount || 0) - (printOrder.taxAmount || 0) + (printOrder.discountAmount || 0)))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                   </td>
                               </tr>
                               {printOrder.shippingAmount > 0 && (
                                   <tr className="text-gray-500">
                                       <td className="py-1 px-2 text-right font-medium">Shipping & Handling</td>
                                       <td className="py-1 px-2 text-right text-charcoal font-semibold">
                                           {printOrder.currency === 'USD' ? '$' : '₹'}{printOrder.shippingAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                       </td>
                                   </tr>
                               )}
                               {(printOrder.taxAmount > 0 || printOrder.taxPercentage > 0) && (
                                   <tr className="text-gray-500">
                                       <td className="py-1 px-2 text-right font-medium">{printOrder.taxName || 'Sales Tax'} ({printOrder.taxPercentage || 0}%){Math.abs(((printOrder.subtotal || 0) + (printOrder.shippingAmount || 0) - (printOrder.discountAmount || 0)) - (printOrder.totalAmount || 0)) < 0.01 ? ' (Included)' : ''}</td>
                                       <td className="py-1 px-2 text-right text-charcoal font-semibold">
                                           {printOrder.currency === 'USD' ? '$' : '₹'}{printOrder.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                       </td>
                                   </tr>
                               )}
                               {printOrder.discountAmount > 0 && (
                                   <tr className="text-green-600 bg-green-50/30">
                                       <td className="py-1 px-2 text-right font-medium italic">Discount Applied</td>
                                       <td className="py-1 px-2 text-right font-bold">
                                           -{printOrder.currency === 'USD' ? '$' : '₹'}{printOrder.discountAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                       </td>
                                   </tr>
                               )}
                               <tr className="">
                                   <td className="py-2 px-2 text-right font-bold text-gray-900 border-t-2 border-charcoal uppercase tracking-[0.2em] text-[10px]">Grand Total</td>
                                   <td className="py-2 px-2 text-right font-bold text-base text-gold-600 border-t-2 border-charcoal">
                                       {printOrder.currency === 'USD' ? '$' : '₹'}{printOrder.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                   </td>
                               </tr>
                           </tbody>
                       </table>
                   </div>

                   {/* Footer Branding */}
                   <div className="mt-6 text-center border-t pt-4">
                       <p className="text-[9px] text-gray-600 font-sans italic">Thank you for traveling with Thaarai.</p>
                   </div>
               </div>
            </div>
            <style>{`
               @media print {
                   body * { visibility: hidden !important; }
                   #invoice, #invoice * { visibility: visible !important; }
                   #invoice { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; border: none !important; box-shadow: none !important; z-index: 9999 !important; background: white !important; padding: 0 !important; margin: 0 !important; }
                   .print\\:hidden { display: none !important; }
                   @page { margin: 1cm; }
               }
            `}</style>
         </div>
      )}
      {/* Confirmation Modal for Status Change */}
      <ConfirmModal
        isOpen={!!pendingUpdate}
        title="Confirm Status Change"
        message={`Are you sure you want to change the ${pendingUpdate?.field === 'orderStatus' ? 'Order' : 'Payment'} status to ${pendingUpdate?.value?.toUpperCase()}?`}
        onConfirm={handleConfirmUpdate}
        onCancel={() => { setPendingUpdate(null); setAdminCancelReason(''); }}
        type="warning"
        showInput={pendingUpdate?.value === 'cancelled'}
        inputPlaceholder="Reason for cancellation..."
        inputValue={adminCancelReason}
        onInputChange={setAdminCancelReason}
      />
      <ConfirmModal
        isOpen={!!pendingBulkUpdate}
        title="Confirm Bulk Update"
        message={`Are you sure you want to update ${selectedOrders.length} orders to ${pendingBulkUpdate?.value?.toUpperCase()}?`}
        onConfirm={confirmBulkAction}
        onCancel={() => setPendingBulkUpdate(null)}
        type="warning"
      />
    </Layout>
  );
}

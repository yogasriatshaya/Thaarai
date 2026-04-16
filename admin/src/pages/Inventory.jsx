import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../api';
import { toast } from 'react-toastify';
import { Package, ArrowUpRight, ArrowDownRight, RefreshCw, Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ConfirmModal from '../components/ConfirmModal';

export default function Inventory() {
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [soldStats, setSoldStats] = useState({});
  const [variantSoldStats, setVariantSoldStats] = useState({});
  const [adjustQty, setAdjustQty] = useState({});
  const [adjustReason, setAdjustReason] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Pagination State
  const [productPage, setProductPage] = useState(1);
  const [productLimit, setProductLimit] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showLowStock, setShowLowStock] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('filter') === 'low-stock' || params.get('view') === 'low_stock') {
      setShowLowStock(true);
    }
  }, [location]);

  const [logPage, setLogPage] = useState(1);
  const [logLimit, setLogLimit] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalRemoved, setTotalRemoved] = useState(0);
  const [reportDateRange, setReportDateRange] = useState('');

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, productPage, productLimit, logPage, logLimit, showLowStock]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const stockFilter = showLowStock ? '&stock_lte=10' : '';
      const prodRes = await API.get(`/products?limit=${productLimit}&page=${productPage}${search ? `&search=${search}` : ''}${stockFilter}`);
      
      let logQuery = `limit=${logLimit}&page=${logPage}`;
      if (startDate && endDate) {
         logQuery += `&startDate=${startDate}&endDate=${endDate}`;
         setReportDateRange(`${startDate} to ${endDate}`);
      } else {
         setReportDateRange('All Time');
      }
      
      const logRes = await API.get(`/inventory/logs?${logQuery}`);
      const statsRes = await API.get(`/inventory/sold-stats?${startDate && endDate ? `startDate=${startDate}&endDate=${endDate}` : ''}`);
      
      setProducts(prodRes.data.products || []);
      setTotalProducts(prodRes.data.total || 0);
      
      setLogs(logRes.data.logs || []);
      setTotalLogs(logRes.data.total || 0);
      setTotalRemoved(logRes.data.totalRemoved || 0);
      setSoldStats(statsRes.data.stats || {});
      setVariantSoldStats(statsRes.data.variantStats || {});
    } catch (err) {
      console.error(err);
      toast.error('Failed to load inventory data');
    }
    setLoading(false);
  };

  const fetchReportData = async () => {
    try {
       // Fetch all products (for available stock), ignoring pagination limit
       const prodRes = await API.get(`/products?limit=1000${search ? `&search=${search}` : ''}`);
       
       // Fetch logs for the specific date range
       let dateQuery = '';
       if (startDate && endDate) {
         dateQuery = `&startDate=${startDate}&endDate=${endDate}`;
       }
       const logRes = await API.get(`/inventory/logs?limit=1000${dateQuery}`);
       
       return { 
          reportProducts: prodRes.data.products || [], 
          reportLogs: logRes.data.logs || [] 
       };
    } catch (err) {
       toast.error("Failed to fetch accurate report data");
       return null;
    }
  };

  const exportToExcel = async () => {
    setDownloading(true);
    const data = await fetchReportData();
    if (!data) { setDownloading(false); return; }
    const { reportProducts, reportLogs } = data;

    const wb = XLSX.utils.book_new();
    
    // Products Sheet
    const productData = [];
    reportProducts.forEach(p => {
      productData.push({
        Product: p.name,
        'Sub-Category': p.subcategory || 'N/A',
        Color: 'All',
        Size: 'All',
        'Current Stock': p.stock || 0,
        'Selled stack': soldStats[p._id] || 0
      });
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          if (v.inventory && v.inventory.length > 0) {
            v.inventory.forEach(inv => {
              productData.push({
                Product: `   -- ${v.color} - ${inv.size}`,
                'Sub-Category': '',
                Color: v.color,
                Size: inv.size,
                'Current Stock': inv.stock || 0,
                'Selled stack': variantSoldStats[`${p._id}-${v.color}-${inv.size}`] || 0
              });
            });
          } else {
            productData.push({
              Product: `   -- ${v.color} (No sizes)`,
              'Sub-Category': '',
              Color: v.color,
              Size: 'N/A',
              'Current Stock': 0,
              'Selled stack': variantSoldStats[`${p._id}-${v.color}-`] || 0
            });
          }
        });
      }
    });

    const wsProducts = XLSX.utils.json_to_sheet(productData);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Available Stock");

    // Logs Sheet
    const logData = reportLogs.map(l => ({
      Date: new Date(l.createdAt).toLocaleString(),
      Product: l.productId?.name || 'Unknown',
      Color: l.color || '',
      Size: l.size || '',
      Action: l.action === 'increment' ? 'Added' : 'Removed',
      Quantity: l.quantity,
      'Previous Stock': l.previousStock,
      'Current Stock': l.currentStock,
      Reason: l.reason
    }));
    const wsLogs = XLSX.utils.json_to_sheet(logData);
    XLSX.utils.book_append_sheet(wb, wsLogs, "Stock Logs");

    const fileName = (startDate && endDate) ? `Inventory_Report_${startDate}_to_${endDate}.xlsx` : `Inventory_Report_Full.xlsx`;
    XLSX.writeFile(wb, fileName);
    setDownloading(false);
  };

  const exportToPDF = async () => {
    setDownloading(true);
    const data = await fetchReportData();
    if (!data) { setDownloading(false); return; }
    const { reportProducts, reportLogs } = data;

    const doc = new jsPDF();
    
    doc.setFontSize(14);
    const reportTitle = (startDate && endDate) ? `(${startDate} to ${endDate})` : '(Full)';
    doc.text(`Inventory Stock Report ${reportTitle}`, 14, 15);
    
    const pdfProductData = [];
    reportProducts.forEach(p => {
      pdfProductData.push([
        p.name, 
        p.subcategory || 'N/A',
        p.stock || 0, 
        soldStats[p._id] || 0
      ]);
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          if (v.inventory && v.inventory.length > 0) {
            v.inventory.forEach(inv => {
              pdfProductData.push([
                `   -- ${v.color} - ${inv.size}`,
                '',
                inv.stock || 0,
                variantSoldStats[`${p._id}-${v.color}-${inv.size}`] || 0
              ]);
            });
          } else {
            pdfProductData.push([
              `   -- ${v.color} (No sizes)`,
              '',
              0,
              variantSoldStats[`${p._id}-${v.color}-`] || 0
            ]);
          }
        });
      }
    });

    // Products Table
    autoTable(doc, {
      startY: 20,
      head: [['Product', 'Sub-Category', 'Current Stock', 'Selled stack']],
      body: pdfProductData,
      theme: 'grid',
      headStyles: { fillColor: [139, 127, 192] },
      styles: { fontSize: 8 }
    });

    // Logs Table
    doc.addPage();
    doc.text(`Stock Movement Logs ${reportTitle}`, 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Product', 'Variant', 'Action', 'Qty', 'Reason']],
      body: reportLogs.map(l => [
        new Date(l.createdAt).toLocaleDateString(),
        l.productId?.name || 'Unknown',
        `${l.color || ''} ${l.size || ''}`.trim(),
        l.action === 'increment' ? 'Added' : 'Removed',
        l.quantity,
        l.reason
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 127, 192] },
      styles: { fontSize: 8 }
    });

    const fileName = (startDate && endDate) ? `Inventory_Report_${startDate}_to_${endDate}.pdf` : `Inventory_Report_Full.pdf`;
    doc.save(fileName);
    setDownloading(false);
  };

  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
     setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [confirmModal, setConfirmModal] = useState({ open: false, data: null });

  const confirmAdjust = (p, variantId, invSize, variantObj) => {
    const id = p._id;
    const size = invSize;
    const key = variantId !== null ? `${id}-${variantId}-${size}` : id;
    const qty = adjustQty[key];
    const reason = adjustReason[key] || 'Manual Adjustment';
    
    if (!qty || isNaN(qty)) {
      toast.warning('Please enter a valid quantity');
      return;
    }
    
    const numQty = Number(qty);
    const actionText = numQty >= 0 ? "Add" : "Remove";
    const variantInfo = variantObj ? `${variantObj.color}${size && size !== 'nosize' ? ` (Size: ${size})` : ''}` : '(No Variant)';
    
    setConfirmModal({
      open: true,
      data: {
        id, variantId, size, key, qty: numQty, reason,
        message: (
          <span>
            Are you sure you want to <strong>{actionText} {Math.abs(numQty)}</strong> items for:<br />
            <strong className="text-gray-800">{p.name}</strong><br />
            <span className="text-xs text-gray-500">{variantInfo}</span>
          </span>
        )
      }
    });
  };

  const handleAdjustConfirmed = async () => {
    if (!confirmModal.data) return;
    const { id, variantId, size, key, qty, reason } = confirmModal.data;

    try {
      const res = await API.put(`/inventory/adjust/${id}`, { quantity: qty, reason, variantId, size: size === 'nosize' ? null : size });
      if (res.data.success) {
         toast.success('Stock adjusted successfully');
         setAdjustQty({ ...adjustQty, [key]: '' });
         setAdjustReason({ ...adjustReason, [key]: '' });
         loadInventory();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjustment failed');
    } finally {
      setConfirmModal({ open: false, data: null });
    }
  };

  return (
    <Layout title="Inventory & Stock">
      <ConfirmModal 
        isOpen={confirmModal.open}
        title="Confirm Stock Adjustment"
        message={confirmModal.data?.message}
        onConfirm={handleAdjustConfirmed}
        onCancel={() => setConfirmModal({ open: false, data: null })}
        type={confirmModal.data?.qty >= 0 ? 'info' : 'danger'}
        confirmText={confirmModal.data?.qty >= 0 ? 'Confirm Add' : 'Confirm Remove'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="card px-2 md:px-5 py-5 shadow-sm">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <h3 className="font-serif text-lg text-charcoal flex items-center gap-2 px-1"><Package size={18} className="text-gold-600"/> Stock Metrics</h3>
                    <button 
                      onClick={() => { setShowLowStock(!showLowStock); setProductPage(1); }}
                      className={`whitespace-nowrap flex items-center justify-center text-[9px] uppercase font-bold tracking-[0.1em] px-4 py-2 rounded-full border transition-all h-fit self-center ${showLowStock ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200'}`}
                    >
                      {showLowStock ? '• Showing Low Stock' : 'Filter Low Stock'}
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto px-1">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded border border-gray-100 w-full sm:w-auto">
                       <Search size={14} className="text-gray-400" />
                       <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent border-none text-xs focus:outline-none flex-1 sm:w-32 font-sans" />
                    </div>
                    
                    <div className="flex border border-gray-200 rounded divide-x divide-gray-200 bg-white items-center flex-1 sm:flex-none">
                        <span className="text-[10px] text-gray-400 font-bold px-1 hidden sm:block">FROM</span>
                        <input
                           type="date"
                           value={startDate}
                           onChange={e => setStartDate(e.target.value)}
                           className="text-[10px] px-1 py-1.5 focus:outline-none text-gray-600 w-full sm:w-auto"
                           title="From Date"
                        />
                        <span className="text-[10px] text-gray-400 font-bold px-1 hidden sm:block">TO</span>
                        <input
                           type="date"
                           value={endDate}
                           onChange={e => setEndDate(e.target.value)}
                           className="text-[10px] px-1 py-1.5 focus:outline-none text-gray-600 w-full sm:w-auto"
                           title="To Date"
                        />
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

               {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded animate-pulse" />)}</div>
               ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[750px] table-fixed">
                       <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                             <th className="text-left text-xs tracking-wider uppercase font-sans text-gray-400 px-2 py-2.5 w-1/3">Product</th>
                             <th className="text-left text-xs tracking-wider uppercase font-sans text-gray-400 px-2 py-2.5 w-24">Category</th>
                             <th className="text-center text-xs tracking-wider uppercase font-sans text-gray-400 px-2 py-2.5 w-16">Stock</th>
                             <th className="text-center text-xs tracking-wider uppercase font-sans text-gray-400 px-2 py-2.5 w-16">Sold</th>
                             <th className="text-left text-xs tracking-wider uppercase font-sans text-gray-400 px-2 py-2.5 w-44">Quick Adjust</th>
                             <th className="text-center text-xs tracking-wider uppercase font-sans text-gray-400 px-2 py-2.5 w-20">Action</th>
                          </tr>
                       </thead>
                       <tbody>
                          {products.map(p => (
                             <React.Fragment key={p._id}>
                               <tr className="border-b border-gray-50 text-[11px] hover:bg-gray-50 transition-colors font-sans">
                                  <td className="px-2 py-3 overflow-hidden cursor-pointer" onClick={() => toggleRow(p._id)}>
                                     <div className="flex items-center gap-2">
                                        <span className="text-gray-400">{expandedRows[p._id] ? '▼' : '▶'}</span>
                                        <p className="font-bold text-charcoal truncate" title={p.name}>{p.name}</p>
                                     </div>
                                  </td>
                                  <td className="px-2 py-3 text-gray-500 truncate" title={p.subcategory || '—'}>{p.subcategory || '—'}</td>
                                  <td className="px-2 py-3 text-center"><span className={`${(p.stock || 0) <= 5 ? 'text-red-500 font-bold' : 'text-gray-600'}`}>{p.stock || 0}</span></td>
                                  <td className="px-2 py-3 text-center text-gold-600 font-bold">{soldStats[p._id] || 0}</td>
                                  <td className="px-2 py-3">
                                     <span className="text-gray-400 text-xs italic">Expand to adjust sizes</span>
                                  </td>
                                  <td className="px-2 py-3 text-center">
                                     {/* Empty action column for parent product */}
                                  </td>
                               </tr>
                               {expandedRows[p._id] && p.variants && p.variants.map((v, i) => (
                                 (v.inventory && v.inventory.length > 0) ? (
                                   v.inventory.map(inv => {
                                      if (showLowStock && inv.stock > 10) return null; // Hide healthy sizes if filtering
                                      const vKey = `${p._id}-${v._id || i}-${inv.size}`;
                                      return (
                                        <tr key={vKey} className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-sans">
                                           <td className="px-2 py-2 pl-8 text-gray-600 flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                              <span className="font-bold">{v.color}</span> - Size: <span className="font-bold">{inv.size}</span>
                                           </td>
                                           <td className="px-2 py-2 text-gray-500">—</td>
                                           <td className="px-2 py-2 text-center"><span className={`${inv.stock <= 5 ? 'text-red-500 font-bold' : 'text-gray-600'}`}>{inv.stock}</span></td>
                                           <td className="px-2 py-2 text-center text-gold-600 font-bold">{variantSoldStats[`${p._id}-${v.color}-${inv.size}`] || '—'}</td>
                                           <td className="px-2 py-2">
                                              <div className="flex items-center gap-1">
                                                 <input type="number" placeholder="Qty" value={adjustQty[vKey] || ''} onChange={e => setAdjustQty({ ...adjustQty, [vKey]: e.target.value })} className="border border-gray-200 rounded px-1 py-1 w-10 text-center text-[10px] focus:border-gold-500 focus:outline-none font-sans" />
                                                 <input type="text" placeholder="Reason" value={adjustReason[vKey] || ''} onChange={e => setAdjustReason({ ...adjustReason, [vKey]: e.target.value })} className="border border-gray-200 rounded px-1 py-1 text-[10px] w-24 focus:border-gold-500 focus:outline-none font-sans" />
                                              </div>
                                           </td>
                                           <td className="px-2 py-2 text-center">
                                              <button onClick={() => confirmAdjust(p, v._id || i, inv.size, v)} className="bg-teal-600 text-white px-2.5 py-1.5 text-[8px] tracking-widest uppercase hover:bg-teal-700 transition-colors font-sans rounded-sm shadow-sm whitespace-nowrap">Update</button>
                                           </td>
                                        </tr>
                                      );
                                   })
                                 ) : (
                                   (showLowStock && (v.stock || 0) > 10) ? null : (
                                   <tr key={`${p._id}-${v._id || i}`} className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-sans">
                                      <td className="px-2 py-2 pl-8 text-gray-600 flex items-center gap-2">
                                         <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                         <span className="font-bold">{v.color}</span> (No sizes)
                                      </td>
                                      <td className="px-2 py-2 text-gray-500">—</td>
                                      <td className="px-2 py-2 text-center"><span className={`${(v.stock||0) <= 5 ? 'text-red-500 font-bold' : 'text-gray-600'}`}>{v.stock || 0}</span></td>
                                      <td className="px-2 py-2 text-center text-gold-600 font-bold">—</td>
                                      <td className="px-2 py-2">
                                         <div className="flex items-center gap-1">
                                            <input type="number" placeholder="Qty" value={adjustQty[`${p._id}-${v._id || i}-nosize`] || ''} onChange={e => setAdjustQty({ ...adjustQty, [`${p._id}-${v._id || i}-nosize`]: e.target.value })} className="border border-gray-200 rounded px-1 py-1 w-10 text-center text-[10px] focus:border-gold-500 focus:outline-none font-sans" />
                                            <input type="text" placeholder="Reason" value={adjustReason[`${p._id}-${v._id || i}-nosize`] || ''} onChange={e => setAdjustReason({ ...adjustReason, [`${p._id}-${v._id || i}-nosize`]: e.target.value })} className="border border-gray-200 rounded px-1 py-1 text-[10px] w-24 focus:border-gold-500 focus:outline-none font-sans" />
                                         </div>
                                      </td>
                                      <td className="px-2 py-2 text-center">
                                         <button onClick={() => confirmAdjust(p, v._id || i, 'nosize', v)} className="bg-teal-600 text-white px-2.5 py-1.5 text-[8px] tracking-widest uppercase hover:bg-teal-700 transition-colors font-sans rounded-sm shadow-sm whitespace-nowrap">Update</button>
                                      </td>
                                   </tr>
                                   )
                                 )
                               ))}
                             </React.Fragment>
                          ))}
                       </tbody>
                    </table>
                  </div>
               )}
               
               {/* Product Pagination Footer */}
               <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 px-1">
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <div className="flex items-center gap-2">
                        <span>Rows:</span>
                        <select value={productLimit} onChange={e => { setProductLimit(Number(e.target.value)); setProductPage(1); }} className="bg-gray-50 border border-gray-100 rounded px-1 py-0.5 outline-none text-charcoal cursor-pointer">
                           {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <span>
                        Showing {totalProducts === 0 ? 0 : ((productPage-1)*productLimit)+1} - {Math.min(productPage*productLimit, totalProducts)} of {totalProducts}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-sans">
                        <button onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={productPage === 1} className="p-1 px-2 text-[10px] font-bold uppercase border border-gray-100 rounded hover:bg-gray-50 disabled:opacity-20 transition-all">Prev</button>
                        <button onClick={() => setProductPage(p => p + 1)} disabled={productPage * productLimit >= totalProducts} className="p-1 px-2 text-[10px] font-bold uppercase border border-gray-100 rounded hover:bg-gray-50 disabled:opacity-20 transition-all">Next</button>
                    </div>
                </div>
             </div>
          </div>

          {/* Logs timeline */}
          <div className="card p-5 shadow-sm flex flex-col h-full bg-white">
              <h3 className="font-serif text-charcoal mb-4 flex items-center gap-2 flex-none"><RefreshCw size={16} className="text-blue-500" /> Stock Movement Log</h3>
              <div className="flex-1 space-y-3 overflow-y-auto min-h-0 px-1 pb-4">
                 {logs.length === 0 ? <p className="text-xs text-gray-400 text-center py-5 font-sans">No logs available.</p> : logs.map((l, idx) => {
                     const isIncrease = l.action === 'increment';
                     const dateFormatted = new Date(l.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                     return (
                         <div key={l._id || idx} className="border-b border-gray-50 pb-3 last:border-none flex items-start gap-2 text-xs font-sans">
                            <div className={`p-1 rounded-full mt-0.5 ${isIncrease ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                               {isIncrease ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                   <div className="flex-1 min-w-0">
                                      <p className="font-medium text-charcoal truncate">
                                        {l.productId?.name || 'Unknown Item'}
                                      </p>
                                      {(l.color || l.size) && (
                                        <p className="text-[10px] text-gray-600 font-medium tracking-wide mt-0.5 bg-gray-100/70 w-fit px-1.5 py-0.5 rounded">
                                          {l.color}{l.color && l.size ? ' • ' : ''}{l.size}
                                        </p>
                                      )}
                                   </div>
                                   <span className="text-[9px] text-gray-400 font-bold tracking-wide mt-0.5 whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded shrink-0">{dateFormatted}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 font-sans mt-0.5">{l.reason}</p>
                                 <div className="flex items-center gap-2 text-[10px] mt-2 bg-gray-50 px-2 py-1 rounded w-fit border border-gray-100">
                                     <span className="text-gray-400 font-medium">Prev: {l.previousStock || 0}</span>
                                     <span className="text-gray-200 text-xs">|</span>
                                     <span className={`font-bold uppercase tracking-tighter ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                                        {isIncrease ? '+' : '-'}{l.quantity}
                                     </span>
                                     <span className="text-gray-200 text-xs">|</span>
                                     <span className="text-charcoal font-bold">Curr: {l.currentStock}</span>
                                 </div>
                            </div>
                         </div>
                     );
                 })}
              </div>

              {/* Log Pagination Footer */}
              <div className="mt-auto pt-4 border-t border-gray-100 font-sans flex flex-col gap-3 flex-none">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        <span>Rows:</span>
                        <select value={logLimit} onChange={e => { setLogLimit(Number(e.target.value)); setLogPage(1); }} className="bg-gray-50 border border-gray-100 rounded px-1 py-0.5 outline-none text-charcoal cursor-pointer">
                           {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                     </div>
                     <span className="text-[10px] text-gray-400 font-bold">
                         {totalLogs === 0 ? 0 : ((logPage-1)*logLimit)+1}-{Math.min(logPage*logLimit, totalLogs)} of {totalLogs}
                     </span>
                  </div>
                  <div className="flex items-center gap-1">
                      <button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1} className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-charcoal border border-gray-100 rounded-lg disabled:opacity-20 transition-all">Prev</button>
                      <button onClick={() => setLogPage(p => p + 1)} disabled={logPage * logLimit >= totalLogs} className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-charcoal border border-gray-100 rounded-lg disabled:opacity-20 transition-all">Next</button>
                  </div>
              </div>
          </div>
      </div>
    </Layout>
  );
}

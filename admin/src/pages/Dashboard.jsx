import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import API, { BACKEND_URL, getFullUrl } from '../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { ShoppingBag, TrendingUp, AlertTriangle, Users, IndianRupee, DollarSign, Package, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState([]);
  const [shippingSummary, setShippingSummary] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date & Currency Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('all');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const params = { currency };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await API.get('/dashboard/stats', { params });
      if (res.data.success) {
         setStats(res.data.stats || {});
         setRecentOrders(res.data.recentOrders || []);
         setTopProducts(res.data.topProducts || []);
         setChartData(res.data.chartData || []);
         setPaymentSummary(res.data.paymentSummary || []);
         setShippingSummary(res.data.shippingSummary || []);
         setAlerts(res.data.alerts || []);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, currency]);

  const COLORS = ['#D4AF37', '#22C55E', '#3B82F6', '#EF4444', '#8B5CF6'];

  const getSalesValue = () => {
    if (currency === 'USD') return `$${stats.totalSalesUSD?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`;
    if (currency === 'INR') return `₹${stats.totalSales?.toLocaleString(undefined, { minimumFractionDigits: 0 }) || '0'}`;
    
    // Global view - Show primary (INR) and secondary ($) with better styling
    return (
      <div className="flex flex-col">
        <span className="text-charcoal font-bold">₹{stats.totalSales?.toLocaleString() || 0}</span>
        {stats.totalSalesUSD > 0 && <span className="text-[10px] text-gray-400">/ ${stats.totalSalesUSD?.toLocaleString()}</span>}
      </div>
    );
  };

  const getTodaySales = () => {
    if (currency === 'USD') return `$${stats.todaySalesUSD?.toLocaleString() || 0}`;
    if (currency === 'INR') return `₹${stats.todaySales?.toLocaleString() || 0}`;
    
    const strings = [];
    if (stats.todaySales > 0) strings.push(`₹${stats.todaySales.toLocaleString()}`);
    if (stats.todaySalesUSD > 0) strings.push(`$${stats.todaySalesUSD.toLocaleString()}`);
    
    return strings.length === 0 ? '₹0' : strings.join(' + ');
  };

  const statCards = [
    { 
      label: currency === 'all' ? 'Sales Revenue' : `Sales (${currency})`, 
      value: getSalesValue(), 
      sub: `Today: ${getTodaySales()}`, 
      icon: currency === 'USD' ? DollarSign : IndianRupee, 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
    },
    { label: 'Total Orders', value: stats.totalOrders || 0, sub: `Today: ${stats.todayOrders || 0}`, icon: ShoppingBag, color: 'text-gold-600', bg: 'bg-gold-50' },
    { label: 'Pending Orders', value: stats.pendingOrders || 0, sub: `Processing`, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'New Customers', value: stats.newCustomers || 0, sub: `Target interval`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' }
  ];

  const stockStats = [
     { label: 'Low Stock', value: stats.lowStockCount || 0, icon: AlertTriangle, color: 'text-orange-500' },
     { label: 'Out of Stock', value: stats.outOfStockCount || 0, icon: Package, color: 'text-red-500' },
     { label: 'Delivered', value: stats.deliveredOrders || 0, icon: CheckCircle, color: 'text-green-500' }
  ];

  const returnStats = [
     { label: 'Pending Returns', value: stats.pendingReturns || 0, icon: Clock, color: 'text-yellow-600' },
     { label: 'Approved Returns', value: stats.approvedReturns || 0, icon: CheckCircle, color: 'text-blue-500' },
     { label: 'Received Returns', value: stats.receivedReturns || 0, icon: Package, color: 'text-green-600' },
     { label: 'Total Requests', value: stats.totalReturns || 0, icon: ShoppingBag, color: 'text-indigo-500' }
  ];

  const statusColors = { processing: 'text-yellow-700 bg-yellow-50', shipped: 'text-blue-700 bg-blue-50', delivered: 'text-green-700 bg-green-50', returned: 'text-purple-700 bg-purple-50', cancelled: 'text-red-700 bg-red-50' };
  const returnStatusColors = { pending: 'text-yellow-600 bg-yellow-50', approved: 'text-blue-600 bg-blue-50', received: 'text-green-600 bg-green-50', rejected: 'text-red-600 bg-red-50', refunded: 'text-indigo-600 bg-indigo-50' };

  return (
    <Layout title="Dashboard">
      {/* Date Filter & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col sm:flex-row border border-gray-200 rounded sm:divide-x divide-y sm:divide-y-0 divide-gray-100 bg-white w-full md:w-auto overflow-hidden shadow-sm">
            <div className="flex items-center group flex-1">
                <span className="text-[9px] text-gray-500 font-bold px-3 text-center min-w-[45px]">FROM</span>
                <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="text-[11px] px-2 py-2.5 sm:py-2 focus:outline-none text-gray-600 flex-1 sm:flex-none border-l sm:border-l-0"
                    title="From Date"
                />
            </div>
            <div className="flex items-center group flex-1">
                <span className="text-[9px] text-gray-500 font-bold px-3 text-center min-w-[45px]">TO</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="text-[11px] px-2 py-2.5 sm:py-2 focus:outline-none text-gray-600 flex-1 sm:flex-none border-l sm:border-l-0"
                    title="To Date"
                />
            </div>
            {(startDate || endDate) && (
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] text-gold-600 hover:bg-gold-50 px-3 py-2 sm:py-0 font-bold uppercase tracking-tighter border-t sm:border-t-0 sm:border-l border-gray-100">
                    Clear
                </button>
            )}
        </div>
        <div className="flex border border-gray-200 rounded divide-x divide-gray-200 bg-white shadow-sm overflow-hidden">
            <button 
              onClick={() => setCurrency('all')} 
              className={`px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold transition-all ${currency === 'all' ? 'bg-charcoal text-white' : 'hover:bg-gray-50 text-gray-400'}`}
            >
              Global
            </button>
            <button 
              onClick={() => setCurrency('INR')} 
              className={`px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold transition-all ${currency === 'INR' ? 'bg-green-600 text-white' : 'hover:bg-gray-50 text-green-700'}`}
            >
              IN (₹)
            </button>
            <button 
              onClick={() => setCurrency('USD')} 
              className={`px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold transition-all ${currency === 'USD' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-blue-700'}`}
            >
              US ($)
            </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
         <div className="space-y-2 mb-6">
           {alerts.map((alt, idx) => {
             const isLowStock = alt.message.toLowerCase().includes('low in stock');
             const isOutStock = alt.message.toLowerCase().includes('out of stock');
             const isReturn = alt.message.toLowerCase().includes('return');
             const isOrder = alt.message.toLowerCase().includes('order');

             return (
               <div key={idx} className={`p-3 rounded-md border text-xs flex items-center justify-between gap-2 shadow-sm animate-in slide-in-from-right-4 duration-500
                 ${alt.type === 'danger' ? 'bg-red-50 text-red-700 border-red-100' : 
                   alt.type === 'warning' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                   'bg-blue-50 text-blue-700 border-blue-100'}`}>
                 <div className="flex items-center gap-2">
                    {isReturn ? <ShoppingBag size={14} /> : isOutStock || isLowStock ? <Package size={14} /> : <Clock size={14} />}
                    <span className="font-medium">{alt.message}</span>
                 </div>
                 {isReturn && <Link to="/orders?status=return" className="text-[10px] font-bold uppercase tracking-widest hover:underline">Manage Returns →</Link>}
                 {isOrder && <Link to="/orders?status=pending,processing" className="text-[10px] font-bold uppercase tracking-widest hover:underline">View Orders →</Link>}
                 {(isLowStock || isOutStock) && <Link to="/inventory?filter=low-stock" className="text-[10px] font-bold uppercase tracking-widest hover:underline">Restock →</Link>}
               </div>
             );
           })}
         </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-sans mb-1">{card.label}</p>
                    <h2 className="text-2xl font-sans font-bold text-charcoal">{loading ? '—' : card.value}</h2>
                    <p className="text-[10px] text-gray-400 mt-1">{card.sub}</p>
                  </div>
                  <div className={`w-10 h-10 ${card.bg} rounded-full flex items-center justify-center`}>
                    <Icon size={18} className={card.color} />
                  </div>
              </div>
            </div>
          );
        })}
      </div>

       {/* Sub Statistics & stock alert overview */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
         {stockStats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white p-4 rounded border border-gray-100 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                 <div className="p-2 bg-gray-50 rounded-full"><Icon size={16} className={s.color} /></div>
                 <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider scale-95 origin-left">{s.label}</div>
                    <div className="text-lg font-bold font-serif text-charcoal">{loading ? '—' : s.value}</div>
                 </div>
              </div>
            );
         })}
       </div>

       {/* Return Statistics Overview */}
       <div className="mb-8">
          <h3 className="font-serif text-[10px] tracking-[0.2em] text-gray-400 uppercase mb-3">Return Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {returnStats.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white p-4 rounded border border-gray-100 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-2 bg-gray-50 rounded-full"><Icon size={16} className={s.color} /></div>
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</div>
                        <div className="text-lg font-bold font-serif text-charcoal">{loading ? '—' : s.value}</div>
                    </div>
                  </div>
                );
            })}
          </div>
       </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="card p-5 lg:col-span-2 shadow-sm">
            <h3 className="font-serif text-charcoal mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-gold-600"/> Sales & Orders Trend</h3>
            <div className="h-64">
               {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSalesINR" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSalesUSD" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="_id" tick={{ fontSize: 10 }} stroke="#9CA3AF" tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" tickLine={false} axisLine={false} />
                        <Legend 
                            verticalAlign="top" 
                            align="right" 
                            height={36} 
                            iconType="circle" 
                            iconSize={8}
                            formatter={(value) => <span className="text-[10px] tracking-wider uppercase font-bold text-gray-500">{value}</span>}
                        />
                        {(currency === 'all' || currency === 'INR') && (
                           <Area type="monotone" dataKey="salesINR" name="Sales (₹)" stroke="#D4AF37" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSalesINR)" />
                        )}
                        {(currency === 'all' || currency === 'USD') && (
                           <Area type="monotone" dataKey="salesUSD" name="Sales ($)" stroke="#3B82F6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSalesUSD)" />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
               ) : (
                  <div className="flex items-center justify-center h-full text-xs text-gray-400">No chart data for this range</div>
               )}
            </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-4 shadow-sm flex-1 flex flex-col justify-center">
              <h3 className="font-serif text-xs text-gray-500 uppercase tracking-wider mb-2">Payment Methods</h3>
              <div className="h-28 flex items-center justify-center">
                 {paymentSummary.length > 0 ? (
                  <ResponsiveContainer width="99%" height={110}>
                      <PieChart>
                          <Pie data={paymentSummary} nameKey="_id" dataKey="count" cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={4} strokeWidth={0}>
                              {paymentSummary.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip />
                      </PieChart>
                  </ResponsiveContainer>
                 ) : <p className="text-xs text-gray-400">No data available</p>}
              </div>
              <div className="flex flex-col gap-1 w-full mt-2 text-[11px] max-h-16 overflow-y-auto px-1">
                  {paymentSummary.map((p, i) => (
                      <div key={p._id || i} className="flex items-center justify-between"><div className="flex items-center gap-1.2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /> <span className="capitalize text-gray-600 truncate max-w-[80px]">{p._id || 'Unknown'}</span></div> <span className="font-semibold text-charcoal">{p.count}</span></div>
                  ))}
              </div>
          </div>

          <div className="card p-4 shadow-sm flex-1 flex flex-col justify-center">
              <h3 className="font-serif text-xs text-gray-500 uppercase tracking-wider mb-2">Shipping Summary</h3>
              <div className="flex-1 flex flex-col justify-center gap-2">
                 {shippingSummary.length > 0 ? shippingSummary.map((s, idx) => (
                      <div key={s._id || idx}>
                          <div className="flex justify-between items-center text-[11px] mb-1">
                              <span className="capitalize text-gray-600">{s._id || 'Processing'}</span>
                              <span className="font-medium text-charcoal">{s.count} orders</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (s.count / (stats.totalOrders || 1)) * 100)}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                          </div>
                      </div>
                 )) : <p className="text-xs text-gray-400 text-center py-2">No shipping stats available</p>}
              </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders List */}
        <div className="card p-5 lg:col-span-2 shadow-sm">
            <h2 className="font-serif text-lg text-charcoal mb-5 flex items-center gap-1"><ShoppingBag size={18} className="text-indigo-500" /> Recent Orders</h2>
            {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 font-sans py-6 text-center">No orders yet</p>
            ) : (
            <div className="overflow-x-auto w-full no-scrollbar">
                <table className="w-full min-w-[600px]">
                <thead>
                    <tr className="border-b border-gray-100 text-[#101e42]">
                    {['Order ID', 'Customer', 'Amount', 'Payment', 'Status', 'Return', 'Date'].map(h => (
                        <th key={h} className="text-left text-[9px] tracking-[0.2em] uppercase font-bold text-gray-400 font-sans pb-3 pr-4">{h}</th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {recentOrders.map(order => (
                    <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 text-xs font-sans text-charcoal font-medium">#{order._id.slice(-8).toUpperCase()}</td>
                        <td className="py-3 pr-4 text-xs font-sans text-gray-600 truncate max-w-[100px] font-medium">{order.userId?.name || 'Guest'}</td>
                        <td className="py-3 pr-4 text-xs font-sans font-bold text-[#101e42]">
                            {order.currency === 'USD' ? '$' : '₹'}{order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 pr-4 text-xs font-sans capitalize text-gray-400">{order.paymentMethod}</td>
                        <td className="py-3 pr-4">
                        <span className={`text-[9px] tracking-[0.15em] uppercase font-sans font-bold px-2 py-0.5 rounded-full ${statusColors[order.orderStatus] || 'text-gray-600 bg-gray-100'}`}>
                            {order.orderStatus}
                        </span>
                        </td>
                        <td className="py-3 pr-4">
                            {order.returnStatus && order.returnStatus !== 'none' ? (
                                <span className={`text-[9px] tracking-[0.15em] uppercase font-bold px-2 py-0.5 rounded-full ${returnStatusColors[order.returnStatus] || 'text-gray-500 bg-gray-50'}`}>
                                    {order.returnStatus}
                                </span>
                            ) : <span className="text-gray-200">None</span>}
                        </td>
                        <td className="py-3 text-[10px] font-sans text-gray-400 font-medium">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </div>

         {/* Top Selling Products */}
         <div className="card p-5 shadow-sm border border-gray-100">
             <h2 className="font-serif text-lg text-charcoal mb-4 flex items-center gap-1"><TrendingUp size={18} className="text-green-500" /> Top Selling</h2>
             {topProducts.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">No products sold yet</p> : (
                 <div className="space-y-4">
                     {topProducts.map((prod, index) => {
                         // Robust image parsing
                         let mainImage = prod.image;
                         if (Array.isArray(mainImage)) mainImage = mainImage[0];
                         if (typeof mainImage === 'string' && (mainImage.startsWith('[') || mainImage.startsWith('{'))) {
                            try { 
                                const parsed = JSON.parse(mainImage);
                                mainImage = Array.isArray(parsed) ? parsed[0] : (parsed.image || mainImage);
                            } catch(e) {}
                         }
                         
                         const symbol = currency === 'USD' ? '$' : '₹';
                         const maxSold = topProducts[0]?.totalSales || 1;
                         const widthPer = (prod.totalSales / maxSold) * 100;
                         
                         return (
                             <div key={prod._id || index} className="group relative">
                                {/* Invisible progress bar as background */}
                                <div className="absolute inset-y-0 left-0 bg-gray-50/50 rounded-lg -z-0 transition-all duration-700" style={{ width: `${widthPer}%` }} />
                                
                                <div className="relative z-10 flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50/80 transition-all duration-300">
                                   <div className="flex-none font-serif text-[10px] font-bold text-gray-300 w-4">{index + 1}</div>
                                   
                                   <div className="relative w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                                       {mainImage ? (
                                           <img 
                                             src={getFullUrl(mainImage)} 
                                             alt={prod.name} 
                                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                             onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100/f8f9fa/adb5bd?text=Product'; }}
                                           />
                                       ) : (
                                           <div className="w-full h-full flex items-center justify-center bg-gray-50"><Package size={16} className="text-gray-300"/></div>
                                       )}
                                   </div>
                                   
                                   <div className="flex-1 min-w-0">
                                       <p className="text-[11px] font-bold text-charcoal truncate font-sans group-hover:text-gold-600 transition-colors uppercase tracking-tight">{prod.name || 'Unnamed product'}</p>
                                       <div className="flex items-center gap-2 mt-0.5">
                                           <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">{prod.totalSales} SOLD</span>
                                           <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                           <span className="text-[9px] text-gray-400 font-medium tracking-wider">REVENUE</span>
                                       </div>
                                   </div>
                                   
                                   <div className="text-right">
                                       <div className="text-xs font-bold text-[#101e42] font-sans flex flex-col items-end">
                                           {(currency === 'all' || currency === 'INR') && prod.revenueINR > 0 && (
                                               <span>₹{prod.revenueINR.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                           )}
                                           {(currency === 'all' || currency === 'USD') && prod.revenueUSD > 0 && (
                                               <span className={currency === 'all' ? 'text-[10px] text-gray-400 font-medium' : ''}>${prod.revenueUSD.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0 })}</span>
                                           )}
                                           {(!prod.revenueINR && !prod.revenueUSD) && <span>₹0</span>}
                                       </div>
                                   </div>
                                </div>
                             </div>
                         );
                     })}
                 </div>
             )}
         </div>
      </div>
    </Layout>
  );
}
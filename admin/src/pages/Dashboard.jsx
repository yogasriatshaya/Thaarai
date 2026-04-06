import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API, { BACKEND_URL } from '../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
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
    if (currency === 'USD') return `$${stats.totalSalesUSD?.toLocaleString() || 0}`;
    if (currency === 'INR') return `₹${stats.totalSales?.toLocaleString() || 0}`;
    // Global view - Show both if both exist
    const strings = [];
    if (stats.totalSales > 0) strings.push(`₹${stats.totalSales.toLocaleString()}`);
    if (stats.totalSalesUSD > 0) strings.push(`$${stats.totalSalesUSD.toLocaleString()}`);
    
    if (strings.length === 0) return '₹0';
    return strings.join(' + ');
  };

  const getTodaySales = () => {
    if (currency === 'USD') return `$${stats.todaySalesUSD?.toLocaleString() || 0}`;
    if (currency === 'INR') return `₹${stats.todaySales?.toLocaleString() || 0}`;
    
    // Global view - Show both
    const strings = [];
    if (stats.todaySales > 0) strings.push(`₹${stats.todaySales.toLocaleString()}`);
    if (stats.todaySalesUSD > 0) strings.push(`$${stats.todaySalesUSD.toLocaleString()}`);
    
    if (strings.length === 0) return '₹0';
    return strings.join(' + ');
  };

  const statCards = [
    { label: currency === 'all' ? 'Total Sales (Global)' : `Sales (${currency})`, value: getSalesValue(), sub: `Today: ${getTodaySales()}`, icon: currency === 'USD' ? DollarSign : IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
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

  const statusColors = { processing: 'text-yellow-700 bg-yellow-50', shipped: 'text-blue-700 bg-blue-50', delivered: 'text-green-700 bg-green-50', cancelled: 'text-red-700 bg-red-50' };
  const returnStatusColors = { pending: 'text-yellow-600 bg-yellow-50', approved: 'text-blue-600 bg-blue-50', received: 'text-green-600 bg-green-50', rejected: 'text-red-600 bg-red-50', refunded: 'text-indigo-600 bg-indigo-50' };

  return (
    <Layout title="Dashboard">
      {/* Date Filter & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 bg-white p-2 rounded border border-gray-100 shadow-sm w-full md:w-auto">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none text-xs text-gray-600 focus:outline-none" />
          <span className="text-gray-400 text-xs">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none text-xs text-gray-600 focus:outline-none" />
          <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] text-gray-400 hover:text-charcoal underline">Clear</button>
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
                 {isReturn && <a href="/orders" className="text-[10px] font-bold uppercase tracking-widest hover:underline">Manage Returns →</a>}
                 {isOrder && <a href="/orders" className="text-[10px] font-bold uppercase tracking-widest hover:underline">View Orders →</a>}
                 {(isLowStock || isOutStock) && <a href="/inventory" className="text-[10px] font-bold uppercase tracking-widest hover:underline">Restock →</a>}
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
                        <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #F3F4F6' }} />
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
                  <ResponsiveContainer width="100%" height="100%">
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
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-100">
                    {['Order ID', 'Customer', 'Amount', 'Payment', 'Status', 'Return', 'Date'].map(h => (
                        <th key={h} className="text-left text-[10px] tracking-[0.18em] uppercase text-gray-400 font-sans pb-3 pr-4">{h}</th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {recentOrders.map(order => (
                    <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 text-xs font-sans text-charcoal">#{order._id.slice(-8).toUpperCase()}</td>
                        <td className="py-3 pr-4 text-xs font-sans text-gray-600 truncate max-w-[100px]">{order.userId?.name || 'Guest'}</td>
                        <td className="py-3 pr-4 text-xs font-sans font-medium">{order.currency === 'USD' ? '$' : '₹'}{order.totalAmount?.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-xs font-sans capitalize text-gray-500">{order.paymentMethod}</td>
                        <td className="py-3 pr-4">
                        <span className={`text-[9px] tracking-wider uppercase font-sans font-medium px-2 py-0.5 rounded-full ${statusColors[order.orderStatus] || 'text-gray-600 bg-gray-100'}`}>
                            {order.orderStatus}
                        </span>
                        </td>
                        <td className="py-3 pr-4">
                            {order.returnStatus && order.returnStatus !== 'none' ? (
                                <span className={`text-[9px] tracking-wider uppercase font-sans font-medium px-2 py-0.5 rounded-full ${returnStatusColors[order.returnStatus] || 'text-gray-500 bg-gray-50'}`}>
                                    {order.returnStatus}
                                </span>
                            ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 text-xs font-sans text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </div>

         {/* Top Selling Products */}
         <div className="card p-5 shadow-sm">
             <h2 className="font-serif text-lg text-charcoal mb-4 flex items-center gap-1"><TrendingUp size={18} className="text-green-500" /> Top Selling</h2>
             {topProducts.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">No products sold yet</p> : (
                 <div className="space-y-3">
                     {topProducts.map((prod, index) => (
                         <div key={prod._id} className="flex items-center gap-3 border-b border-gray-50 last:border-0 pb-3 hover:bg-gray-50 p-1 rounded-sm transition-colors">
                            <div className="w-9 h-9 bg-gray-50 rounded overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center">
                                {prod.image ? <img src={prod.image.startsWith('http') ? prod.image.replace(/^http:\/\/localhost:\d+/, BACKEND_URL) : `${BACKEND_URL}${prod.image}`} alt={prod.name} className="w-full h-full object-cover" /> : <Package size={14} className="text-gray-400"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-charcoal truncate">{prod.name || 'Unnamed'}</p>
                                <p className="text-[10px] text-gray-400">{prod.totalSales} units sold</p>
                            </div>
                            <div className="text-xs font-semibold text-charcoal">₹{prod.revenue?.toLocaleString()}</div>
                         </div>
                     ))}
                 </div>
             )}
         </div>
      </div>
    </Layout>
  );
}
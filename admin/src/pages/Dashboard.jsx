import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [products, orders, customers] = await Promise.all([
          API.get('/products?limit=1'),
          API.get('/orders/all?limit=5'),
          API.get('/users/all')
        ]);
        const revenue = orders.data.orders?.reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 0;
        setStats({
          products: products.data.total || 0,
          orders: orders.data.total || 0,
          customers: customers.data.users?.length || 0,
          revenue
        });
        setRecentOrders(orders.data.orders?.slice(0, 5) || []);
      } catch (err) {
        console.error('Dashboard load error:', err.response?.status, err.response?.data?.message);
      }
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Products', value: stats.products, icon: '◈', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Orders', value: stats.orders, icon: '◎', color: 'text-gold-600', bg: 'bg-gold-50' },
    { label: 'Customers', value: stats.customers, icon: '◉', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: '◐', color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  const statusColors = { processing: 'text-yellow-700 bg-yellow-50', shipped: 'text-blue-700 bg-blue-50', delivered: 'text-green-700 bg-green-50', cancelled: 'text-red-700 bg-red-50' };

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="card p-5">
            <div className={`w-10 h-10 ${card.bg} rounded-full flex items-center justify-center mb-3`}>
              <span className={`${card.color} text-lg`}>{card.icon}</span>
            </div>
            <p className="text-2xl font-serif text-charcoal mb-1">{loading ? '—' : card.value}</p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-sans">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="font-serif text-lg text-charcoal mb-5">Recent Orders</h2>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 font-sans py-6 text-center">No orders yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Order ID', 'Customer', 'Amount', 'Payment', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-[0.2em] uppercase text-gray-400 font-sans pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 text-xs font-sans text-charcoal">#{order._id.slice(-8).toUpperCase()}</td>
                  <td className="py-3 pr-4 text-xs font-sans text-gray-600">{order.userId?.name || 'Guest'}</td>
                  <td className="py-3 pr-4 text-xs font-sans font-medium">${order.totalAmount?.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-xs font-sans capitalize text-gray-500">{order.paymentMethod}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-[9px] tracking-wider uppercase font-sans font-medium px-2 py-0.5 rounded-full ${statusColors[order.orderStatus] || 'text-gray-600 bg-gray-100'}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="py-3 text-xs font-sans text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
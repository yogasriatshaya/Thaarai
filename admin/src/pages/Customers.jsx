import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/users/all')
      .then(r => setCustomers(r.data.users || []))
      .catch(err => console.error('Customers load error:', err.response?.status, err.response?.data?.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Customers">
      <div className="mb-6">
        <p className="text-xs text-gray-400 font-sans">{customers.length} registered customers</p>
      </div>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : customers.length === 0 ? (
          <p className="text-center py-16 text-gray-400 font-serif text-xl">No customers yet</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Email', 'Role', 'Joined', 'Wishlist'].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-[0.2em] uppercase text-gray-400 font-sans px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
                        <span className="text-gold-700 text-xs font-serif font-medium">{customer.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-sans text-charcoal">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-sans text-gray-500">{customer.email}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[9px] tracking-wider uppercase font-sans font-medium px-2 py-0.5 rounded-full ${customer.role === 'admin' ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-500'}`}>
                      {customer.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-sans text-gray-400">{new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                  <td className="px-5 py-4 text-xs font-sans text-gray-500">{customer.wishlist?.length || 0} items</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
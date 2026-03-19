import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import logo from '../assets/logo.jpg';

// ── Local Storage Helpers ───────────────────────────────────────────────────
const LOCAL_STORAGE_KEY = 'thaarai_local_products';

const getLocalProducts = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalProduct = (product) => {
  const products = getLocalProducts();
  const newProduct = {
    ...product,
    _id: `local_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([newProduct, ...products]));
  return newProduct;
};

const deleteLocalProduct = (id) => {
  const products = getLocalProducts();
  const filtered = products.filter(p => p._id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
};

// ── Admin Login Component ────────────────────────────────────────────────────
export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@gmail.com' && password === '123456') {
      localStorage.setItem('admin_session', 'active');
      toast.success('Admin access granted');
      navigate('/admin-dashboard');
    } else {
      toast.error('Invalid administrative credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={logo} alt="Thaarai" className="h-8 w-auto transition-all duration-500 rounded-sm" />
            <span className="font-serif text-lg font-bold tracking-tight text-gray-900">THAARAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
          <p className="text-gray-600 text-sm mt-2">Enter your credentials to manage properties</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
              placeholder="admin@gmail.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 ml-1">Security Key</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-[0.98]"
          >
            Authenticate Access
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Admin Dashboard Component ────────────────────────────────────────────────
export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('view');
  const [localProducts, setLocalProducts] = useState(getLocalProducts());
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    price: '',
    image: '',
    category: 'Couture',
    description: '',
  });

  useEffect(() => {
    if (localStorage.getItem('admin_session') !== 'active') {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    navigate('/admin');
    toast.info('Logged out of admin console');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.image) {
      toast.error('Please fill all required fields');
      return;
    }
    
    const newProduct = {
      ...form,
      price: parseFloat(form.price),
      images: [form.image],
      subcategory: 'Local Addition',
    };

    saveLocalProduct(newProduct);
    setLocalProducts(getLocalProducts());
    setForm({ name: '', price: '', image: '', category: 'Couture', description: '' });
    setActiveTab('view');
    toast.success('Product deployed successfully');
  };

  const handleDelete = (id) => {
    if (window.confirm('Erase this product from local registry?')) {
      deleteLocalProduct(id);
      setLocalProducts(getLocalProducts());
      toast.error('Product erased');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col pt-8">
        <div className="px-8 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <span className="font-serif text-lg font-bold text-gray-900 tracking-tight">THAARAI <span className="text-[10px] text-blue-600 uppercase font-sans">Admin</span></span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('view')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-medium ${activeTab === 'view' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <span className="text-xl">📁</span> Product Registry
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-medium ${activeTab === 'add' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <span className="text-xl">✨</span> New Acquisition
          </button>
        </nav>

        <div className="p-8 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full py-3 border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-100 rounded-xl transition-all text-sm font-bold uppercase tracking-widest"
          >
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{activeTab === 'view' ? 'Product Registry' : 'New Acquisition'}</h2>
            <p className="text-gray-500 mt-1">{activeTab === 'view' ? `Managing ${localProducts.length} local items` : 'Initialize a new product entry'}</p>
          </div>
          <Link to="/" className="text-[11px] font-bold uppercase tracking-widest text-blue-600 hover:underline">View Storefront →</Link>
        </header>

        {activeTab === 'add' ? (
          <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Identity Name</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. Silk Radiance Wrap"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Value (Price)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm({...form, price: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="250"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Media URL</label>
                <input
                  value={form.image}
                  onChange={e => setForm({...form, image: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="https://images.unsplash.com/..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Classification</label>
                <select
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option>Couture</option>
                  <option>Handbags</option>
                  <option>Heritage</option>
                  <option>Silk Scarves</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Description Archive</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[120px]"
                  placeholder="The details of the acquisition..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                Deploy Product
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {localProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl text-gray-300">📁</div>
                <h3 className="text-lg font-bold text-gray-900">No local items indexed</h3>
                <p className="text-gray-500 text-sm mt-2">Start by initializing a new acquisition.</p>
                <button onClick={() => setActiveTab('add')} className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold transition-all hover:bg-blue-700">Add First Product</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {localProducts.map(product => (
                  <div key={product._id} className="bg-white rounded-2xl border border-gray-100 p-6 flex gap-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-32 aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-xl text-gray-900">{product.name}</h3>
                          <span className="text-blue-600 font-bold text-lg">
                            {product.price?.toLocaleString('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              maximumFractionDigits: 0
                            })}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">{product.category}</p>
                        <p className="text-gray-500 text-sm mt-4 line-clamp-2">{product.description || 'No archive description available.'}</p>
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => handleDelete(product._id)} className="px-4 py-2 border border-gray-100 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-all">Erase</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

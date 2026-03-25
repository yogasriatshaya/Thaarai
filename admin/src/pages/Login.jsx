import { useState } from 'react';
import logo from '../assets/logo.jpg';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/admin/login', form);
      if (res.data.success) {
        localStorage.setItem('adminToken', res.data.token);
        navigate('/dashboard');
        toast.success('Welcome to Thaarai Admin');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <img src={logo} alt="Thaarai" className="h-12 w-auto object-contain brightness-0 invert" />
          </div>
          <p className="text-[9px] tracking-[0.35em] uppercase text-gold-500 font-sans">Admin Portal</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-8">
          <h2 className="font-serif text-xl text-white mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-white/50 mb-2">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-white/10 border border-white/20 text-white px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-gold-500 transition-colors placeholder-white/30"
                placeholder="admin@cube.com" required />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.2em] uppercase font-sans text-white/50 mb-2">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                className="w-full bg-white/10 border border-white/20 text-white px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-gold-500 transition-colors placeholder-white/30"
                placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gold-600 text-white py-3 text-xs tracking-[0.2em] uppercase font-sans font-medium hover:bg-gold-700 transition-colors mt-2 disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-xs text-white/30 font-sans mt-5 text-center">
            Default: admin@cube.com / Admin@123
          </p>
        </div>
      </div>
    </div>
  );
}

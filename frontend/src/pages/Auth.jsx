import { useState } from 'react';
import logo from '../assets/logo.jpg';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useShop } from '../context/ShopContext';
import { toast } from 'react-toastify';
import { AUTH_LOGIN, AUTH_REGISTER } from '../assets/images';

const InputGroup = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{label}</label>
    {children}
  </div>
);

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useShop();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/');
        toast.success(`Welcome back, ${res.data.user.name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left column — visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-50">
        <img
          src={AUTH_LOGIN}
          alt="Thaarai"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/60" />
        <div className="absolute bottom-16 left-12 right-12">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-blue-600 mb-4">Thaarai Atelier</p>
          <h2 className="font-serif text-5xl text-gray-900 font-bold mb-4 leading-tight">
            Elegance is not about being noticed, it's about being remembered.
          </h2>
          <p className="text-gray-500 text-sm">— Giorgio Armani</p>
        </div>
      </div>

      {/* Right column — form */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <img src={logo} alt="Thaarai" className="h-10 w-auto object-contain transition-all duration-500 rounded-sm" />
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-gray-900 block leading-none">THAARAI</span>
              <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-blue-600">Atelier de Luxe</span>
            </div>
          </Link>

          <div className="mb-10">
            <h1 className="font-serif text-4xl text-gray-900 font-bold mb-2">Sign In</h1>
            <p className="text-gray-600 text-sm">Welcome back to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <InputGroup label="Email Address">
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </InputGroup>

            <InputGroup label="Password">
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </InputGroup>

            <div className="flex justify-end">
              <button type="button" className="text-[11px] font-medium text-gray-400 hover:text-blue-600 transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-40"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              New to Thaarai?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useShop();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/register', form);
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/');
        toast.success(`Welcome to Thaarai, ${res.data.user.name}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left column */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-50">
        <img
          src={AUTH_REGISTER}
          alt="Thaarai"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/60" />
        <div className="absolute bottom-16 left-12 right-12">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-blue-600 mb-4">Join the Maison</p>
          <h2 className="font-serif text-5xl text-gray-900 font-bold leading-tight">
            Where artistry meets timeless luxury.
          </h2>
        </div>
      </div>

      {/* Right column */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <img src={logo} alt="Thaarai" className="h-10 w-auto object-contain transition-all duration-500 rounded-sm" />
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-gray-900 block leading-none">THAARAI</span>
              <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-blue-600">Atelier de Luxe</span>
            </div>
          </Link>

          <div className="mb-10">
            <h1 className="font-serif text-4xl text-gray-900 font-bold mb-2">Create Account</h1>
            <p className="text-gray-600 text-sm">Join the Thaarai clientele</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputGroup label="Full Name">
              <input
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="input-field"
                placeholder="Your full name"
                required
              />
            </InputGroup>

            <InputGroup label="Email Address">
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </InputGroup>

            <InputGroup label="Password">
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="input-field"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </InputGroup>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-40 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already a member?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

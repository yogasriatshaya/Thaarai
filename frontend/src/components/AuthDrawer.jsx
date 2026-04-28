import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useShop } from '../context/ShopContext';
import { toast } from 'react-toastify';
import LogoutConfirmModal from './LogoutConfirmModal';

const InputGroup = ({ label, children, error }) => (
  <div className="space-y-2 group">
    <div className="flex justify-between items-center px-1">
      <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-black group-focus-within:opacity-60 transition-colors italic">{label}</label>
      {error && <span className="text-[9px] text-rose-500 font-medium">{error}</span>}
    </div>
    {children}
  </div>
);

const BenefitIcon = ({ children }) => (
  <div className="text-black mb-1 flex justify-center scale-110">
    {children}
  </div>
);

export default function AuthDrawer({ isOpen, onClose }) {
  const [view, setView] = useState('login'); // 'login', 'register', 'otp'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { login, user, logout } = useShop();
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Reset form when drawer opens/closes or view changes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('login');
        setForm({ name: '', email: '', password: '' });
        setOtp('');
        setErrors({});
      }, 500);
    }
  }, [isOpen]);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) error = 'Required';
      else if (!emailRegex.test(value)) error = 'Invalid email';
    } else if (name === 'password') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}$/;
      if (!value) error = 'Required';
      else if (value.length > 25) error = 'Max 25 characters';
      else if (!passwordRegex.test(value)) error = 'Must meet requirements';
    } else if (name === 'name' && view === 'register') {
      if (!value) error = 'Required';
      else if (value.length > 25) error = 'Max 25 characters';
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const isEmailValid = validateField('email', form.email);
    const isPassValid = validateField('password', form.password);
    if (!isEmailValid || !isPassValid) return;
    
    try {
      const res = await API.post('/auth/login', { email: form.email, password: form.password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        toast.success(`Welcome back, ${res.data.user.name}`);
        onClose();
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.accountNotFound) {
        toast.info('This account does not exist. Please register first.');
        setView('register');
      } else if (data?.unverfied) {
        toast.info('Please verify your email.');
        setView('otp');
        setTimer(60);
      } else {
        toast.error(data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const isNameValid = validateField('name', form.name);
    const isEmailValid = validateField('email', form.email);
    const isPassValid = validateField('password', form.password);
    
    if (!isNameValid || !isEmailValid || !isPassValid) return;
    
    setLoading(true);
    try {
      const res = await API.post('/auth/register', form);
      if (res.data.success) {
        setView('otp');
        setTimer(60);
        if (res.data.mailSent) {
          toast.success('Verification code sent to your email');
        } else {
          toast.warning('Email service unavailable. Check console for code.');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', { email: form.email, otp });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        toast.success(`Welcome ${res.data.user.name}`);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    const isEmailValid = validateField('email', form.email);
    if (!isEmailValid) return;

    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email: form.email });
      if (res.data.success) {
        setView('reset');
        setTimer(60);
        if (res.data.mailSent) {
          toast.success('Reset code sent to your email');
        } else {
          toast.warning('Check console for reset code');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const isPassValid = validateField('password', form.password);
    if (!isPassValid) return;

    setLoading(true);
    try {
      const res = await API.post('/auth/reset-password', { 
        email: form.email, 
        otp, 
        newPassword: form.password 
      });
      if (res.data.success) {
        toast.success('Password updated successfully');
        setView('login');
        setForm(prev => ({ ...prev, password: '' }));
        setOtp('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      const endpoint = view === 'reset' ? '/auth/forgot-password' : '/auth/resend-otp';
      const res = await API.post(endpoint, { email: form.email });
      setTimer(60);
      if (res.data.mailSent) {
        toast.success('New code sent to email');
      } else {
        toast.warning('Check console for code.');
      }
    } catch (err) {
      toast.error('Failed to resend code');
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-white z-[101] shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2 border-b border-gray-50">
          <h2 className="font-serif text-2xl font-black tracking-[0.1em] uppercase text-black">
            {user ? 'Account' : 
             view === 'login' ? 'Sign In' : 
             view === 'register' ? 'Register' : 
             view === 'forgot' ? 'Recovery' : 
             'Verify'}
          </h2>
          <button onClick={onClose} className="p-2 hover:opacity-50 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar">
          {user ? (
            <div className="space-y-8 animate-fade-in text-center">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-[#999] font-bold">Signed in as</p>
                <h3 className="text-4xl font-serif font-bold text-black">{user.name}</h3>
                <p className="text-[13px] text-[#666] tracking-wide font-medium">{user.email}</p>
              </div>

              <div className="pt-4 grid grid-cols-1 gap-3">
                <button 
                  onClick={() => { navigate('/orders'); onClose(); }}
                  className="w-full py-2.5 border-2 border-black text-[13px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300"
                >
                  Manage Orders
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-3 border border-gray-100 bg-gray-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Sign Out
                </button>
              </div>
            </div>
          ) : view === 'login' ? (
            <div className="animate-fade-in">
              <form onSubmit={handleLogin} className="space-y-4">
                <InputGroup label="Email Address" error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onBlur={handleBlur}
                    maxLength={40}
                    className="w-full px-4 py-2 bg-white border border-gray-400 outline-none focus:border-black transition-all text-sm font-medium tracking-wide"
                    placeholder="example@email.com"
                    required
                  />
                </InputGroup>

                <InputGroup label="Password" error={errors.password}>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onBlur={handleBlur}
                    maxLength={25}
                    className="w-full px-4 py-2 bg-white border border-gray-400 outline-none focus:border-black transition-all text-sm font-medium"
                    placeholder="••••••••"
                    required
                  />
                </InputGroup>

                <div className="flex justify-between items-center text-[10px] px-1 font-bold">
                  <label className="flex items-center gap-2 cursor-pointer text-[#666] hover:text-black transition-colors">
                    <input type="checkbox" className="w-3.5 h-3.5 border-gray-300 rounded" />
                    Remember me
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setView('forgot')}
                    className="text-black border-b border-gray-100 pb-0.5 uppercase tracking-widest font-black"
                  >
                    Forgot password?
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-black text-white text-[13px] font-black uppercase tracking-[0.25em] hover:opacity-90 transition-all disabled:opacity-50 mt-1"
                >
                  {loading ? 'Processing...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-8 text-center border-t border-gray-100 pt-6">
                <p className="font-serif text-lg italic text-[#666] mb-4">New to our studio?</p>
                <button 
                  onClick={() => setView('register')}
                  className="w-full py-2.5 border-2 border-black text-[12px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300"
                >
                  Create An Account
                </button>
              </div>
            </div>
          ) : view === 'forgot' ? (
            <div className="animate-fade-in space-y-6">
               <div className="space-y-2 text-center mb-4">
                  <p className="text-sm italic font-serif text-gray-500">Lost your key?</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black">Enter email for reset code</p>
               </div>
               <form onSubmit={handleForgot} className="space-y-6">
                  <InputGroup label="Registered Email" error={errors.email}>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      onBlur={handleBlur}
                      maxLength={40}
                      className="w-full px-4 py-2 border border-gray-400 outline-none focus:border-black text-sm font-medium tracking-wide"
                      placeholder="example@email.com"
                      required
                    />
                  </InputGroup>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-black text-white text-[12px] font-black uppercase tracking-[0.3em] hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setView('login')}
                    className="w-full text-center text-[10px] font-black uppercase tracking-widest text-[#999] hover:text-black transition-colors"
                  >
                    Back to Sign In
                  </button>
               </form>
            </div>
          ) : view === 'register' ? (
            <div className="animate-fade-in">
              <form onSubmit={handleRegister} className="space-y-3">
                <InputGroup label="Full Name" error={errors.name}>
                  <input
                    name="name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    maxLength={25}
                    onBlur={handleBlur}
                    className="w-full px-4 py-2 border border-gray-400 outline-none focus:border-black text-sm font-medium tracking-wide"
                    placeholder="Enter full name"
                    required
                  />
                </InputGroup>

                <InputGroup label="Email Address" error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onBlur={handleBlur}
                    maxLength={40}
                    className="w-full px-4 py-2 border border-gray-400 outline-none focus:border-black text-sm font-medium tracking-wide"
                    placeholder="example@email.com"
                    required
                  />
                </InputGroup>

                <InputGroup label="Secure Password" error={errors.password}>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onBlur={handleBlur}
                    maxLength={25}
                    className="w-full px-4 py-2 border border-gray-400 outline-none focus:border-black text-sm font-medium"
                    placeholder="Create password"
                    required
                  />
                  <p className="text-[9px] text-[#999] tracking-tight mt-1 px-1 leading-relaxed italic font-medium">
                    (8-25 chars, Uppercase, Lowercase, Number & Special)
                  </p>
                </InputGroup>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-2.5 bg-black text-white text-[12px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 mt-1"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>

                <button 
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full text-[10px] font-black uppercase tracking-widest text-[#999] hover:text-black transition-colors pt-2"
                >
                  Back to Sign In
                </button>
              </form>
            </div>
          ) : (
             <div className="animate-fade-in text-center px-1">
              <p className="text-[13px] text-[#666] mb-4 leading-relaxed font-medium">
                {view === 'reset' ? "Set your new password below" : "Enter the verification code"} sent to <br/>
                <span className="text-black font-black tracking-tight">{form.email}</span>
              </p>
              
              <form onSubmit={view === 'reset' ? handleReset : handleVerify} className="space-y-6">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-4xl font-serif tracking-[0.4em] py-1 border-b-2 border-gray-400 focus:border-black outline-none transition-all text-black font-bold"
                  placeholder="000000"
                  required
                />

                {view === 'reset' && (
                  <InputGroup label="New Password" error={errors.password}>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      onBlur={handleBlur}
                      maxLength={25}
                      className="w-full px-4 py-2 border border-gray-400 outline-none focus:border-black text-sm font-medium"
                      placeholder="Enter new password"
                      required
                    />
                  </InputGroup>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-2.5 bg-black text-white text-[12px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : view === 'reset' ? 'Reset Password' : 'Verify & Complete'}
                </button>

                <div className="space-y-4">
                  <p className="text-[11px] uppercase tracking-widest text-[#999] font-black">
                    Didn't receive code?{' '}
                    <button 
                      type="button"
                      onClick={handleResend}
                      disabled={timer > 0}
                      className={`transition-colors border-b border-gray-100 pb-0.5 ${timer > 0 ? 'text-gray-200' : 'text-black'}`}
                    >
                      {timer > 0 ? `Resend ${timer}s` : 'Resend'}
                    </button>
                  </p>
                  <button 
                    type="button" 
                    onClick={() => setView(view === 'reset' ? 'forgot' : 'register')}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-[#999] hover:text-black transition-colors"
                  >
                    Change Email Address
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Order Tracking Button */}
          <div className="mt-6">
            <button 
              onClick={() => { navigate('/track-order'); onClose(); }}
              className="w-full py-3 border border-gray-100 bg-gray-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
              Track Order
            </button>
          </div>
        </div>
      </div>

      <LogoutConfirmModal 
        isOpen={showLogoutConfirm} 
        onConfirm={() => {
          logout();
          navigate('/');
          setShowLogoutConfirm(false);
          onClose();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}

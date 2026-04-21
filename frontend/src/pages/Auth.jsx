import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { useShop } from '../context/ShopContext';
import { toast } from 'react-toastify';
import { AUTH_LOGIN, AUTH_REGISTER } from '../assets/images';

const InputGroup = ({ label, children, error }) => (
  <div className="space-y-1.5 group">
    <div className="flex justify-between items-center">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 group-focus-within:text-indigo-600 transition-colors">{label}</label>
      {error && <span className="text-[10px] text-rose-500 font-medium">{error}</span>}
    </div>
    {children}
  </div>
);

export function Login() {
  const [view, setView] = useState('login'); // 'login', 'forgot', 'reset'
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const { login } = useShop();
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

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
      if (err.response?.data?.unverfied) {
        toast.info('Please verify your email to continue.');
        navigate('/register', { state: { email: form.email, step: 'otp' } });
      } else {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!form.email) return toast.error('Email is required');
    
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
    if (!form.password) return toast.error('New password is required');
    if (otp.length < 6) return toast.error('Valid reset code is required');

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
      const res = await API.post('/auth/forgot-password', { email: form.email });
      setTimer(60);
      if (res.data.mailSent) {
        toast.success('New code sent to email');
      } else {
        toast.warning('Check console for reset code');
      }
    } catch (err) {
      toast.error('Failed to resend code');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-8 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60 animate-pulse-subtle" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-100 rounded-full blur-[120px] opacity-60 animate-pulse-subtle" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <Link to="/" className="inline-flex items-center gap-4 mb-12 group">
          <div className="w-12 h-12 bg-white shadow-xl flex items-center justify-center rounded-2xl group-hover:rotate-12 transition-transform duration-500">
            <img src="/thaarai-logo.png" alt="Thaarai" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-gray-900 block leading-none">THAARAI</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-600">The Designer Studio</span>
          </div>
        </Link>

        {view === 'login' ? (
          <div className="animate-fade-in">
            <div className="mb-10">
              <h1 className="font-serif text-4xl text-gray-900 font-bold mb-3">Welcome Back</h1>
              <p className="text-gray-500 text-sm">Please enter your details to sign in</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <InputGroup label="Email Address">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 text-gray-800"
                  placeholder="hello@example.com"
                  required
                />
              </InputGroup>

              <InputGroup label="Password">
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  maxLength={25}
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 text-gray-800"
                  placeholder="••••••••"
                  required
                />
              </InputGroup>

              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setView('forgot')}
                  className="text-xs font-semibold text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gray-900 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/30 transition-all duration-500 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? 'Authenticating...' : 'Sign In Now'}
                  {!loading && <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                </span>
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-sm text-gray-500">
                New to Thaarai Experience?{' '}
                <Link to="/register" className="font-bold text-gray-900 underline decoration-indigo-200 hover:decoration-indigo-500 underline-offset-4 transition-all">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        ) : view === 'forgot' ? (
          <div className="animate-fade-in">
            <div className="mb-10">
              <h1 className="font-serif text-3xl text-gray-900 font-bold mb-3">Password Recovery</h1>
              <p className="text-gray-500 text-sm">Enter your email to receive a reset code</p>
            </div>

            <form onSubmit={handleForgot} className="space-y-6">
              <InputGroup label="Registered Email Address">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 text-gray-800"
                  placeholder="hello@example.com"
                  required
                />
              </InputGroup>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gray-900 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/30 transition-all duration-500 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? 'Sending Code...' : 'Send Reset Code'}
                  {!loading && <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                </span>
              </button>

              <div className="mt-8 text-center border-t border-gray-100 pt-6">
                <button 
                  type="button" 
                  onClick={() => setView('login')}
                  className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="animate-fade-in text-center">
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              </div>
              <h1 className="font-serif text-3xl text-gray-900 font-bold mb-3">Reset Password</h1>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">We've sent a 6-digit code to <span className="text-gray-900 font-semibold">{form.email}</span></p>
            </div>

            <form onSubmit={handleReset} className="space-y-8 text-left">
              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full max-w-[240px] text-center text-4xl font-serif tracking-[0.5em] px-4 py-4 bg-white border-b-2 border-indigo-200 focus:border-indigo-600 outline-none transition-all duration-300 text-gray-900"
                  placeholder="000000"
                  required
                  autoFocus
                />
              </div>

              <InputGroup label="New Password">
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  maxLength={25}
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 text-gray-800"
                  placeholder="Enter new password"
                  required
                />
              </InputGroup>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-40"
              >
                {loading ? 'Resetting...' : 'Create New Password'}
              </button>

              <div className="text-center space-y-4">
                 <p className="text-xs text-gray-400">
                  Didn't receive code?{' '}
                  <button 
                    type="button"
                    onClick={handleResend}
                    disabled={timer > 0}
                    className={`font-bold transition-colors ${timer > 0 ? 'text-gray-300' : 'text-indigo-600 hover:text-indigo-800'}`}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend Code Now'}
                  </button>
                </p>
                <div className="pt-2 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setView('login')}
                    className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export function Register() {
  const location = useLocation();
  const [step, setStep] = useState(location.state?.step || 'register'); // 'register' or 'otp'
  const [form, setForm] = useState({ 
    name: '', 
    email: location.state?.email || '', 
    password: '' 
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useShop();
  const navigate = useNavigate();
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (location.state?.step) setStep(location.state.step);
    if (location.state?.email) setForm(f => ({ ...f, email: location.state.email }));
  }, [location.state]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validate = () => {
    const newErrors = {};
    if (form.name.length > 25) newErrors.name = "Max 25 characters";
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,25}$/;
    if (!passwordRegex.test(form.password)) {
      newErrors.password = "Must be 8-25 chars with Uppercase, Lowercase & Number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const res = await API.post('/auth/register', form);
      if (res.data.success) {
        setStep('otp');
        setTimer(60);
        if (res.data.mailSent) {
          toast.success('Verification OTP sent to your email.');
        } else {
          toast.warning('Check server console for OTP. Email service unavailable.');
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
        navigate('/');
        toast.success(`Registration complete! Welcome ${res.data.user.name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await API.post('/auth/resend-otp', { email: form.email });
      setTimer(60);
      toast.success('New OTP sent');
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60 animate-pulse-subtle" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60 animate-pulse-subtle" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <Link to="/" className="inline-flex items-center gap-4 mb-12 group">
           <div className="w-12 h-12 bg-white shadow-xl flex items-center justify-center rounded-2xl group-hover:-rotate-12 transition-transform duration-500 border border-gray-50">
            <img src="/thaarai-logo.png" alt="Thaarai" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-gray-900 block leading-none">THAARAI</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose-600">The Designer Studio</span>
          </div>
        </Link>

        {step === 'register' ? (
          <>
            <div className="mb-10">
              <h1 className="font-serif text-4xl text-gray-900 font-bold mb-3">Create Journey</h1>
              <p className="text-gray-500 text-sm">Join the family of luxury and tradition</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <InputGroup label="Full Name" error={errors.name}>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  maxLength={25}
                  className={`w-full px-6 py-4 bg-white border ${errors.name ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-100 focus:border-rose-500 focus:ring-rose-500/10'} rounded-2xl shadow-sm outline-none transition-all duration-300 text-gray-800`}
                  placeholder="Jane Doe"
                  required
                />
              </InputGroup>

              <InputGroup label="Email Address">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  maxLength={40}
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-rose-500 focus:ring-rose-500/10 outline-none transition-all duration-300 text-gray-800"
                  placeholder="jane@example.com"
                  required
                />
              </InputGroup>

              <InputGroup label="Secure Password" error={errors.password}>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  maxLength={25}
                  className={`w-full px-6 py-4 bg-white border ${errors.password ? 'border-rose-500 focus:ring-rose-500/10' : 'border-gray-100 focus:border-rose-500 focus:ring-rose-500/10'} rounded-2xl shadow-sm outline-none transition-all duration-300 text-gray-800`}
                  placeholder="••••••••"
                  required
                />
              </InputGroup>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gray-900 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/10 hover:shadow-rose-500/30 transition-all duration-500 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 group mt-4"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? 'Creating Account...' : 'Continue to Verify'}
                  {!loading && <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                </span>
              </button>
            </form>
          </>
        ) : (
          <div className="animate-fade-in">
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h1 className="font-serif text-3xl text-gray-900 font-bold mb-3">Verify Identity</h1>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">We've sent a 6-digit code to <span className="text-gray-900 font-semibold">{form.email}</span></p>
            </div>

            <form onSubmit={handleVerify} className="space-y-8">
              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full max-w-[240px] text-center text-4xl font-serif tracking-[0.5em] px-4 py-4 bg-white border-b-2 border-indigo-200 focus:border-indigo-600 outline-none transition-all duration-300 text-gray-900"
                  placeholder="000000"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-40"
              >
                {loading ? 'Verifying...' : 'Complete Registration'}
              </button>

              <div className="text-center space-y-4">
                 <p className="text-xs text-gray-400">
                  Didn't receive code?{' '}
                  <button 
                    type="button"
                    onClick={handleResend}
                    disabled={timer > 0}
                    className={`font-bold transition-colors ${timer > 0 ? 'text-gray-300' : 'text-indigo-600 hover:text-indigo-800'}`}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend Code Now'}
                  </button>
                </p>
                <button 
                  type="button" 
                  onClick={() => setStep('register')}
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                >
                  ← Change Email Address
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-gray-900 underline decoration-rose-200 hover:decoration-rose-500 underline-offset-4 transition-all">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


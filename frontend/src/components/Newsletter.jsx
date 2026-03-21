import { useState } from 'react';
import { toast } from 'react-toastify';
import { NEWSLETTER_BG } from '../assets/images';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      toast.success('You are now a part of Aara family!');
      setEmail('');
    }
  };

  return (
    <section className="relative overflow-hidden border-t border-gray-100" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 50%, #f9fafb 100%)' }}>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-20 text-center">
        <span className="font-bold text-[8px] uppercase tracking-[0.4em] mb-3 block" style={{ color: '#8b7fc0' }}>
          Stay Connected
        </span>
        <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4 tracking-tight">
          Join the Aara Family
        </h2>
        <p className="text-gray-700 max-w-lg mx-auto leading-relaxed mb-8 text-sm font-normal">
          Sign up to get first dibs on new arrivals, sales, exclusive content, events, and more!
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto gap-0 border border-gray-300 transition-all duration-500 bg-white/90 backdrop-blur-md rounded-xl overflow-hidden shadow-xl"
          style={{ '--focus-color': 'rgba(171, 160, 227, 0.5)' }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(171, 160, 227, 0.5)'}
          onBlur={e => e.currentTarget.style.borderColor = ''}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-1 px-6 py-3 bg-transparent text-gray-900 text-[10px] font-bold uppercase tracking-widest placeholder-gray-400 outline-none"
            required
          />
          <button type="submit" className="text-white px-8 font-bold text-[10px] uppercase tracking-widest transition-all shrink-0"
            style={{ backgroundColor: '#aba0e3' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#9589d4'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#aba0e3'}>
            Subscribe
          </button>
        </form>
        <p className="text-[8px] text-gray-500 mt-6 uppercase tracking-[0.2em] font-bold leading-loose">
          By subscribing you agree to our <br className="sm:hidden" />
          <span className="text-gray-700 cursor-pointer transition-colors border-b border-gray-200"
            style={{ '--hover-color': '#aba0e3' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#aba0e3'; e.currentTarget.style.borderColor = 'rgba(171, 160, 227, 0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = ''; }}>Privacy Policy</span>
        </p>
      </div>
    </section>
  );
}

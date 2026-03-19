import { useState } from 'react';
import { toast } from 'react-toastify';
import { NEWSLETTER_BG } from '../assets/images';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      toast.success('Joined the Inner Circle');
      setEmail('');
    }
  };

  return (
    <section
      className="relative overflow-hidden group bg-gray-50 border-t border-gray-100"
      style={{
        backgroundImage: `url('${NEWSLETTER_BG}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm transition-all duration-700 group-hover:bg-white/40" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        <span className="text-blue-600 font-bold text-[8px] uppercase tracking-[0.4em] mb-4 block">
          Exclusive Access
        </span>
        <h2 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 mt-2 mb-6 tracking-tight">
          The Maison Inner Circle
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto leading-relaxed mb-10 text-sm font-light">
          Be the first to experience our seasonal collections, private atelier events, and limited member previews.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto gap-0 border border-gray-200 focus-within:border-blue-600/50 transition-all duration-500 bg-white/80 backdrop-blur-md rounded-xl overflow-hidden shadow-xl">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-1 px-8 py-4 bg-transparent text-gray-900 text-[10px] font-bold uppercase tracking-widest placeholder-gray-400 outline-none"
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-10 font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shrink-0">
            Subscribe
          </button>
        </form>
        <p className="text-[8px] text-gray-400 mt-8 uppercase tracking-[0.2em] font-bold leading-loose">
          By subscribing you agree to our <br className="sm:hidden" />
          <span className="text-gray-600 hover:text-blue-600 cursor-pointer transition-colors border-b border-gray-100 hover:border-blue-600/30">Privacy Policy</span>
        </p>
      </div>
    </section>
  );
}


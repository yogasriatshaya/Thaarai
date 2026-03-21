import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem('exit_popup_seen')) return;

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !shown.current) {
        shown.current = true;
        setVisible(true);
        sessionStorage.setItem('exit_popup_seen', '1');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setTimeout(() => setVisible(false), 2000);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.55)' }}>
      <div className="relative bg-white max-w-lg w-full shadow-2xl overflow-hidden rounded-2xl animate-fade-in">
        {/* Blue top accent */}
        <div className="h-1 bg-blue-600 w-full" />

        <button onClick={() => setVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors text-2xl leading-none">×</button>

        <div className="p-10 text-center">
          <span className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.4em] mb-3 block">Exclusive Offer</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">Before You Go...</h2>
          <p className="text-gray-500 text-sm mb-2 font-light">Join Aara and receive</p>
          <p className="text-5xl font-serif font-bold text-blue-600 mb-3">10% Off</p>
          <p className="text-gray-400 text-xs mb-8 uppercase tracking-widest font-bold">Your First Order</p>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <p className="text-emerald-700 font-bold uppercase tracking-widest text-sm">✓ Welcome to Aara!</p>
              <p className="text-emerald-600 text-xs mt-1">Your code has been sent to your inbox.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 border border-gray-200 px-5 py-3.5 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-blue-600 transition-all rounded-xl"
              />
              <button type="submit"
                className="bg-blue-600 text-white font-bold uppercase tracking-widest text-xs px-6 py-3.5 hover:bg-blue-700 transition-all rounded-xl whitespace-nowrap">
                Claim Offer
              </button>
            </form>
          )}
          <button onClick={() => setVisible(false)}
            className="mt-6 text-[10px] text-gray-400 hover:text-gray-600 uppercase tracking-widest font-bold transition-colors">
            No thanks, I'll pay full price
          </button>
        </div>
      </div>
    </div>
  );
}

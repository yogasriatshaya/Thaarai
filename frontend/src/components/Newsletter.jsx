import { useState } from 'react';
import { toast } from 'react-toastify';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email) {
      setIsLoading(true);
      setTimeout(() => {
        toast.success('✓ Welcome to the Inner Circle');
        setEmail('');
        setIsLoading(false);
      }, 800);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mx-auto">
        {/* Luxury Form Container */}
        <div className="relative bg-white rounded-none overflow-hidden">
          {/* Premium layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {/* Email Input Section */}
            <div className="md:col-span-2 relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-10 py-8 md:py-6 text-base font-light bg-white text-black placeholder-gray-400 focus:outline-none transition-all duration-300 border-0 focus:ring-0"
                required
              />
              {/* Subtle bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300" />
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#101e42] text-white px-10 py-8 md:py-6 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 hover:bg-[#1c3c7d] hover:shadow-[0_0_30px_rgba(16,30,66,0.3)] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              {/* Animated background on hover (Silver shimmer) */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              
              {/* Text */}
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
        
        {/* Luxury Elements Below */}
        <div className="mt-10 text-center space-y-4">
          <p className="text-white text-xs font-light tracking-[0.25em] uppercase">
            Join 5,000+ luxury enthusiasts
          </p>
          <p className="text-slate-200 text-xs font-light">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </form>
  );
}

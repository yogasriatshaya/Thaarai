import { useState } from 'react';
import { toast } from 'react-toastify';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      toast.success('Welcome to the Inner Circle!');
      setEmail('');
    }
  };

  return (
    <section className="bg-gray-900 py-16">
      <div className="max-w-[1280px] mx-auto px-6 text-center">
        <p className="section-label text-primary mb-3">Exclusive Access</p>
        <h2 className="font-serif text-3xl text-white mb-3">Join the Inner Circle</h2>
        <p className="text-sm text-gray-300 font-sans mb-8 tracking-wide">
          Be the first to experience our new seasonal drops and private salon events.
        </p>
        <form onSubmit={handleSubmit} className="flex max-w-md mx-auto gap-0">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-5 py-3.5 text-sm font-sans bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
            required
          />
          <button type="submit" className="bg-primary text-white px-7 py-3.5 text-xs tracking-[0.2em] uppercase font-sans font-medium hover:bg-primary-dark transition-colors shrink-0">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}

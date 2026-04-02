import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function CountrySwitcher() {
  const { country, setCountry, countryFlag, currency, countries } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-sans font-medium border border-gray-200 rounded-full hover:border-gray-400 transition-all bg-white/80 backdrop-blur-sm"
        id="country-switcher"
      >
        <span className="text-sm">{countryFlag}</span>
        <span className="tracking-wider uppercase text-[10px] font-bold text-gray-600">{currency}</span>
        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          className={`transition-transform duration-200 text-gray-400 ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-gray-100 shadow-2xl shadow-gray-200/50 z-50 overflow-hidden min-w-[180px] animate-fade-in">
          <div className="px-3 py-2 border-b border-gray-50">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Ship To / Currency</p>
          </div>
          {Object.entries(countries).map(([code, info]) => (
            <button
              key={code}
              onClick={() => { setCountry(code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                country === code
                  ? 'bg-purple-50 text-purple-700'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-lg">{info.flag}</span>
              <div className="flex-1">
                <p className="font-medium text-xs">{info.name}</p>
                <p className="text-[10px] text-gray-400 font-bold">{info.symbol} {info.currency}</p>
              </div>
              {country === code && (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-purple-600">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

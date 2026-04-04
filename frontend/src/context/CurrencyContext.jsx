import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api';
import { formatPrice as formatPriceFn, getCurrencySymbol, getLocaleForCurrency } from '../utils/priceUtils';

const CurrencyContext = createContext();

const COUNTRY_MAP = {
  IN: { currency: 'INR', symbol: '₹', name: 'India', flag: '🇮🇳' },
  US: { currency: 'USD', symbol: '$', name: 'United States', flag: '🇺🇸' }
};

export const CurrencyProvider = ({ children }) => {
  const [country, setCountryState] = useState(() => {
    return localStorage.getItem('thaarai_country') || 'IN';
  });
  const [geoDetected, setGeoDetected] = useState(false);

  const currency = COUNTRY_MAP[country]?.currency || 'INR';
  const currencySymbol = COUNTRY_MAP[country]?.symbol || '₹';
  const countryName = COUNTRY_MAP[country]?.name || 'India';
  const countryFlag = COUNTRY_MAP[country]?.flag || '🇮🇳';

  // On mount: check if user has saved preference, else try geo-detection
  useEffect(() => {
    const saved = localStorage.getItem('thaarai_country');
    if (saved) {
      setCountryState(saved);
      return;
    }

    const performDetection = async () => {
      // 1. Try to detect country from logged-in user profile
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const r = await API.get('/users/profile');
          if (r.data.user?.preferredCountry) {
            const pref = r.data.user.preferredCountry;
            setCountryState(pref);
            localStorage.setItem('thaarai_country', pref);
            setGeoDetected(true);
            return;
          }
        } catch (err) {}
      }

      // 2. Try IP-based Geo Detection (Most accurate)
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code === 'US' || data.country_name === 'United States') {
          setCountryState('US');
          localStorage.setItem('thaarai_country', 'US');
          setGeoDetected(true);
          console.log('Location detected: USA. Switched to $ prices.');
          return;
        } else if (data.country_code === 'IN' || data.country_name === 'India') {
          setCountryState('IN');
          localStorage.setItem('thaarai_country', 'IN');
          setGeoDetected(true);
          console.log('Location detected: India. Switched to ₹ prices.');
          return;
        }
      } catch (err) {
        console.warn('Geo-IP detection failed, using timezone fallback.');
      }

      // 3. Simple timezone-based detection fallback
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (tz.startsWith('America/') || tz.startsWith('US/')) {
          setCountryState('US');
          localStorage.setItem('thaarai_country', 'US');
        } else {
          setCountryState('IN');
          localStorage.setItem('thaarai_country', 'IN');
        }
        setGeoDetected(true);
      } catch (err) {
        // Absolute fallback to base default
        setCountryState('IN');
        localStorage.setItem('thaarai_country', 'IN');
      }
    };

    performDetection();
  }, []);

  const setCountry = useCallback((code) => {
    if (!COUNTRY_MAP[code]) return;
    setCountryState(code);
    localStorage.setItem('thaarai_country', code);

    // If logged in, persist to server
    const token = localStorage.getItem('token');
    if (token) {
      API.put('/users/preferences', {
        preferredCountry: code,
        preferredCurrency: COUNTRY_MAP[code].currency
      }).catch(() => {});
    }
  }, []);

  const formatPrice = useCallback((amount) => {
    return formatPriceFn(amount, currency);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{
      country, currency, currencySymbol, countryName, countryFlag,
      setCountry, formatPrice, geoDetected,
      countries: COUNTRY_MAP
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

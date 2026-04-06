import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';
import { toast } from 'react-toastify';
import { MOCK_PRODUCTS } from '../data/mockProducts';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cartData, setCartData] = useState(JSON.parse(localStorage.getItem('thaarai_guest_cart')) || {});
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('thaarai_guest_cart', JSON.stringify(cartData));
  }, [cartData]);

  const toggleWishlist = async (productId) => {
    // If not logged in, just handle locally
    if (!token) {
      setWishlist(prev =>
        prev.includes(productId)
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      );
      toast.success(!wishlist.includes(productId) ? 'Added to wishlist' : 'Removed from wishlist');
      return;
    }

    // If logged in, sync with backend
    try {
      const res = await API.post('/users/wishlist', { productId });
      if (res.data.success) {
        setWishlist(res.data.wishlist || []);
        toast.success(res.data.wishlist.includes(productId) ? 'Added to wishlist' : 'Removed from wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const isWishlisted = (productId) => wishlist.includes(productId);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/';

  // ROBUST IMAGE URL CONSTRUCTOR
  const getFullImgUrl = (path) => {
    if (!path) return '';
    if (String(path).startsWith('http') || String(path).startsWith('data:')) return path;
    
    // Convert to string and normalize slashes
    let normalizedPath = String(path).replace(/\\/g, '/');
    
    // If the path contains "uploads/", we want everything from "uploads/" onwards
    // This handles cases where absolute Windows paths (e.g. C:\users\...) were saved to DB
    const uploadsIndex = normalizedPath.indexOf('uploads/');
    if (uploadsIndex !== -1) {
      normalizedPath = normalizedPath.substring(uploadsIndex);
    } else {
      // Just ensure no leading slash for clean concatenation
      normalizedPath = normalizedPath.replace(/^\//, '');
    }
    
    const cleanBase = BACKEND_URL.replace(/\/$/, '');
    return `${cleanBase}/${normalizedPath}`;
  };


  useEffect(() => {
    if (token) {
      API.get('/users/profile').then(r => {
        setUser(r.data.user);
        if (r.data.user?.wishlist) setWishlist(r.data.user.wishlist);
      }).catch(() => logout());
      API.get('/cart').then(r => setCartData(r.data.cartData || {})).catch(() => { });
    }
  }, [token]);

  const [settings, setSettings] = useState({ maintenanceMode: false, maintenanceMessage: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await API.get('/settings');
        if (res.data.success) {
          setSettings(res.data.settings);
        }
      } catch (err) {
        console.error('Failed to load site settings', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchGlobalCatalog = async () => {
      try {
        const res = await API.get('/products?limit=500');
        const real = res.data.products || [];
        const localData = localStorage.getItem('thaarai_local_products');
        const locals = localData ? JSON.parse(localData) : [];

        // Remove duplicate mocks if they exist in real db
        const combined = [...locals, ...real];
        const uniqueMocks = MOCK_PRODUCTS.filter(m => !combined.some(c => c.name === m.name));

        setProducts([...combined, ...uniqueMocks]);
      } catch (err) {
        const localData = localStorage.getItem('thaarai_local_products');
        const locals = localData ? JSON.parse(localData) : [];
        setProducts([...locals, ...MOCK_PRODUCTS]);
      }
    };
    fetchGlobalCatalog();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get('/categories');
        if (res.data.success) {
          setCategories(res.data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  const login = (tokenVal, userData) => {
    localStorage.setItem('token', tokenVal);
    setToken(tokenVal);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setCartData({});
    setWishlist(JSON.parse(localStorage.getItem('wishlist')) || []);
  };

  const addToCart = async (productId, size, color) => {
    // ── Handle Mock, Local, or Guest Injection ────────────────────────
    if (!token || productId.startsWith('mock_') || productId.startsWith('local_')) {
      const key = `${productId}-${size}-${color}`;
      setCartData(prev => ({
        ...prev,
        [key]: { productId, size, color, quantity: (prev[key]?.quantity || 0) + 1 }
      }));
      toast.success('Added to cart');
      return;
    }

    try {
      const res = await API.post('/cart/add', { productId, size, color });
      setCartData(res.data.cartData);
      toast.success('Added to cart');
    } catch { toast.error('Failed to add to cart'); }
  };

  const updateCartQty = async (productId, size, color, quantity) => {
    if (!token || productId.startsWith('mock_') || productId.startsWith('local_')) {
      const key = `${productId}-${size}-${color}`;
      setCartData(prev => {
        const newData = { ...prev };
        if (quantity > 0) newData[key] = { ...newData[key], quantity };
        else delete newData[key];
        return newData;
      });
      return;
    }

    try {
      const res = await API.put('/cart/update', { productId, size, color, quantity });
      setCartData(res.data.cartData);
    } catch { toast.error('Failed to update cart'); }
  };

  const removeFromCart = async (productId, size, color) => {
    if (!token || productId.startsWith('mock_') || productId.startsWith('local_')) {
      const key = `${productId}-${size}-${color}`;
      setCartData(prev => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
      return;
    }

    try {
      const res = await API.delete('/cart/remove', { data: { productId, size, color } });
      setCartData(res.data.cartData);
    } catch { toast.error('Failed to remove item'); }
  };

  const cartCount = Object.values(cartData).reduce((sum, item) => sum + (item?.quantity || 0), 0);

  const cartTotal = async () => {
    let total = 0;
    for (const key in cartData) {
      const item = cartData[key];
      if (item?.productId) {
        if (item.productId.startsWith('mock_')) {
          const mock = (await import('../data/mockProducts')).MOCK_PRODUCTS.find(p => p._id === item.productId);
          total += (mock?.price || 0) * item.quantity;
        } else if (item.productId.startsWith('local_')) {
          const localData = localStorage.getItem('thaarai_local_products');
          const locals = localData ? JSON.parse(localData) : [];
          const local = locals.find(p => p._id === item.productId);
          total += (local?.price || 0) * item.quantity;
        } else {
          try {
            const res = await API.get(`/products/${item.productId}`);
            total += res.data.product.price * item.quantity;
          } catch { }
        }
      }
    }
    return total;
  };

  return (
    <ShopContext.Provider value={{
      user, products, categories, cartData, setCartData,
      addToCart, updateCartQty, removeFromCart, cartCount,
      setProducts, BACKEND_URL, getFullImgUrl, cartTotal,
      wishlist, toggleWishlist, isWishlisted, settings,
      login, logout, token
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);

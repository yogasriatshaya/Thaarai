import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';
import { toast } from 'react-toastify';
import { MOCK_PRODUCTS } from '../data/mockProducts';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cartData, setCartData] = useState({});
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
    if (!wishlist.includes(productId)) {
      toast.success('Added to wishlist');
    } else {
      toast.info('Removed from wishlist');
    }
  };

  const isWishlisted = (productId) => wishlist.includes(productId);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

  useEffect(() => {
    if (token) {
      API.get('/users/profile').then(r => setUser(r.data.user)).catch(() => logout());
      API.get('/cart').then(r => setCartData(r.data.cartData || {})).catch(() => {});
    }
  }, [token]);

  // ── Preload Global Catalog for Immediate Search ─────────────────────
  useEffect(() => {
    const fetchGlobalCatalog = async () => {
      try {
        const res = await API.get('/products?limit=500');
        const real = res.data.products || [];
        const localData = localStorage.getItem('aara_local_products');
        const locals = localData ? JSON.parse(localData) : [];
        
        // Remove duplicate mocks if they exist in real db
        const combined = [...locals, ...real];
        const uniqueMocks = MOCK_PRODUCTS.filter(m => !combined.some(c => c.name === m.name));
        
        setProducts([...combined, ...uniqueMocks]);
      } catch (err) {
        const localData = localStorage.getItem('aara_local_products');
        const locals = localData ? JSON.parse(localData) : [];
        setProducts([...locals, ...MOCK_PRODUCTS]);
      }
    };
    fetchGlobalCatalog();
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
  };

  const addToCart = async (productId, size, color) => {
    if (!token) { toast.info('Please login to add to cart'); return; }
    
    // ── Handle Mock & Local Injection ──────────────────────────────────
    if (productId.startsWith('mock_') || productId.startsWith('local_')) {
      const key = `${productId}-${size}-${color}`;
      setCartData(prev => ({
        ...prev,
        [key]: { productId, size, color, quantity: (prev[key]?.quantity || 0) + 1 }
      }));
      toast.success('Local item added to cart (Session only)');
      return;
    }

    try {
      const res = await API.post('/cart/add', { productId, size, color });
      setCartData(res.data.cartData);
      toast.success('Added to cart');
    } catch { toast.error('Failed to add to cart'); }
  };

  const updateCartQty = async (productId, size, color, quantity) => {
    if (productId.startsWith('mock_') || productId.startsWith('local_')) {
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
    if (productId.startsWith('mock_') || productId.startsWith('local_')) {
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
          const localData = localStorage.getItem('aara_local_products');
          const locals = localData ? JSON.parse(localData) : [];
          const local = locals.find(p => p._id === item.productId);
          total += (local?.price || 0) * item.quantity;
        } else {
          try {
            const res = await API.get(`/products/${item.productId}`);
            total += res.data.product.price * item.quantity;
          } catch {}
        }
      }
    }
    return total;
  };

  return (
    <ShopContext.Provider value={{
      user, token, login, logout, cartData, setCartData,
      addToCart, updateCartQty, removeFromCart, cartCount,
      products, setProducts, BACKEND_URL, cartTotal,
      wishlist, toggleWishlist, isWishlisted
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);

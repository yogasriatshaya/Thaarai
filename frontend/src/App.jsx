import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ShopProvider } from './context/ShopContext';
import { CurrencyProvider } from './context/CurrencyContext';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import Home from './pages/Home';
import Collection from './pages/Collection';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { Login, Register } from './pages/Auth';
import { Orders, OrderSuccess } from './pages/Orders';
import { AdminLogin, AdminDashboard } from './pages/Admin';
import About from './pages/About';
import Contact from './pages/Contact';
import TrackOrder from './pages/TrackOrder';
import MobileBottomBar from './components/MobileBottomBar';
// Navigation components consolidated at top
import ExitIntentPopup from './components/ExitIntentPopup';
import RecentlyViewed from './components/RecentlyViewed';
import { useShop } from './context/ShopContext';

const ProtectedRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('admin_session') === 'active';
  return isAdmin ? children : <Navigate to="/admin" />;
};



const MaintenancePage = ({ settings }) => (
  <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center">
    <div className="animate-fade-in">
       <div className="mb-4 text-5xl text-black font-light">✧</div>
       <h1 className="font-serif text-3xl font-bold text-gray-900 mb-3 tracking-tight">Website Offline</h1>
       <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">{settings?.maintenanceMessage || "We are currently making some updates. Please visit us again shortly."}</p>
    </div>
  </div>
);

const AppContent = () => {
  const { settings } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  
  const isCollectionPage = location.pathname.startsWith('/collection');
  const isProductPage = location.pathname.startsWith('/product/');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const hideFooterOnMobile = (isCollectionPage || isProductPage);
  const hideFooterEntirely = isAuthPage || ['/track-order', '/cart', '/wishlist'].includes(location.pathname);

  // Stealth Link Logic: Hide URL in status bar
  useEffect(() => {
    const handleMouseOver = (e) => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href') && !link.dataset.stealth) {
        const href = link.getAttribute('href');
        // Only trigger for internal links
        if (href.startsWith('/') && !href.startsWith('//')) {
          link.dataset.href = href;
          link.removeAttribute('href');
          link.style.cursor = 'pointer';
          link.dataset.stealth = 'true';
        }
      }
    };

    const handleMouseOut = (e) => {
      const link = e.target.closest('a');
      if (link && link.dataset.href) {
        link.setAttribute('href', link.dataset.href);
        delete link.dataset.href;
        delete link.dataset.stealth;
      }
    };

    const handleClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.dataset.href) {
        e.preventDefault();
        const target = link.dataset.href;
        // Restore before navigating to keep history clean
        link.setAttribute('href', target);
        navigate(target);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleClick);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {settings?.maintenanceMode && !isAdminPath && (
        <div className="bg-red-600 text-white text-center text-xs py-2.5 px-4 shadow-sm w-full z-50">
          <span className="font-bold tracking-widest uppercase mr-2">Purchases Disabled:</span> 
          <span>{settings.maintenanceMessage || "We are currently making updates. Purchasing is temporarily unavailable."}</span>
        </div>
      )}
      <Navbar />
      <main className="flex-1 transition-colors duration-500 pb-20 lg:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <MobileBottomBar />
      {/* Conditionally hide footer on mobile for Collection and Product Detail pages, or entirely for auth */}
      {!hideFooterEntirely && (
        <div className={hideFooterOnMobile ? 'hidden lg:block' : 'block'}>
          <Footer />
        </div>
      )}
      <RecentlyViewed />
      <ExitIntentPopup />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CurrencyProvider>
        <ShopProvider>
          <AppContent />
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            theme="light"
            toastStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600' }}
          />
        </ShopProvider>
      </CurrencyProvider>
    </BrowserRouter>
  );
}

// Global Effect to automatically observe all sections, text blocks and images for scroll reveals

function useGlobalScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
    );

    const attachObservers = () => {
      // Find elements you want to auto-reveal that haven't been tagged yet
      const elements = document.querySelectorAll(
        'section, h1, h2, h3, .card-premium, img:not(.no-reveal), .reveal'
      );
      elements.forEach((el) => {
        if (!el.classList.contains('reveal')) {
          el.classList.add('reveal');
        }
        observer.observe(el);
      });
    };

    // Attach initially
    attachObservers();

    // Setup mutation observer to detect React navigation page changes and re-attach dynamically
    const mutationObserver = new MutationObserver(() => {
      attachObservers();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}

// Wrapper to inject it seamlessly into App root
const AppRoot = () => {
  useGlobalScrollReveal();
  return <App />;
};

export default AppRoot;

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ShopProvider } from './context/ShopContext';
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
import { Navigate } from 'react-router-dom';
import ExitIntentPopup from './components/ExitIntentPopup';
import RecentlyViewed from './components/RecentlyViewed';

const ProtectedRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('admin_session') === 'active';
  return isAdmin ? children : <Navigate to="/admin" />;
};

import { useShop } from './context/ShopContext';

const MaintenancePage = ({ settings }) => (
  <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center">
    <div className="animate-fade-in">
       <div className="mb-4 text-5xl text-blue-600 font-light">✧</div>
       <h1 className="font-serif text-3xl font-bold text-gray-900 mb-3 tracking-tight">Website Offline</h1>
       <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">{settings?.maintenanceMessage || "We are currently making some updates. Please visit us again shortly."}</p>
    </div>
  </div>
);

const AppContent = () => {
  const { settings } = useShop();
  const isAdminPath = window.location.pathname.startsWith('/admin');

  if (settings?.maintenanceMode && !isAdminPath) {
    return <MaintenancePage settings={settings} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 transition-colors duration-500">
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
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
      <RecentlyViewed />
      <ExitIntentPopup />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
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

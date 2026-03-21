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

export default function App() {
  return (
    <BrowserRouter>
      <ShopProvider>
        <div className="flex flex-col min-h-screen overflow-x-hidden">
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

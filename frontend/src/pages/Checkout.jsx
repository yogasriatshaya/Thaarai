import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import API from '../api';
import { toast } from 'react-toastify';
import { PRODUCT_FALLBACK } from '../assets/images';
import { MOCK_PRODUCTS } from '../data/mockProducts';

export default function Checkout() {
  const { cartData, setCartData, token, BACKEND_URL } = useShop();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [form, setForm] = useState({
    fullName: '', phone: '', addressLine: '', city: '', postalCode: '', country: 'India'
  });

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const loadCart = async () => {
      const items = [];
      for (const key in cartData) {
        const item = cartData[key];
        if (item?.productId) {
          if (item.productId.startsWith('mock_')) {
            const mock = MOCK_PRODUCTS.find(p => p._id === item.productId);
            if (mock) items.push({ ...mock, ...item });
          } else if (item.productId.startsWith('local_')) {
            const localData = localStorage.getItem('aara_local_products');
            const locals = localData ? JSON.parse(localData) : [];
            const local = locals.find(p => p._id === item.productId);
            if (local) items.push({ ...local, ...item });
          } else {
            try {
              const res = await API.get(`/products/${item.productId}`);
              items.push({ ...res.data.product, ...item });
            } catch {}
          }
        }
      }
      setCartItems(items);
    };
    loadCart();
  }, [cartData, token]);

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery = subtotal > 500 ? 0 : 35;
  const total = subtotal + delivery;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.addressLine || !form.city || !form.postalCode) {
      toast.error('Please fill all delivery fields');
      return;
    }

    const orderItems = cartItems.map(i => {
      let imageUrl = '';
      if (i.images?.[0]) {
        imageUrl = i.images[0].startsWith('http') ? i.images[0] : `${BACKEND_URL}${i.images[0]}`;
      }
      return {
        productId: i._id, 
        name: i.name,
        image: imageUrl,
        price: i.price, 
        size: i.size, 
        color: i.color, 
        quantity: i.quantity
      };
    });

    setLoading(true);
    try {
      if (paymentMethod === 'cod') {
        const res = await API.post('/orders/create', { items: orderItems, address: form, totalAmount: total, paymentMethod: 'cod' });
        if (res.data.success) {
          setCartData({});
          navigate('/order-success');
          toast.success('Order placed successfully!');
        }
      } else if (paymentMethod === 'stripe') {
        const res = await API.post('/orders/stripe', { items: orderItems, address: form, totalAmount: total });
        if (res.data.url) window.location.href = res.data.url;
      } else if (paymentMethod === 'razorpay') {
        const res = await API.post('/orders/razorpay', { items: orderItems, address: form, totalAmount: total });
        const { razorpayOrderId, orderId, key } = res.data;
        const options = {
          key, amount: Math.round(total * 100), currency: 'INR',
          name: 'Aara', description: 'Luxury Fashion Purchase',
          order_id: razorpayOrderId,
          handler: async (response) => {
            const verify = await API.post('/orders/razorpay/verify', {
              ...response, orderId
            });
            if (verify.data.success) {
              setCartData({});
              navigate('/order-success');
              toast.success('Payment successful!');
            }
          },
          theme: { color: '#d4a017' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      toast.error('Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Product Summary */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-xl font-bold border-b pb-4">Order Summary</h2>
            <div className="space-y-6 max-h-[60vh] overflow-auto pr-2 custom-scrollbar">
              {cartItems.map((item, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-20 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <img 
                      src={item.images?.[0] ? (item.images[0].startsWith('http') ? item.images[0] : `${BACKEND_URL}${item.images[0]}`) : PRODUCT_FALLBACK} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.src = PRODUCT_FALLBACK; }} 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      Size: {item.size} | Color: {item.color}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium">Qty: {item.quantity}</span>
                      <span className="font-bold text-gray-900">
                        {(item.price * item.quantity).toLocaleString('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>
                  {subtotal.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  })}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges</span>
                <span className={delivery === 0 ? 'text-green-500 font-medium' : ''}>
                  {delivery === 0 ? 'FREE' : delivery.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  })}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                <span>Total Amount</span>
                <span className="text-green-600">
                  {total.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Delivery & Payment */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Delivery Form */}
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
              <h2 className="text-xl font-bold border-b pb-4">Delivery Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Mobile Number" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
                <div className="md:col-span-2">
                  <input name="addressLine" value={form.addressLine} onChange={handleChange} placeholder="Complete Address" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
                </div>
                <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
                <input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="Pincode" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
              <h2 className="text-xl font-bold border-b pb-4">Payment Method</h2>
              
              <div className="flex flex-col gap-3">
                <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl font-bold">⚡</div>
                    <div>
                      <p className="font-bold text-gray-800">PhonePe / GPay / UPI</p>
                      <p className="text-xs text-gray-500">Instant & secure payment</p>
                    </div>
                  </div>
                  <input type="radio" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="w-5 h-5 accent-green-600" />
                </label>

                <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold">🏠</div>
                    <div>
                      <p className="font-bold text-gray-800">Cash on Delivery</p>
                      <p className="text-xs text-gray-500">Pay when you receive</p>
                    </div>
                  </div>
                  <input type="radio" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 accent-green-600" />
                </label>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-green-500 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-green-600 transition-all active:scale-95 shadow-lg shadow-green-500/20 rounded-xl"
              >
                Buy Now
              </button>
              
              <p className="text-xs text-center text-gray-500 px-4">
                By clicking "Buy Now", you agree to our terms and conditions.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  isGuest: { type: Boolean, default: false },
  guestEmail: { type: String },
  guestPhone: { type: String },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    image: String,
    price: Number,
    size: String,
    color: String,
    quantity: Number
  }],
  address: {
    fullName: String,
    phone: String,
    addressLine: String,
    city: String,
    postalCode: String,
    country: String
  },
  // Pricing breakdown
  subtotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  taxName: { type: String, default: '' },
  taxPercentage: { type: Number, default: 0 },
  shippingAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  // Currency & country
  currency: { type: String, default: 'INR' },
  orderCountry: { type: String, default: 'IN' },
  // Payment & status
  paymentMethod: { type: String, enum: ['stripe', 'razorpay', 'cod'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  orderStatus: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], default: 'processing' },
  trackingId: { type: String, default: '' },
  carrierName: { type: String, default: '' },
  stripeSessionId: String,
  razorpayOrderId: String,
  
  // Return & Cancellation
  returnRequested: { type: Boolean, default: false },
  returnReason: { type: String, default: '' },
  returnImages: [{ type: String }],
  returnStatus: { type: String, enum: ['none', 'pending', 'approved', 'received', 'rejected', 'refunded'], default: 'none' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

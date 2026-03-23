const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['stripe', 'razorpay', 'cod'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  orderStatus: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], default: 'processing' },
  trackingId: { type: String, default: '' },
  carrierName: { type: String, default: '' },
  stripeSessionId: String,
  razorpayOrderId: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

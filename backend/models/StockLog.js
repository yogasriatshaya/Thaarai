const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Option for admin who did it.
  action: { type: String, enum: ['increment', 'decrement', 'set'], required: true },
  quantity: { type: Number, required: true },
  previousStock: { type: Number },
  currentStock: { type: Number },
  reason: { type: String, default: 'Manual Adjustment' }, // Order placed, Cancelled, Restocked
  color: { type: String },
  size: { type: String },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
}, { timestamps: true });

module.exports = mongoose.model('StockLog', stockLogSchema);

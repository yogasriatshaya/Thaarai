const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  minAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  discountValueUSD: { type: Number, default: 0 },
  minAmountUSD: { type: Number, default: 0 },
  maxDiscountUSD: { type: Number },
  applicableCountries: [{ type: String, enum: ['IN', 'US'] }],
  expiryDate: { type: Date },
  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);

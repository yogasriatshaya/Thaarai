const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cartData: { type: Object, default: {} },
  preferredCountry: { type: String, enum: ['IN', 'US'], default: 'IN' },
  preferredCurrency: { type: String, enum: ['INR', 'USD'], default: 'INR' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

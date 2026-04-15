const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
}, { timestamps: true });

// Auto-delete after 10 minutes (matching otpExpires)
pendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model('PendingUser', pendingUserSchema);

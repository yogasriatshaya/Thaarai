const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'We are currently under maintenance. Please check back soon.' },
  
  // SMTP Config
  smtpConfig: {
    host: { type: String, default: '' },
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false },
    user: { type: String, default: '' },
    pass: { type: String, default: '' },
    from: { type: String, default: '' }
  },

  // General Site Config
  siteName: { type: String, default: 'Thaarai Designers' },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  currency: { type: String, default: 'INR' },
  taxPercentage: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  
  // Social Links
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    pinterest: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);

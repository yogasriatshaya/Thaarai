const mongoose = require('mongoose');

const countryConfigSchema = new mongoose.Schema({
  currency: { type: String, required: true },
  currencySymbol: { type: String, required: true },
  taxName: { type: String, default: '' },
  taxPercentage: { type: Number, default: 0 },
  taxInclusive: { type: Boolean, default: false },
  shippingFee: { type: Number, default: 0 },
  freeShippingThreshold: { type: Number, default: 0 },
  codAvailable: { type: Boolean, default: false },
  paymentGateway: { type: String, default: '' }
}, { _id: false });

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
  defaultCountry: { type: String, enum: ['IN', 'US'], default: 'IN' },
  returnWindowDays: { type: Number, default: 7 },

  // Multi-country configuration
  countryConfig: {
    IN: {
      type: countryConfigSchema,
      default: () => ({
        currency: 'INR',
        currencySymbol: '₹',
        taxName: 'GST',
        taxPercentage: 18,
        taxInclusive: true,
        shippingFee: 0,
        freeShippingThreshold: 500,
        codAvailable: true,
        paymentGateway: 'razorpay'
      })
    },
    US: {
      type: countryConfigSchema,
      default: () => ({
        currency: 'USD',
        currencySymbol: '$',
        taxName: 'Sales Tax',
        taxPercentage: 8,
        taxInclusive: false,
        shippingFee: 10,
        freeShippingThreshold: 100,
        codAvailable: false,
        paymentGateway: 'stripe'
      })
    }
  },
  
  // Social Links
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    pinterest: { type: String, default: '' }
  },
  
  // Notification Toggles
  notifications: {
    adminNotificationEmail: { type: String, default: '' },
    orderConfirmation: { type: Boolean, default: true },
    returnRequest: { type: Boolean, default: true },
    lowStockAlert: { type: Boolean, default: true },
    dailyReport: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);

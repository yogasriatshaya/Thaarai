const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  link: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['hero', 'promo', 'category', 'mobile_hero'],
    default: 'hero'
  },
  buttonText: {
    type: String,
    default: 'Shop Now'
  },
  active: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);

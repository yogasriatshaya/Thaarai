const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String },
  price: { type: Number, required: true },
  sizes: [{ type: String }],
  colors: [{ type: String }],
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  bestseller: { type: Boolean, default: false },
  label: { type: String, enum: ['', 'BESTSELLER', 'LIMITED EDITION', 'NEW', 'FINAL PIECES'], default: '' },
  material: { type: String },
  heritage: { type: String },
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

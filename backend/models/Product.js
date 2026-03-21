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
  originalPrice: { type: Number },
  sizes: [{ type: String }],
  colors: [{ type: String }],
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  bestseller: { type: Boolean, default: false },
  label: { type: String, enum: ['', 'Hot', 'New Arrival', 'Trending', 'Sold Out'], default: '' },
  fabric: { type: String },
  style: { type: String },
  availability: { type: String, enum: ['Available', 'Limited Stock', 'Made to Order', 'Pre-Order'], default: 'Available' },
  material: { type: String },
  heritage: { type: String },
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

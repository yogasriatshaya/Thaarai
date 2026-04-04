const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  verifiedPurchase: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const variantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  image: { type: String }, // specific image for this color
  stock: { type: Number, default: 0 }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  costPrice: { type: Number, default: 0 },
  // Multi-currency pricing (USD)
  priceUSD: { type: Number, default: 0 },
  originalPriceUSD: { type: Number, default: 0 },
  costPriceUSD: { type: Number, default: 0 },
  // Country availability
  availableInIndia: { type: Boolean, default: true },
  availableInUS: { type: Boolean, default: false },
  sizes: [{ type: String }],
  colors: [{ type: String }],
  images: [{ type: String }],
  variants: [variantSchema],
  stock: { type: Number, default: 0 },
  bestseller: { type: Boolean, default: false },
  label: { type: String, default: '' },
  fabric: { type: String },
  style: { type: String },
  availability: { type: String, default: 'Available' },
  material: { type: String },
  heritage: { type: String },
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  status: { type: String, enum: ['Publish', 'Draft'], default: 'Publish' },
  // Limited Time Offer - Region Specific with Offer Prices
  offerEndTimeIndia: { type: Date, default: null },
  offerActiveIndia: { type: Boolean, default: false },
  offerPriceIndia: { type: Number, default: 0 },
  offerPriceUSDIndia: { type: Number, default: 0 },
  offerEndTimeUSA: { type: Date, default: null },
  offerActiveUSA: { type: Boolean, default: false },
  offerPriceUSDUSA: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

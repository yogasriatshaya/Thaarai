const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  fabrics: [{ type: String }],
  styles: [{ type: String }]
}, { _id: false });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  subcategories: [subcategorySchema],
  isActive: { type: Boolean, default: true },
  defaultFabrics: [{ type: String }],
  defaultStyles: [{ type: String }],
  availableSizes: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);

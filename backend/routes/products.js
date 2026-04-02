const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const seedProducts = require('../config/seedProducts');
const { adminMiddleware, authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Helper to safely parse array-like inputs from FormData
const parseArray = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    return typeof input === 'string' ? input.split(',').map(s => s.trim()).filter(Boolean) : [];
  }
};

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const existingCount = await Product.countDocuments();
    if (existingCount === 0) {
      await seedProducts();
    }

    const { category, subcategory, material, fabric, minPrice, maxPrice, bestseller, search, sort, page = 1, limit = 12, country } = req.query;
    const query = {};

    if (country === 'US') query.availableInUS = true;
    else if (country === 'IN') query.availableInIndia = true;

    if (category) {
      const parentCat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
      if (parentCat) {
        const subNames = (parentCat.subcategories || []).map(s => typeof s === 'string' ? s : s?.name || '').filter(Boolean);
        query.$or = [
          { category: { $regex: new RegExp(`^${category}$`, 'i') } },
          { category: { $in: subNames.map(s => new RegExp(`^${s}$`, 'i')) } }
        ];
      } else {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }
    }
    if (subcategory) {
      if (category) {
        query.$or = [
          { category: { $regex: new RegExp(`^${category}$`, 'i') }, subcategory: { $regex: new RegExp(`^${subcategory}$`, 'i') } },
          { category: { $regex: new RegExp(`^${subcategory}$`, 'i') } }
        ];
        delete query.category;
      } else {
        query.subcategory = { $regex: new RegExp(`^${subcategory}$`, 'i') };
      }
    }
    if (material) query.material = { $regex: material, $options: 'i' };
    if (fabric) query.fabric = { $regex: fabric, $options: 'i' };
    if (bestseller === 'true') query.bestseller = true;

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceField = country === 'US' ? 'priceUSD' : 'price';
      query[priceField] = {};
      if (minPrice !== undefined) query[priceField].$gte = Number(minPrice);
      if (maxPrice !== undefined) query[priceField].$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const sortObj = {};
    if (sort === 'price_asc') sortObj[country === 'US' ? 'priceUSD' : 'price'] = 1;
    else if (sort === 'price_desc') sortObj[country === 'US' ? 'priceUSD' : 'price'] = -1;
    else if (sort === 'rating') sortObj.averageRating = -1;
    else if (sort === 'name_asc') sortObj.name = 1;
    else if (sort === 'name_desc') sortObj.name = -1;
    else sortObj.createdAt = -1;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortObj).skip(skip).limit(Number(limit));

    res.json({ success: true, products, total, pages: Math.ceil(total / Number(limit)), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Count by subcategory
router.get('/count-by-subcategory', async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) return res.json({ success: true, counts: {} });
    const products = await Product.find({ category: { $regex: new RegExp(`^${category}$`, 'i') } });
    const counts = {};
    products.forEach(p => { const sub = p.subcategory || 'Other'; counts[sub] = (counts[sub] || 0) + 1; });
    res.json({ success: true, counts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid ID' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add product
router.post('/', adminMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, category, subcategory, price, originalPrice, priceUSD, originalPriceUSD, 
            sizes, colors, stock, bestseller, label, fabric, style, availability, material, heritage, status, 
            offerEndTimeIndia, offerActiveIndia, offerPriceIndia, offerPriceUSDIndia,
            offerEndTimeUSA, offerActiveUSA, offerPriceUSDUSA } = req.body;
    
    const imagePaths = (req.files || []).map(f => f.path.replace(/\\/g, '/'));

    const product = await Product.create({
      name, description, category, subcategory,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      priceUSD: Number(priceUSD) || 0,
      originalPriceUSD: originalPriceUSD ? Number(originalPriceUSD) : 0,
      availableInIndia: req.body.availableInIndia === 'true' || req.body.availableInIndia === true,
      availableInUS: req.body.availableInUS === 'true' || req.body.availableInUS === true,
      sizes: parseArray(sizes),
      colors: parseArray(colors),
      images: imagePaths,
      stock: Number(stock) || 0,
      bestseller: bestseller === 'true' || bestseller === true,
      label: (Number(stock) <= 0) ? 'Sold Out' : (label || ''),
      fabric: fabric || material || '',
      style: style || '',
      availability: availability || 'Available',
      material, heritage,
      status: status || 'Publish',
      offerEndTimeIndia: offerEndTimeIndia ? new Date(offerEndTimeIndia) : null,
      offerActiveIndia: offerActiveIndia === 'true' || offerActiveIndia === true,
      offerPriceIndia: Number(offerPriceIndia) || 0,
      offerPriceUSDIndia: Number(offerPriceUSDIndia) || 0,
      offerEndTimeUSA: offerEndTimeUSA ? new Date(offerEndTimeUSA) : null,
      offerActiveUSA: offerActiveUSA === 'true' || offerActiveUSA === true,
      offerPriceUSDUSA: Number(offerPriceUSDUSA) || 0
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error('ADD PRODUCT ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update product
router.put('/:id', adminMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, category, subcategory, price, originalPrice, priceUSD, originalPriceUSD, 
            sizes, colors, stock, bestseller, label, fabric, style, availability, material, heritage, existingImages, status, 
            offerEndTimeIndia, offerActiveIndia, offerPriceIndia, offerPriceUSDIndia,
            offerEndTimeUSA, offerActiveUSA, offerPriceUSDUSA } = req.body;

    const newImages = (req.files || []).map(f => f.path.replace(/\\/g, '/'));
    const keptImages = parseArray(existingImages);

    const updateData = {
      name, description, category, subcategory,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      priceUSD: Number(priceUSD) || 0,
      originalPriceUSD: originalPriceUSD ? Number(originalPriceUSD) : 0,
      fabric: fabric || material || '',
      style: style || '',
      availability: availability || 'Available',
      material, heritage, status: status || 'Publish',
      availableInIndia: req.body.availableInIndia === 'true' || req.body.availableInIndia === true,
      availableInUS: req.body.availableInUS === 'true' || req.body.availableInUS === true,
      sizes: parseArray(sizes),
      colors: parseArray(colors),
      stock: Number(stock) || 0,
      bestseller: bestseller === 'true' || bestseller === true,
      images: [...keptImages, ...newImages]
    };

    if (updateData.stock <= 0) updateData.label = 'Sold Out';
    else if (label !== undefined) updateData.label = label;

    if (offerEndTimeIndia) updateData.offerEndTimeIndia = new Date(offerEndTimeIndia);
    else if (offerEndTimeIndia === '') updateData.offerEndTimeIndia = null;
    updateData.offerActiveIndia = offerActiveIndia === 'true' || offerActiveIndia === true;
    updateData.offerPriceIndia = Number(offerPriceIndia) || 0;

    if (offerEndTimeUSA) updateData.offerEndTimeUSA = new Date(offerEndTimeUSA);
    else if (offerEndTimeUSA === '') updateData.offerEndTimeUSA = null;
    updateData.offerActiveUSA = offerActiveUSA === 'true' || offerActiveUSA === true;
    updateData.offerPriceUSDUSA = Number(offerPriceUSDUSA) || 0;

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, product });
  } catch (err) {
    console.error('UPDATE PRODUCT ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete product
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reviews handling
router.post('/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment, name } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    product.reviews.push({ userId: req.user.id, name: name || req.user.name, rating: Number(rating), comment, createdAt: new Date() });
    product.averageRating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id/reviews/:reviewId', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    product.reviews.pull({ _id: req.params.reviewId });
    product.averageRating = product.reviews.length > 0 ? product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length : 0;
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

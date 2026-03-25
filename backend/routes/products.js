const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const seedProducts = require('../config/seedProducts');
const { adminMiddleware, authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    // Ensure catalog is initialized so admin/frontend have products to manage
    const existingCount = await Product.countDocuments();
    if (existingCount === 0) {
      await seedProducts();
    }

    const { category, subcategory, material, fabric, minPrice, maxPrice, bestseller, search, sort, page = 1, limit = 12 } = req.query;
    const query = {};

    if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    if (subcategory) query.subcategory = { $regex: new RegExp(`^${subcategory}$`, 'i') };
    if (material) query.material = { $regex: material, $options: 'i' };
    if (fabric) query.fabric = { $regex: fabric, $options: 'i' };
    if (bestseller === 'true') query.bestseller = true;

    // Only apply price filter if values are explicitly provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const sortObj = {};
    if (sort === 'price_asc') sortObj.price = 1;
    else if (sort === 'price_desc') sortObj.price = -1;
    else if (sort === 'rating') sortObj.averageRating = -1;
    else if (sort === 'name_asc') sortObj.name = 1;
    else if (sort === 'name_desc') sortObj.name = -1;
    else sortObj.createdAt = -1; // default: newest

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortObj).skip(skip).limit(Number(limit));

    res.json({ success: true, products, total, pages: Math.ceil(total / Number(limit)), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add product (admin)
router.post('/', adminMiddleware, upload.array('images', 6), async (req, res) => {
  try {
    const { name, description, category, subcategory, price, originalPrice, costPrice, sizes, colors, stock, bestseller, label, fabric, style, availability, material, heritage, status } = req.body;
    const images = req.files?.map(f => f.path) || [];

    let appliedLabel = label || '';
    if (Number(stock) <= 0) {
       appliedLabel = 'Sold Out';
    }

    const product = await Product.create({
      name, description, category, subcategory,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      costPrice: Number(costPrice) || 0,
      sizes: sizes ? JSON.parse(sizes) : [],
      colors: colors ? JSON.parse(colors) : [],
      images,
      stock: Number(stock) || 0,
      bestseller: bestseller === 'true',
      label: appliedLabel,
      fabric: fabric || material || '',
      style: style || '',
      availability: availability || 'Available',
      material, heritage,
      status: status || 'Publish'
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk Discount rule (admin)
router.put('/bulk/discount', adminMiddleware, async (req, res) => {
  try {
    const { category, discountType, discountValue } = req.body;
    const query = {};
    if (category && category !== 'All') query.category = category;

    const products = await Product.find(query);
    for (const p of products) {
      if (p.price <= 0) continue;
      let newPrice = p.price;
      if (discountType === 'percentage') {
        newPrice = p.price - (p.price * (Number(discountValue) / 100));
      } else if (discountType === 'fixed') {
        newPrice = p.price - Number(discountValue);
      }
      p.originalPrice = p.price; // Backup old price
      p.price = Math.max(0, Math.round(newPrice));
      await p.save();
    }
    res.json({ success: true, message: `Updated prices for ${products.length} products` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update product (admin)
router.put('/:id', adminMiddleware, upload.array('images', 6), async (req, res) => {
  try {
    const { name, description, category, subcategory, price, originalPrice, costPrice, sizes, colors, stock, bestseller, label, fabric, style, availability, material, heritage, existingImages, status } = req.body;
    const updateData = {
      name, description, category, subcategory,
      price: Number(price),
      fabric: fabric || material || '',
      style: style || '',
      availability: availability || 'Available',
      material, heritage
    };

    if (status) updateData.status = status;
    if (originalPrice !== undefined && originalPrice !== '') updateData.originalPrice = Number(originalPrice);
    if (costPrice !== undefined && costPrice !== '') updateData.costPrice = Number(costPrice);
    if (sizes) updateData.sizes = JSON.parse(sizes);
    if (colors) updateData.colors = JSON.parse(colors);
    if (stock !== undefined) {
      updateData.stock = Number(stock);
      if (updateData.stock <= 0) {
        updateData.label = 'Sold Out';
      } else if (label !== undefined) {
         updateData.label = label;
      }
    } else if (label !== undefined) {
      updateData.label = label;
    }

    if (bestseller !== undefined) updateData.bestseller = bestseller === 'true';

    // Handle images: combine existing (not removed) with new uploads
    const keptImages = existingImages ? JSON.parse(existingImages) : [];
    const newImages = req.files?.map(f => f.path) || [];
    updateData.images = [...keptImages, ...newImages];

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete product (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add review
router.post('/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment, name } = req.body;
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Check if review already exists from this user
    const alreadyReviewed = product.reviews.find(r => r.userId.toString() === req.user.id);
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    // Check if user has ordered this product
    const hasOrdered = await Order.findOne({ userId: req.user.id, 'items.productId': req.params.id });

    const review = { 
      userId: req.user.id, 
      name: name || req.user.name || 'Customer', 
      rating: Number(rating), 
      comment,
      verifiedPurchase: !!hasOrdered
    };

    product.reviews.push(review);
    product.reviewCount = product.reviews.length;
    product.averageRating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Edit review
router.put('/:id/reviews/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const Product = require('../models/Product');
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this review' });
    }

    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment;

    product.averageRating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete review
router.delete('/:id/reviews/:reviewId', authMiddleware, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    product.reviews.pull({ _id: req.params.reviewId });
    product.reviewCount = product.reviews.length;
    product.averageRating = product.reviews.length > 0
      ? product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length
      : 0;

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

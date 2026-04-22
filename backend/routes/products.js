const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const StockLog = require('../models/StockLog');
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
    /* 
    const existingCount = await Product.countDocuments();
    if (existingCount === 0) {
      await seedProducts();
    }
    */

    const { category, subcategory, material, fabric, minPrice, maxPrice, bestseller, search, sort, page = 1, limit = 12, country, stock_lte, status } = req.query;
    const query = {};
    const andClauses = [];
    
    // Default to 'Publish' if no status is provided, but allow override
    if (status && status !== 'All') {
      query.status = status;
    } else if (!status) {
      query.status = 'Publish';
    }

    if (stock_lte !== undefined) {
      andClauses.push({
        $or: [
           { stock: { $lte: Number(stock_lte) } },
           { 'variants.inventory.stock': { $lte: Number(stock_lte) } }
        ]
      });
    }

    if (country === 'US') query.availableInUS = true;
    else if (country === 'IN') query.availableInIndia = true;

    if (category) {
      const parentCat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
      if (parentCat) {
        const subNames = (parentCat.subcategories || []).map(s => typeof s === 'string' ? s : s?.name || '').filter(Boolean);
        andClauses.push({
          $or: [
            { category: { $regex: new RegExp(`^${category}$`, 'i') } },
            { category: { $in: subNames.map(s => new RegExp(`^${s}$`, 'i')) } }
          ]
        });
      } else {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }
    }
    if (subcategory) {
      if (category) {
        andClauses.push({
          $or: [
            { category: { $regex: new RegExp(`^${category}$`, 'i') }, subcategory: { $regex: new RegExp(`^${subcategory}$`, 'i') } },
            { category: { $regex: new RegExp(`^${subcategory}$`, 'i') } }
          ]
        });
        delete query.category;
      } else {
        query.subcategory = { $regex: new RegExp(`^${subcategory}$`, 'i') };
      }
    }
    if (material) query.material = { $regex: material, $options: 'i' };
    if (fabric) query.fabric = { $regex: fabric, $options: 'i' };
    if (req.query.label && req.query.label !== 'All') {
      query.label = req.query.label;
    }
    if (bestseller === 'true') query.bestseller = true;

    if (minPrice !== undefined || maxPrice !== undefined) {
      const min = minPrice !== undefined && minPrice !== "" ? Number(minPrice) : null;
      const max = maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : null;

      const priceField = country === "US" ? "priceUSD" : "price";
      const offerActiveField = country === "US" ? "offerActiveUSA" : "offerActiveIndia";
      const offerPriceField = country === "US" ? "offerPriceUSDUSA" : "offerPriceIndia";
      const offerEndTimeField = country === "US" ? "offerEndTimeUSA" : "offerEndTimeIndia";

      const priceFilter = {};
      if (min !== null) priceFilter.$gte = min;
      if (max !== null) priceFilter.$lte = max;

      if (Object.keys(priceFilter).length > 0) {
        andClauses.push({
          $or: [
            {
              // Case 1: No active offer OR offer has expired, use regular price
              $or: [{ [offerActiveField]: { $ne: true } }, { [offerEndTimeField]: { $lte: new Date() } }],
              [priceField]: priceFilter,
            },
            {
              // Case 2: Active offer, check offer price
              [offerActiveField]: true,
              $or: [{ [offerEndTimeField]: { $exists: false } }, { [offerEndTimeField]: null }, { [offerEndTimeField]: { $gt: new Date() } }],
              [offerPriceField]: priceFilter,
            },
          ],
        });
      }
    }

    if (search) {
      andClauses.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (andClauses.length > 0) {
      query.$and = andClauses;
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
router.post('/', adminMiddleware, upload.any(), async (req, res) => {
  try {
    const { name, description, category, subcategory, price, originalPrice, priceUSD, originalPriceUSD, 
            sizes, colors, stock, bestseller, label, fabric, style, availability, material, heritage, status, 
            offerEndTimeIndia, offerActiveIndia, offerPriceIndia, offerPriceUSDIndia,
            offerEndTimeUSA, offerActiveUSA, offerPriceUSDUSA, variants } = req.body;
    
    const imagePaths = (req.files || []).filter(f => f.fieldname === 'images').map(f => f.path.replace(/\\/g, '/'));
    
    const parsedVariants = parseArray(variants).map((v, i) => {
      const vFiles = (req.files || []).filter(f => f.fieldname.startsWith(`variantImage_${i}_`));
      v.images = v.images || [];
      if (vFiles.length > 0) {
         const newVImages = vFiles.map(f => f.path.replace(/\\/g, '/'));
         v.images = [...v.images, ...newVImages];
      }
      return v;
    });

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
      variants: parsedVariants,
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
      offerPriceUSDUSA: Number(offerPriceUSDUSA) || 0,
      codAllowed: req.body.codAllowed !== 'false' && req.body.codAllowed !== false,
      returnWindowDays: req.body.returnWindowDays ? Number(req.body.returnWindowDays) : null
    });

    // ── Log initial stock in inventory ───────────────────────────────
    const initialStock = Number(stock) || 0;
    if (initialStock > 0) {
      await StockLog.create({
        productId: product._id,
        action: 'set',
        quantity: initialStock,
        previousStock: 0,
        currentStock: initialStock,
        reason: 'Product created'
      });
    }

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error('ADD PRODUCT ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update product
router.put('/:id', adminMiddleware, upload.any(), async (req, res) => {
  try {
    const { name, description, category, subcategory, price, originalPrice, priceUSD, originalPriceUSD, 
            sizes, colors, stock, bestseller, label, fabric, style, availability, material, heritage, existingImages, status, 
            offerEndTimeIndia, offerActiveIndia, offerPriceIndia, offerPriceUSDIndia,
            offerEndTimeUSA, offerActiveUSA, offerPriceUSDUSA, variants, existingVariants } = req.body;

    const newImages = (req.files || []).filter(f => f.fieldname === 'images').map(f => f.path.replace(/\\/g, '/'));
    const keptImages = parseArray(existingImages);

    // Variants handling
    const parsedVariants = parseArray(variants).map((v, i) => {
      const vFiles = (req.files || []).filter(f => f.fieldname.startsWith(`variantImage_${i}_`));
      v.images = v.images || [];
      if (vFiles.length > 0) {
         const newVImages = vFiles.map(f => f.path.replace(/\\/g, '/'));
         v.images = [...v.images, ...newVImages];
      }
      return v;
    });

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
      variants: parsedVariants,
      stock: Number(stock) || 0,
      bestseller: bestseller === 'true' || bestseller === true,
      images: [...keptImages, ...newImages]
    };

    if (updateData.stock <= 0 && (!parsedVariants || parsedVariants.reduce((a,v) => a+Number(v.stock||0), 0) <= 0)) {
       updateData.label = 'Sold Out';
    }
    else if (label !== undefined) updateData.label = label;

    if (offerEndTimeIndia) updateData.offerEndTimeIndia = new Date(offerEndTimeIndia);
    else if (offerEndTimeIndia === '') updateData.offerEndTimeIndia = null;
    updateData.offerActiveIndia = offerActiveIndia === 'true' || offerActiveIndia === true;
    updateData.offerPriceIndia = Number(offerPriceIndia) || 0;

    if (offerEndTimeUSA) updateData.offerEndTimeUSA = new Date(offerEndTimeUSA);
    else if (offerEndTimeUSA === '') updateData.offerEndTimeUSA = null;
    updateData.offerActiveUSA = offerActiveUSA === 'true' || offerActiveUSA === true;
    updateData.offerPriceUSDUSA = Number(offerPriceUSDUSA) || 0;    
    // Custom restrictions
    updateData.codAllowed = req.body.codAllowed !== 'false' && req.body.codAllowed !== false;
    updateData.returnWindowDays = req.body.returnWindowDays ? Number(req.body.returnWindowDays) : null;
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) return res.status(404).json({ success: false, message: 'Not found' });
    
    const oldStock = Number(existingProduct.stock) || 0;
    const newStock = Number(stock) || 0;

    // ── Log Variant-Level Stock Changes ───────────────────────────
    if (parsedVariants && existingProduct.variants) {
      for (const newV of parsedVariants) {
        const oldV = existingProduct.variants.find(ov => ov.color === newV.color);
        if (newV.inventory && Array.isArray(newV.inventory)) {
          for (const newInv of newV.inventory) {
            const oldInv = oldV?.inventory?.find(oi => oi.size === newInv.size);
            const oldQty = oldInv ? Number(oldInv.stock) : 0;
            const newQty = Number(newInv.stock) || 0;

            if (newQty !== oldQty) {
              const diff = newQty - oldQty;
              await StockLog.create({
                productId: existingProduct._id,
                action: diff > 0 ? 'increment' : 'decrement',
                quantity: Math.abs(diff),
                previousStock: oldQty,
                currentStock: newQty,
                reason: 'Product updated (Variant)',
                color: newV.color,
                size: newInv.size
              });
            }
          }
        } else if (newV.stock !== undefined) {
           // Fallback for variants without matrix inventory
           const oldVQty = oldV ? Number(oldV.stock) : 0;
           const newVQty = Number(newV.stock) || 0;
           if (newVQty !== oldVQty) {
             const diff = newVQty - oldVQty;
             await StockLog.create({
                productId: existingProduct._id,
                action: diff > 0 ? 'increment' : 'decrement',
                quantity: Math.abs(diff),
                previousStock: oldVQty,
                currentStock: newVQty,
                reason: 'Product updated (Variant)',
                color: newV.color
             });
           }
        }
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // ── Log total stock change ────────────────────────────────────
    if (product && newStock !== oldStock) {
      const diff = newStock - oldStock;
      await StockLog.create({
        productId: product._id,
        action: diff > 0 ? 'increment' : 'decrement',
        quantity: Math.abs(diff),
        previousStock: oldStock,
        currentStock: newStock,
        reason: 'Product updated (Total)'
      });
    }

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
    product.reviewCount = product.reviews.length;
    product.averageRating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/reviews/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { rating, comment, name } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    
    const isOwner = review.userId && String(review.userId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });
    
    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment;
    if (name) review.name = name;
    
    product.reviewCount = product.reviews.length;
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
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    // Authorization check
    const review = product.reviews.id(req.params.reviewId);
    if (!review) {
      // If already gone, just return success
      return res.json({ success: true, product });
    }

    const isOwner = review.userId && String(review.userId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });

    // Remove the review using Mongoose subdocument remove() or pull
    product.reviews.pull(req.params.reviewId);
    
    product.reviewCount = product.reviews.length;
    product.averageRating = product.reviews.length > 0 
      ? product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length 
      : 0;
      
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    console.error('DELETE REVIEW ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Get cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'cartData',
      model: 'Product'
    });
    res.json({ success: true, cartData: user.cartData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add to cart
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, size, color, quantity = 1 } = req.body;
    const user = await User.findById(req.user.id);
    const key = `${productId}_${size}_${color}`;
    const cartData = user.cartData || {};
    cartData[key] = { productId, size, color, quantity: (cartData[key]?.quantity || 0) + quantity };
    user.cartData = cartData;
    user.markModified('cartData');
    await user.save();
    res.json({ success: true, cartData: user.cartData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update cart quantity
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { productId, size, color, quantity } = req.body;
    const user = await User.findById(req.user.id);
    const key = `${productId}_${size}_${color}`;
    const cartData = user.cartData || {};
    if (quantity <= 0) {
      delete cartData[key];
    } else {
      cartData[key] = { productId, size, color, quantity };
    }
    user.cartData = cartData;
    user.markModified('cartData');
    await user.save();
    res.json({ success: true, cartData: user.cartData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Remove from cart
router.delete('/remove', authMiddleware, async (req, res) => {
  try {
    const { productId, size, color } = req.body;
    const user = await User.findById(req.user.id);
    const key = `${productId}_${size}_${color}`;
    const cartData = user.cartData || {};
    delete cartData[key];
    user.cartData = cartData;
    user.markModified('cartData');
    await user.save();
    res.json({ success: true, cartData: user.cartData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

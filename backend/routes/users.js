const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ success: false, message: 'Email already in use' });
      user.email = email;
    }

    await user.save();
    res.json({ success: true, user: { _id: user._id, id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update wishlist
router.post('/wishlist', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user.id);
    const idx = user.wishlist.indexOf(productId);
    if (idx > -1) user.wishlist.splice(idx, 1);
    else user.wishlist.push(productId);
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all users (admin)
router.get('/all', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments();
    const users = await User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get abandoned carts (admin)
router.get('/abandoned', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({ cartData: { $type: 'object', $ne: {} } }).select('-password').sort({ updatedAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// Update user preferences (country/currency)
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { preferredCountry, preferredCurrency } = req.body;
    const update = {};
    if (preferredCountry) update.preferredCountry = preferredCountry;
    if (preferredCurrency) update.preferredCurrency = preferredCurrency;
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

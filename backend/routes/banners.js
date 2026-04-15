const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const { adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all banners
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create banner (Admin)
router.post('/', adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const bannerData = { ...req.body };
    
    // Convert boolean and number strings from FormData
    if (bannerData.active) bannerData.active = bannerData.active === 'true';
    if (bannerData.order) bannerData.order = Number(bannerData.order);
    
    if (req.file) {
      bannerData.imageUrl = req.file.path.replace(/\\/g, '/');
    }
    
    const banner = await Banner.create(bannerData);
    res.status(201).json({ success: true, banner, message: 'Banner created successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update banner (Admin)
router.put('/:id', adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Convert boolean and number strings from FormData
    if (updateData.active !== undefined) updateData.active = updateData.active === 'true';
    if (updateData.order !== undefined) updateData.order = Number(updateData.order);

    if (req.file) {
      updateData.imageUrl = req.file.path.replace(/\\/g, '/');
    }
    
    const banner = await Banner.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner, message: 'Banner updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete banner (Admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.id || req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { adminMiddleware, authMiddleware } = require('../middleware/auth');

// @route   GET /api/coupons
// @desc    Get all coupons for admin
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ success: true, coupons });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST /api/coupons
// @desc    Create new coupon
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, coupon });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @route   PUT /api/coupons/:id
// @desc    Update a coupon
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, message: 'Coupon updated successfully', coupon });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @route   DELETE /api/coupons/:id
// @desc    Delete a coupon
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST /api/coupons/apply
// @desc    Validate and calculate coupon discount for customer
router.post('/apply', authMiddleware, async (req, res) => {
    try {
        const { code, totalAmount } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });

        // Expiry verification
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }

        // Usage Limit verified triggers
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'Coupon limit reached' });
        }

        // Min Order constraint setups
        if (totalAmount < coupon.minAmount) {
             return res.status(400).json({ success: false, message: `Minimum amount calculation to use this coupon is ₹${coupon.minAmount}` });
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = totalAmount * (coupon.discountValue / 100);
            if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
            discount = Math.min(coupon.discountValue, totalAmount);
        }

        res.json({ success: true, discount: Math.floor(discount), couponId: coupon._id, code: coupon.code });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

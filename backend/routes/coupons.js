const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { adminMiddleware, authMiddleware, optionalAuth } = require('../middleware/auth');

// @route   GET /api/coupons
// @desc    Get all coupons for admin
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const total = await Coupon.countDocuments();
        const coupons = await Coupon.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
        res.json({ success: true, coupons, total });
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

// @route   GET /api/coupons/active
// @desc    Get all active coupons for display to users
router.get('/active', async (req, res) => {
    try {
        const coupons = await Coupon.find({ 
            isActive: true, 
            $or: [{ expiryDate: { $gt: new Date() } }, { expiryDate: null }] 
        }).select('code title description discountType discountValue discountValueUSD minAmount minAmountUSD');
        res.json({ success: true, coupons });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST /api/coupons/apply
// @desc    Validate and calculate coupon discount for customer
router.post('/apply', optionalAuth, async (req, res) => {
    try {
        const { code, totalAmount, country } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });

        // Check country applicability
        if (coupon.applicableCountries && coupon.applicableCountries.length > 0) {
            const activeCountry = country || 'IN';
            if (!coupon.applicableCountries.includes(activeCountry)) {
                return res.status(400).json({ success: false, message: 'This coupon is not valid for your region' });
            }
        }

        // Expiry verification
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }

        // Usage Limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'Coupon limit reached' });
        }

        const isUS = country === 'US';
        const minAmount = isUS ? (coupon.minAmountUSD || coupon.minAmount) : coupon.minAmount;
        const symbol = isUS ? '$' : '₹';

        if (totalAmount < minAmount) {
             return res.status(400).json({ success: false, message: `Minimum order to use this coupon is ${symbol}${minAmount}` });
        }

        const discountValue = isUS ? (coupon.discountValueUSD || coupon.discountValue) : coupon.discountValue;
        const maxDiscount = isUS ? (coupon.maxDiscountUSD || coupon.maxDiscount) : coupon.maxDiscount;

        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = totalAmount * (discountValue / 100);
            if (maxDiscount) discount = Math.min(discount, maxDiscount);
        } else {
            discount = Math.min(discountValue, totalAmount);
        }

        res.json({ success: true, discount: Math.floor(discount), couponId: coupon._id, code: coupon.code });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

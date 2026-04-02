const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const { adminMiddleware, authMiddleware } = require('../middleware/auth');

// @route   GET /api/inventory/logs
// @desc    Get Stock movement logs
router.get('/logs', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { productId, action, page = 1, limit = 20, date, startDate, endDate } = req.query;
        const query = {};
        if (productId) query.productId = productId;
        if (action) query.action = action;
        
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: startOfDay, $lte: endOfDay };
        } else if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const logs = await StockLog.find(query)
            .populate('productId', 'name images')
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const total = await StockLog.countDocuments(query);

        // Calculate total removed (decrements) within the same query scope
        const removedAgg = await StockLog.aggregate([
            { $match: { ...query, action: 'decrement' } },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);
        const totalRemoved = removedAgg.length > 0 ? removedAgg[0].total : 0;

        res.json({ success: true, logs, total, totalRemoved, pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   GET /api/inventory/sold-stats
// @desc    Get sold count for all products in a specific range
router.get('/sold-stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { action: 'decrement' };
        
        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const statsAgg = await StockLog.aggregate([
            { $match: query },
            { $group: { _id: '$productId', totalSold: { $sum: '$quantity' } } }
        ]);

        const stats = {};
        statsAgg.forEach(item => {
            if (item._id) stats[item._id.toString()] = item.totalSold;
        });

        res.json({ success: true, stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   PUT /api/inventory/adjust/:id
// @desc    Adjust product stock manually
router.put('/adjust/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { quantity, reason } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const previousStock = product.stock || 0;
        product.stock = (product.stock || 0) + Number(quantity);
        if (product.stock < 0) product.stock = 0; // Guard.
        if (product.stock <= 0) product.label = 'Sold Out'; // Auto markdown logic.

        await product.save();

        const logData = {
            productId: product._id,
            action: quantity >= 0 ? 'increment' : 'decrement',
            quantity: Math.abs(Number(quantity)),
            previousStock,
            currentStock: product.stock,
            reason: reason || 'Manual Adjustment'
        };
        if (req.user.id !== 'admin') {
             logData.userId = req.user.id;
        }

        const log = await StockLog.create(logData);

        res.json({ success: true, message: 'Stock adjusted successfully', product, log });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

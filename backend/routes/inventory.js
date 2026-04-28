const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const Settings = require('../models/Settings');
const { adminMiddleware, authMiddleware } = require('../middleware/auth');
const { sendStockAlertEmail } = require('../utils/email');

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
            { $group: { 
                _id: { productId: '$productId', color: '$color', size: '$size' }, 
                totalSold: { $sum: '$quantity' },
                lastSoldDate: { $max: '$createdAt' }
            } }
        ]);

        const stats = {};
        const variantStats = {};

        statsAgg.forEach(item => {
            const pid = item._id.productId?.toString();
            if (!pid) return;

            // Total per product
            if (!stats[pid] || new Date(item.lastSoldDate) > new Date(stats[pid].date)) {
                stats[pid] = {
                    total: (stats[pid]?.total || 0) + item.totalSold,
                    date: item.lastSoldDate
                };
            } else {
                stats[pid].total += item.totalSold;
            }

            // Per variant (product-color-size)
            if (item._id.color && item._id.size) {
                const vKey = `${pid}-${item._id.color}-${item._id.size}`;
                variantStats[vKey] = {
                    total: item.totalSold,
                    date: item.lastSoldDate
                };
            }
        });

        res.json({ success: true, stats, variantStats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   PUT /api/inventory/adjust/:id
// @desc    Adjust product stock manually
router.put('/adjust/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { quantity, reason, variantId, size } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const previousStock = product.stock || 0;
        
        let adjusted = false;
        let pColor = '';

        if (variantId && size) {
            const variant = product.variants.id(variantId);
            if (variant) {
                pColor = variant.color;
                const invItem = variant.inventory.find(i => i.size === size);
                if (invItem) {
                    invItem.stock = Math.max(0, (invItem.stock || 0) + Number(quantity));
                    adjusted = true;
                }
            }
        }
        
        if (!adjusted) {
             // Fallback if no variant/size specified or found
             product.stock = Math.max(0, (product.stock || 0) + Number(quantity));
        } else {
             // Recalculate variant stock and total product stock
             product.variants.forEach(v => {
                 v.stock = v.inventory.reduce((sum, item) => sum + (item.stock || 0), 0);
             });
             product.stock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        }

        if (product.stock <= 0) product.label = 'Sold Out'; // Auto markdown logic.


        product.markModified('variants');
        await product.save();

        const logData = {
            productId: product._id,
            action: quantity >= 0 ? 'increment' : 'decrement',
            quantity: Math.abs(Number(quantity)),
            previousStock,
            currentStock: product.stock,
            reason: reason || (variantId && size ? `Manual Adjustment (${size})` : 'Manual Adjustment'),
            color: pColor || null,
            size: size || null
        };
        if (req.user.id !== 'admin') {
             logData.userId = req.user.id;
        }

        const log = await StockLog.create(logData);

        // Send stock alert email if stock dropped to or below threshold
        if (Number(quantity) < 0) {
            const stockSettings = await Settings.findOne();
            const lowStockThreshold = stockSettings?.notifications?.lowStockThreshold ?? 5;
            
            let variantInfo = null;
            let currentStockToCheck = product.stock;
            if (adjusted && pColor && size) {
                variantInfo = { color: pColor, size: size };
                const variant = product.variants.id(variantId);
                const invItem = variant.inventory.find(i => i.size === size);
                currentStockToCheck = invItem ? invItem.stock : product.stock;
            }

            if (currentStockToCheck <= 0) {
                sendStockAlertEmail(product, 'out_of_stock', 0, reason, variantInfo);
            } else if (currentStockToCheck <= lowStockThreshold) {
                sendStockAlertEmail(product, 'low_stock', currentStockToCheck, reason, variantInfo);
            }
        }

        res.json({ success: true, message: 'Stock adjusted successfully', product, log });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   GET api/dashboard/stats
// @desc    Get dashboard statistics for Admin
// @access  Private/Admin
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Create Date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 1. Total & Today Orders
    const totalOrders = await Order.countDocuments(dateFilter);
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    // 2. Order Status Counts
    const pendingOrders = await Order.countDocuments({ ...dateFilter, orderStatus: 'processing' });
    const deliveredOrders = await Order.countDocuments({ ...dateFilter, orderStatus: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ ...dateFilter, orderStatus: 'cancelled' });

    // 3. Sales
    let matchSales = { paymentStatus: 'paid' };
    if (startDate && endDate) {
       matchSales.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
       };
    }
    
    const totalSalesAgg = await Order.aggregate([
      { $match: matchSales },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalSales = totalSalesAgg.length > 0 ? totalSalesAgg[0].total : 0;

    const todaySalesAgg = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const todaySales = todaySalesAgg.length > 0 ? todaySalesAgg[0].total : 0;

    // 4. Products Stock Count
    const lowStockCount = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } });
    const outOfStockCount = await Product.countDocuments({ stock: 0 });

    // 5. New Customers
    // For general count we can use 30 days if no filter, or filter.
    const customerFilter = { role: 'user' };
    if (startDate && endDate) {
       customerFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
       const thirtyDaysAgo = new Date();
       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
       customerFilter.createdAt = { $gte: thirtyDaysAgo };
    }
    const newCustomers = await User.countDocuments(customerFilter);

    // 6. Recent Orders
    const recentOrders = await Order.find(dateFilter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // 7. Top Selling Products
    const topProductsAgg = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      { $group: { 
          _id: '$items.productId', 
          name: { $first: '$items.name' }, 
          image: { $first: '$items.image' }, 
          totalSales: { $sum: '$items.quantity' }, 
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } 
      } },
      { $sort: { totalSales: -1 } },
      { $limit: 5 }
    ]);

    // 8. Payment Summary
    const paymentSummary = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
    ]);

    // 9. Shipping Summary
    const shippingSummary = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    // 10. Small Chart Data (grouped by date)
    const chartDataAgg = await Order.aggregate([
       { $match: dateFilter },
       { $group: {
           _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
           orders: { $sum: 1 },
           sales: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } }
       }},
       { $sort: { _id: 1 } },
       { $limit: 15 }
    ]);

    // 11. Alerts for dashboard
    let alerts = [];
    if (lowStockCount > 0) alerts.push({ type: 'warning', message: `${lowStockCount} products are low in stock.` });
    if (outOfStockCount > 0) alerts.push({ type: 'danger', message: `${outOfStockCount} products are out of stock.` });
    if (pendingOrders > 0) alerts.push({ type: 'info', message: `${pendingOrders} orders are pending processing.` });

    res.json({
      success: true,
      stats: {
        totalOrders,
        todayOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalSales,
        todaySales,
        lowStockCount,
        outOfStockCount,
        newCustomers
      },
      paymentSummary,
      shippingSummary,
      recentOrders,
      topProducts: topProductsAgg,
      chartData: chartDataAgg,
      alerts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

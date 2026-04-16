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
    const { startDate, endDate, currency } = req.query;
    
    // Create Date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (currency && currency !== 'all') {
      dateFilter.currency = currency;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 1. Total & Today Orders
    const totalOrders = await Order.countDocuments(dateFilter);
    const todayOrdersFilter = { createdAt: { $gte: startOfToday } };
    if (currency && currency !== 'all') {
      todayOrdersFilter.currency = currency;
    }
    const todayOrders = await Order.countDocuments(todayOrdersFilter);

    // 2. Order Status Counts
    const pendingOrders = await Order.countDocuments({ ...dateFilter, orderStatus: 'processing' });
    const deliveredOrders = await Order.countDocuments({ ...dateFilter, orderStatus: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ ...dateFilter, orderStatus: 'cancelled' });

    // 3. Sales Breakdown
    let matchSales = { paymentStatus: 'paid' };
    if (startDate && endDate) {
       matchSales.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
       };
    }
    if (currency && currency !== 'all') {
      matchSales.currency = currency;
    }
    
    const salesAgg = await Order.aggregate([
      { $match: matchSales },
      { $group: { 
          _id: { $toUpper: '$currency' }, 
          total: { $sum: '$totalAmount' } 
      } }
    ]);

    const totalSales = salesAgg.find(s => s._id === 'INR')?.total || 0;
    const totalSalesUSD = salesAgg.find(s => s._id === 'USD')?.total || 0;

    const todayMatch = { paymentStatus: 'paid', createdAt: { $gte: startOfToday } };
    if (currency && currency !== 'all') {
        todayMatch.currency = currency;
    }

    const todaySalesAgg = await Order.aggregate([
      { $match: todayMatch },
      { $group: { 
          _id: { $toUpper: '$currency' }, 
          today: { $sum: '$totalAmount' } 
      } }
    ]);
    const todaySales = todaySalesAgg.find(s => s._id === 'INR')?.today || 0;
    const todaySalesUSD = todaySalesAgg.find(s => s._id === 'USD')?.today || 0;

    // 4. Products Stock Count
    const lowStockCount = await Product.countDocuments({
      $or: [
        { stock: { $gt: 0, $lte: 10 } },
        { 'variants.inventory.stock': { $gt: 0, $lte: 10 } }
      ]
    });
    const outOfStockCount = await Product.countDocuments({
      $or: [
        { stock: 0 },
        { 'variants.inventory.stock': 0 }
      ]
    });

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

    // 7. Top Selling Products (Currency Aware)
    const topProductsAgg = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      { $group: { 
          _id: '$items.productId', 
          name: { $first: '$items.name' }, 
          image: { $first: '$items.image' }, 
          totalSales: { $sum: '$items.quantity' }, 
          revenueINR: { $sum: { $cond: [{ $eq: [{ $toUpper: '$currency' }, 'INR'] }, { $multiply: ['$items.price', '$items.quantity'] }, 0] } },
          revenueUSD: { $sum: { $cond: [{ $eq: [{ $toUpper: '$currency' }, 'USD'] }, { $multiply: ['$items.price', '$items.quantity'] }, 0] } }
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
           salesINR: { $sum: { $cond: [{ $and: [{ $eq: ["$paymentStatus", "paid"] }, { $eq: [{ $toUpper: "$currency" }, "INR"] }] }, "$totalAmount", 0] } },
           salesUSD: { $sum: { $cond: [{ $and: [{ $eq: ["$paymentStatus", "paid"] }, { $eq: [{ $toUpper: "$currency" }, "USD"] }] }, "$totalAmount", 0] } }
       }},
       { $sort: { _id: 1 } },
       { $limit: 15 }
    ]);

    // 11. Alerts for dashboard
    let alerts = [];
    if (lowStockCount > 0) alerts.push({ type: 'warning', message: `${lowStockCount} products are low in stock.` });
    if (outOfStockCount > 0) alerts.push({ type: 'danger', message: `${outOfStockCount} products are out of stock.` });
    if (pendingOrders > 0) alerts.push({ type: 'info', message: `${pendingOrders} orders are pending processing.` });
    
    // Return Alerts
    const pendingReturnsCount = await Order.countDocuments({ ...dateFilter, returnRequested: true, returnStatus: 'pending' });
    if (pendingReturnsCount > 0) {
      alerts.push({ type: 'warning', message: `${pendingReturnsCount} return request(s) are pending approval.` });
    }
    const receivedReturnsCount = await Order.countDocuments({ ...dateFilter, returnRequested: true, returnStatus: 'received' });
    if (receivedReturnsCount > 0) {
      alerts.push({ type: 'warning', message: `${receivedReturnsCount} return(s) received. Pending refund.` });
    }

    // Sort by priority
    const priority = { danger: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => priority[a.type] - priority[b.type]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        todayOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalSales,
        totalSalesUSD,
        todaySales,
        todaySalesUSD,
        lowStockCount,
        outOfStockCount,
        newCustomers,
        pendingReturns: await Order.countDocuments({ ...dateFilter, returnRequested: true, returnStatus: 'pending' }),
        approvedReturns: await Order.countDocuments({ ...dateFilter, returnRequested: true, returnStatus: 'approved' }),
        receivedReturns: await Order.countDocuments({ ...dateFilter, returnRequested: true, returnStatus: 'received' }),
        totalReturns: await Order.countDocuments({ ...dateFilter, returnRequested: true })
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

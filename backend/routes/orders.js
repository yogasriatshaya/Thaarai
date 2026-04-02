const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');
const { authMiddleware, adminMiddleware, optionalAuth } = require('../middleware/auth');

// Create order (COD)
router.post('/create', optionalAuth, async (req, res) => {
  try {
    const { items, address, totalAmount, paymentMethod, couponId, guestEmail, guestPhone,
            currency, orderCountry, subtotal, taxAmount, taxName, taxPercentage, shippingAmount, discountAmount } = req.body;
    
    // Check if guest info is provided if no user
    if (!req.user && !guestEmail) {
      return res.status(400).json({ success: false, message: 'Customer information is required for guest checkout' });
    }

    // Deduct Stock at Order Time
    for (const item of items) {
      if (item.productId) {
        const prod = await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }, { new: true });
        if (prod) {
            await StockLog.create({
                productId: prod._id,
                userId: req.user ? req.user.id : null,
                action: 'decrement',
                quantity: item.quantity,
                previousStock: prod.stock + item.quantity,
                currentStock: prod.stock,
                reason: req.user ? 'New Order (COD)' : 'Guest Order (COD)'
            });
            if (prod.stock <= 0) {
               await Product.findByIdAndUpdate(item.productId, { label: 'Sold Out' });
            }
        }
      }
    }

    if (couponId) {
        await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
    }

    const order = await Order.create({
      userId: req.user ? req.user.id : null,
      isGuest: !req.user,
      guestEmail: req.user ? null : guestEmail,
      guestPhone: req.user ? null : guestPhone,
      items, address, totalAmount,
      currency: currency || 'INR',
      orderCountry: orderCountry || 'IN',
      subtotal: subtotal || totalAmount,
      taxAmount: taxAmount || 0,
      taxName: taxName || '',
      taxPercentage: taxPercentage || 0,
      shippingAmount: shippingAmount || 0,
      discountAmount: discountAmount || 0,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: 'processing'
    });

    // Clear cart for logged in user
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { cartData: {} });
    }
    
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stripe checkout
router.post('/stripe', optionalAuth, async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { items, address, totalAmount, couponId, currency, orderCountry, guestEmail, guestPhone,
            subtotal, taxAmount, taxName, taxPercentage, shippingAmount, discountAmount } = req.body;

    const stripeCurrency = (currency || 'INR').toLowerCase();
    
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: items.map(i => ({
        price_data: {
          currency: stripeCurrency,
          product_data: { name: i.name },
          unit_amount: Math.round(i.price * 100)
        },
        quantity: i.quantity
      })),
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart`,
      metadata: { 
        userId: req.user ? req.user.id : 'guest', 
        guestEmail: req.user ? '' : guestEmail,
        address: JSON.stringify(address) 
      }
    };

    if (!req.user && guestEmail) {
      sessionConfig.customer_email = guestEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    if (couponId) {
        await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
    }

    // Deduct Stock at Order Time
    for (const item of items) {
      if (item.productId) {
        const prod = await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }, { new: true });
        if (prod) {
            await StockLog.create({
                productId: prod._id,
                userId: req.user ? req.user.id : null,
                action: 'decrement',
                quantity: item.quantity,
                previousStock: prod.stock + item.quantity,
                currentStock: prod.stock,
                reason: req.user ? 'New Order (Stripe)' : 'Guest Order (Stripe)'
            });
            if (prod.stock <= 0) {
               await Product.findByIdAndUpdate(item.productId, { label: 'Sold Out' });
            }
        }
      }
    }

    const order = await Order.create({
      userId: req.user ? req.user.id : null,
      isGuest: !req.user,
      guestEmail: req.user ? null : (guestEmail || ''),
      guestPhone: req.user ? null : (guestPhone || ''),
      items, address, totalAmount,
      currency: currency || 'INR',
      orderCountry: orderCountry || 'IN',
      subtotal: subtotal || totalAmount,
      taxAmount: taxAmount || 0,
      taxName: taxName || '',
      taxPercentage: taxPercentage || 0,
      shippingAmount: shippingAmount || 0,
      discountAmount: discountAmount || 0,
      paymentMethod: 'stripe', paymentStatus: 'pending',
      orderStatus: 'processing', stripeSessionId: session.id
    });
    
    res.json({ success: true, sessionId: session.id, url: session.url, orderId: order._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Razorpay checkout
router.post('/razorpay', optionalAuth, async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const { items, address, totalAmount, couponId, currency, orderCountry, guestEmail, guestPhone,
            subtotal, taxAmount, taxName, taxPercentage, shippingAmount, discountAmount } = req.body;
    
    const options = {
      amount: Math.round(totalAmount * 100),
      currency: (currency || 'INR').toUpperCase(),
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user ? req.user.id : 'guest',
        guestEmail: req.user ? '' : guestEmail
      }
    };
    
    const razorOrder = await razorpay.orders.create(options);

    if (couponId) {
        await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
    }

    // Deduct Stock at Order Time
    for (const item of items) {
      if (item.productId) {
        const prod = await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }, { new: true });
        if (prod) {
            await StockLog.create({
                productId: prod._id,
                userId: req.user ? req.user.id : null,
                action: 'decrement',
                quantity: item.quantity,
                previousStock: prod.stock + item.quantity,
                currentStock: prod.stock,
                reason: req.user ? 'New Order (Razorpay)' : 'Guest Order (Razorpay)'
            });
            if (prod.stock <= 0) {
               await Product.findByIdAndUpdate(item.productId, { label: 'Sold Out' });
            }
        }
      }
    }

    const order = await Order.create({
      userId: req.user ? req.user.id : null,
      isGuest: !req.user,
      guestEmail: req.user ? null : (guestEmail || ''),
      guestPhone: req.user ? null : (guestPhone || ''),
      items, address, totalAmount,
      currency: currency || 'INR',
      orderCountry: orderCountry || 'IN',
      subtotal: subtotal || totalAmount,
      taxAmount: taxAmount || 0,
      taxName: taxName || '',
      taxPercentage: taxPercentage || 0,
      shippingAmount: shippingAmount || 0,
      discountAmount: discountAmount || 0,
      paymentMethod: 'razorpay', paymentStatus: 'pending',
      orderStatus: 'processing', razorpayOrderId: razorOrder.id
    });
    
    res.json({ success: true, razorpayOrderId: razorOrder.id, orderId: order._id, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify Razorpay payment
router.post('/razorpay/verify', optionalAuth, async (req, res) => {
  try {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    
    if (expected === razorpay_signature) {
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid' });
      // Clear cart for logged in user
      if (req.user) {
        await User.findByIdAndUpdate(req.user.id, { cartData: {} });
      }
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Guest Track Order
router.post('/tracking', async (req, res) => {
  try {
    const { orderId, email } = req.body;
    if (!orderId || !email) {
      return res.status(400).json({ success: false, message: 'Order ID and Email are required' });
    }
    
    let order;
    const mongoose = require('mongoose');

    // 1. Try finding by full ObjectId if valid
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).populate('userId', 'email');
    } 
    
    // 2. If not found and input is 8 chars, try matching last 8 chars of _id
    if (!order && orderId.length === 8) {
      const orders = await Order.find({
        $expr: {
          $eq: [
            { $toLower: { $substrCP: [{ $toString: "$_id" }, 16, 8] } },
            orderId.toLowerCase()
          ]
        }
      }).populate('userId', 'email');
      
      // Filter by email to ensure we get the right one (in case of rare collisions)
      order = orders.find(o => {
        const oEmail = o.isGuest ? o.guestEmail : o.userId?.email;
        return oEmail?.toLowerCase() === email.toLowerCase();
      });
    }
    
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Double check email matching if found via direct ID
    const customerEmail = order.isGuest ? order.guestEmail : order.userId?.email;
    if (customerEmail?.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Invalid credentials for this order' });
    }
    
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Guest Request Return
router.post('/guest-return', async (req, res) => {
  try {
    const { orderId, email, reason, images } = req.body;
    if (!orderId || !email) {
      return res.status(400).json({ success: false, message: 'Order ID and Email are required' });
    }

    const order = await Order.findById(orderId).populate('userId', 'email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Validate email belongs to order
    const customerEmail = order.isGuest ? order.guestEmail : order.userId?.email;
    if (customerEmail?.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Invalid credentials for this order' });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });
    }
    
    if (order.returnRequested) {
      return res.status(400).json({ success: false, message: 'Return already requested for this order' });
    }

    const settings = await Settings.findOne();
    const maxDays = settings?.returnWindowDays ?? 7;
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(order.updatedAt)) / (1000 * 60 * 60 * 24));
    
    if (diffDays > maxDays) {
       return res.status(400).json({ success: false, message: `Return window of ${maxDays} days has expired.` });
    }

    order.returnRequested = true;
    order.returnReason = reason || 'No reason provided';
    if (images && Array.isArray(images)) {
       order.returnImages = images;
    }
    order.returnStatus = 'pending';

    await order.save();
    res.json({ success: true, message: 'Return request submitted successfully', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user orders
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cancel an order (user action)
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.orderStatus === 'cancelled') return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    
    if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an order that is already shipped or delivered' });
    }
    
    // Add Stock back if order is cancelled
    for (const item of order.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
    }

    order.orderStatus = 'cancelled';
    await order.save();
    
    res.json({ success: true, message: 'Order cancelled successfully', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Request an order return (user action)
router.post('/:id/return', authMiddleware, async (req, res) => {
  try {
    const { reason, images } = req.body;
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });
    }
    
    if (order.returnRequested) {
      return res.status(400).json({ success: false, message: 'Return already requested for this order' });
    }

    const settings = await Settings.findOne();
    const maxDays = settings?.returnWindowDays ?? 7;
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(order.updatedAt)) / (1000 * 60 * 60 * 24));
    
    if (diffDays > maxDays) {
       return res.status(400).json({ success: false, message: `Return window of ${maxDays} days has expired.` });
    }

    order.returnRequested = true;
    order.returnReason = reason || 'No reason provided';
    if (images && Array.isArray(images)) {
       order.returnImages = images;
    }
    order.returnStatus = 'pending';

    await order.save();
    res.json({ success: true, message: 'Return request submitted successfully', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all orders (admin)
router.get('/all', adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate, returns } = req.query;
    const query = status && status !== 'returns' ? { orderStatus: status } : {};
    
    if (returns === 'true' || status === 'returns') {
      query.returnRequested = true;
    }
    
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).populate('userId', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, orders, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update order status (admin)
router.put('/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { orderStatus, paymentStatus, carrierName, trackingId, returnStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const update = {};
    if (orderStatus) update.orderStatus = orderStatus;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (carrierName !== undefined) update.carrierName = carrierName;
    if (trackingId !== undefined) update.trackingId = trackingId;
    if (returnStatus) update.returnStatus = returnStatus;

    // Automatic status change to shipped if tracking provided for a processing order
    if (trackingId && carrierName && (update.orderStatus === 'processing' || (!update.orderStatus && order.orderStatus === 'processing'))) {
      update.orderStatus = 'shipped';
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;

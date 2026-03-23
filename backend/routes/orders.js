const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const Coupon = require('../models/Coupon');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Create order (COD)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { items, address, totalAmount, paymentMethod, couponId } = req.body;
    
    // 📦 Deduct Stock at Order Time (E-commerce Best Practice)
    for (const item of items) {
      if (item.productId) {
        const prod = await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }, { new: true });
        if (prod) {
            await StockLog.create({
                productId: prod._id,
                userId: req.user.id,
                action: 'decrement',
                quantity: item.quantity,
                previousStock: prod.stock + item.quantity,
                currentStock: prod.stock,
                reason: 'New Order Placed (COD)'
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
      userId: req.user.id, items, address, totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: 'processing'
    });
    // Clear cart
    await User.findByIdAndUpdate(req.user.id, { cartData: {} });
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stripe checkout
router.post('/stripe', authMiddleware, async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { items, address, totalAmount, couponId } = req.body;
    
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name, images: item.image ? [item.image] : [] },
        unit_amount: Math.round(item.price * 100)
      },
      lineItems
    }));
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(i => ({ price_data: { currency: 'inr', product_data: { name: i.name }, unit_amount: Math.round(i.price * 100) }, quantity: i.quantity })),
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart`,
      metadata: { userId: req.user.id, address: JSON.stringify(address) }
    });
    
    if (couponId) {
        await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
    }

    // 📦 Deduct Stock at Order Time
    for (const item of items) {
      if (item.productId) {
        const prod = await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }, { new: true });
        if (prod) {
            await StockLog.create({
                productId: prod._id,
                userId: req.user.id,
                action: 'decrement',
                quantity: item.quantity,
                previousStock: prod.stock + item.quantity,
                currentStock: prod.stock,
                reason: 'New Order Placed'
            });
            if (prod.stock <= 0) {
               await Product.findByIdAndUpdate(item.productId, { label: 'Sold Out' });
            }
        }
      }
    }

    const order = await Order.create({
      userId: req.user.id, items, address, totalAmount,
      paymentMethod: 'stripe', paymentStatus: 'pending',
      orderStatus: 'processing', stripeSessionId: session.id
    });
    
    res.json({ success: true, sessionId: session.id, url: session.url, orderId: order._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Razorpay checkout
router.post('/razorpay', authMiddleware, async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const { items, address, totalAmount, couponId } = req.body;
    
    const options = {
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };
    
    const razorOrder = await razorpay.orders.create(options);

    if (couponId) {
        await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
    }

    // 📦 Deduct Stock at Order Time
    for (const item of items) {
      if (item.productId) {
        const prod = await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }, { new: true });
        if (prod) {
            await StockLog.create({
                productId: prod._id,
                userId: req.user.id,
                action: 'decrement',
                quantity: item.quantity,
                previousStock: prod.stock + item.quantity,
                currentStock: prod.stock,
                reason: 'New Order Placed'
            });
            if (prod.stock <= 0) {
               await Product.findByIdAndUpdate(item.productId, { label: 'Sold Out' });
            }
        }
      }
    }

    const order = await Order.create({
      userId: req.user.id, items, address, totalAmount,
      paymentMethod: 'razorpay', paymentStatus: 'pending',
      orderStatus: 'processing', razorpayOrderId: razorOrder.id
    });
    
    res.json({ success: true, razorpayOrderId: razorOrder.id, orderId: order._id, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify Razorpay payment
router.post('/razorpay/verify', authMiddleware, async (req, res) => {
  try {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    
    if (expected === razorpay_signature) {
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid' });
      await User.findByIdAndUpdate(req.user.id, { cartData: {} });
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
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
    
    // 📦 Add Stock back if order is cancelled
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

// Get all orders (admin)
router.get('/all', adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { orderStatus: status } : {};
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
    const { orderStatus, paymentStatus, carrierName, trackingId } = req.body;
    const update = {};
    if (orderStatus) update.orderStatus = orderStatus;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (carrierName !== undefined) update.carrierName = carrierName;
    if (trackingId !== undefined) update.trackingId = trackingId;
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

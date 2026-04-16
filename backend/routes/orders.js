const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');
const { authMiddleware, adminMiddleware, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const checkMaintenance = async (req, res, next) => {
  const settings = await Settings.findOne();
  if (settings && settings.maintenanceMode) {
    return res.status(403).json({ success: false, message: settings.maintenanceMessage || 'Purchasing is temporarily disabled.' });
  }
  next();
};
const { sendEmail, sendStockAlertEmail } = require('../utils/email');

// Email dispatch helper for order lifecycle events
const sendOrderEmailObj = async (order, type, customMessage = '') => {
  try {
    const settings = await Settings.findOne();
    
    // Resolve customer email - handle both populated and unpopulated userId
    let customerEmail = order.isGuest ? order.guestEmail : null;
    if (!customerEmail && order.userId) {
      if (typeof order.userId === 'object' && order.userId.email) {
        customerEmail = order.userId.email;
      } else {
        // userId is just an ObjectId, look up the user
        const user = await User.findById(order.userId, 'email');
        customerEmail = user?.email;
      }
    }
    
    const adminEmail = settings?.notifications?.adminNotificationEmail || settings?.contactEmail;
    
    const getItemsHtml = () => order.items.map(i => `${i.quantity}x ${i.name} ${i.color ? '(' + i.color + ')' : ''} ${i.size ? '- Size: ' + i.size : ''}`).join('<br>');
    const orderIdShort = order._id.toString().slice(-8).toUpperCase();
    const orderDetails = `<b>Order ID:</b> #${orderIdShort}<br><b>Amount:</b> ${order.currency || 'INR'} ${order.totalAmount}<br><b>Payment:</b> ${(order.paymentMethod || '').toUpperCase()}<br><br><b>Items:</b><br>${getItemsHtml()}`;

    if (type === 'create' && settings?.notifications?.orderConfirmation) {
       if (customerEmail) sendEmail(customerEmail, `Order Confirmed #${orderIdShort}`, 'Thank You for Your Order!', 'Your order has been successfully placed and is being processed. We will notify you once it ships.', orderDetails);
       if (adminEmail) sendEmail(adminEmail, `New Order Received #${orderIdShort}`, 'New Order Alert', `A new order has been placed by <b>${customerEmail || 'Guest'}</b>.`, orderDetails);
    }
    else if (type === 'shipped' && settings?.notifications?.orderConfirmation) {
       if (customerEmail) sendEmail(customerEmail, `Order Shipped #${orderIdShort}`, 'Your Order is On the Way!', `Great news! Your order has been shipped.<br><br><b>Carrier:</b> ${order.carrierName || 'Courier Partner'}<br><b>Tracking ID:</b> ${order.trackingId || 'Will be updated shortly'}`, orderDetails);
    }
    else if (type === 'delivered' && settings?.notifications?.orderConfirmation) {
       if (customerEmail) sendEmail(customerEmail, `Order Delivered #${orderIdShort}`, 'Order Delivered!', 'Your order has been delivered successfully. We hope you love your purchase!', orderDetails);
    }
    else if (type === 'refunded') {
       if (customerEmail) sendEmail(customerEmail, `Refund Processed #${orderIdShort}`, 'Refund Processed', 'We have successfully processed a refund for your order. The amount will be credited to your original payment method.', orderDetails);
       if (adminEmail) sendEmail(adminEmail, `Refund Issued #${orderIdShort}`, 'Refund Alert', `A refund has been issued for order <b>#${orderIdShort}</b>.`, orderDetails);
    }
    else if (type === 'return_requested' && settings?.notifications?.returnRequest) {
       if (customerEmail) sendEmail(customerEmail, `Return Request Received #${orderIdShort}`, 'Return Request Received', 'We have received your return request and our team will review it shortly. You will be notified once it is processed.', `<b>Return Reason:</b> ${order.returnReason || 'Not specified'}<br><br>` + orderDetails);
       if (adminEmail) sendEmail(adminEmail, `Return Request #${orderIdShort}`, 'New Return Request', `A customer has requested a return for order <b>#${orderIdShort}</b>.`, `<b>Customer:</b> ${customerEmail}<br><b>Reason:</b> ${order.returnReason || 'Not specified'}<br><br>` + orderDetails);
    }
    else if (type === 'return_cancelled') {
       if (customerEmail) sendEmail(customerEmail, `Return Cancelled #${orderIdShort}`, 'Return Request Cancelled', `Your return request for order <b>#${orderIdShort}</b> has been cancelled.${customMessage ? '<br><br><b>Reason:</b> ' + customMessage : ''}`, orderDetails);
    }
    else if (type === 'return_accepted') {
       if (customerEmail) sendEmail(customerEmail, `Return Approved #${orderIdShort}`, 'Return Request Approved!', 'Your return request has been approved. Please ship the item back following the instructions provided by our support team.', orderDetails);
    }
    else if (type === 'item_received') {
       if (customerEmail) sendEmail(customerEmail, `Item Received #${orderIdShort}`, 'Returned Item Received', 'We have successfully received your returned item. Your refund will be processed shortly.', orderDetails);
    }
    else if (type === 'cancelled') {
       if (customerEmail) sendEmail(customerEmail, `Order Cancelled #${orderIdShort}`, 'Order Cancelled', 'Your order has been cancelled successfully. If you were charged, a refund will be processed.', orderDetails);
       if (adminEmail) sendEmail(adminEmail, `Order Cancelled #${orderIdShort}`, 'Cancellation Alert', `Order <b>#${orderIdShort}</b> has been cancelled by the customer.`, orderDetails);
    }
  } catch (err) { console.error('Email dispatch error:', err); }
};

router.post('/create', optionalAuth, checkMaintenance, async (req, res) => {
  try {
    const { items, address, totalAmount, paymentMethod, couponId, guestEmail, guestPhone,
            currency, orderCountry, subtotal, taxAmount, taxName, taxPercentage, shippingAmount, discountAmount } = req.body;
    
    // Check if guest info is provided if no user
    if (!req.user && !guestEmail) {
      return res.status(400).json({ success: false, message: 'Customer information is required for guest checkout' });
    }

    if (paymentMethod === 'cod') {
      const pIds = items.map(i => i.productId);
      const nonCodItems = await Product.find({ _id: { $in: pIds }, codAllowed: false });
      if (nonCodItems.length > 0) {
        return res.status(400).json({ success: false, message: `Cash on Delivery is not available for some items: ${nonCodItems.map(p => p.name).join(', ')}` });
      }
    }

    // Deduct Stock at Order Time
    for (const item of items) {
      if (item.productId) {
        let prod = await Product.findById(item.productId);
        if (prod) {
           let updatedStock = 0; let prevStock = 0; let reasonText = req.user ? 'New Order' : 'Guest Order';
           
           const vIndex = (item.color && prod.variants) ? prod.variants.findIndex(v => v.color === item.color) : -1;
           if (vIndex !== -1) {
              const variant = prod.variants[vIndex];
              const sIndex = (item.size && variant.inventory) ? variant.inventory.findIndex(inv => inv.size === item.size) : -1;
              
              if (sIndex !== -1) {
                  prevStock = variant.inventory[sIndex].stock || 0;
                  variant.inventory[sIndex].stock = Math.max(0, prevStock - item.quantity);
                  updatedStock = variant.inventory[sIndex].stock;
                  reasonText += ` (${item.color} - ${item.size})`;
              } else {
                  prevStock = variant.stock || 0;
                  variant.stock = Math.max(0, prevStock - item.quantity);
                  updatedStock = variant.stock;
                  reasonText += ` (${item.color})`;
              }

              if (sIndex !== -1) {
                  variant.stock = variant.inventory.reduce((sum, inv) => sum + (inv.stock || 0), 0);
              }
              prod.stock = prod.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
              
           } else {
              prevStock = prod.stock || 0;
              prod.stock = Math.max(0, prevStock - item.quantity);
              updatedStock = prod.stock;
           }

           prod.markModified('variants');
           await prod.save();

           await StockLog.create({
                productId: prod._id,
                userId: req.user ? req.user.id : null,
                action: 'decrement',
                quantity: item.quantity,
                previousStock: prevStock,
                currentStock: updatedStock,
                reason: reasonText, color: item.color || null, size: item.size || null
           });

           // Stock alert emails
           const stockSettings = await Settings.findOne();
           const lowStockThreshold = stockSettings?.notifications?.lowStockThreshold ?? 5;
           
           let variantInfo = null;
           if (item.color || item.size) {
               variantInfo = { color: item.color || '-', size: item.size || '-' };
           }

           if (variantInfo) {
               if (updatedStock <= 0) {
                   await Product.findByIdAndUpdate(item.productId, { label: 'Sold Out' });
                   sendStockAlertEmail(prod, 'out_of_stock', 0, reasonText, variantInfo);
               } else if (updatedStock <= lowStockThreshold) {
                   sendStockAlertEmail(prod, 'low_stock', updatedStock, reasonText, variantInfo);
               }
           } else {
               if (prod.stock <= 0) {
                   await Product.findByIdAndUpdate(item.productId, { label: 'Sold Out' });
                   sendStockAlertEmail(prod, 'out_of_stock', 0, reasonText);
               } else if (prod.stock <= lowStockThreshold) {
                   sendStockAlertEmail(prod, 'low_stock', prod.stock, reasonText);
               }
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
    
    // Dispatch Email immediately for COD orders
    sendOrderEmailObj(order, 'create');

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stripe checkout
router.post('/stripe', optionalAuth, checkMaintenance, async (req, res) => {
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
        let prod = await Product.findById(item.productId);
        if (prod) {
           let updatedStock = 0; let prevStock = 0; let reasonText = 'New Order (Stripe)';
           
           const vIndex = (item.color && prod.variants) ? prod.variants.findIndex(v => v.color === item.color) : -1;
           if (vIndex !== -1) {
              const variant = prod.variants[vIndex];
              const sIndex = (item.size && variant.inventory) ? variant.inventory.findIndex(inv => inv.size === item.size) : -1;
              
              if (sIndex !== -1) {
                  prevStock = variant.inventory[sIndex].stock || 0;
                  variant.inventory[sIndex].stock = Math.max(0, prevStock - item.quantity);
                  updatedStock = variant.inventory[sIndex].stock;
                  reasonText += ` (${item.color} - ${item.size})`;
              } else {
                  prevStock = variant.stock || 0;
                  variant.stock = Math.max(0, prevStock - item.quantity);
                  updatedStock = variant.stock;
                  reasonText += ` (${item.color})`;
              }
              
              if (sIndex !== -1) {
                  variant.stock = variant.inventory.reduce((sum, inv) => sum + (inv.stock || 0), 0);
              }
              prod.stock = prod.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
              
           } else {
              prevStock = prod.stock || 0;
              prod.stock = Math.max(0, prevStock - item.quantity);
              updatedStock = prod.stock;
           }

           prod.markModified('variants');
           await prod.save();

           await StockLog.create({
                productId: prod._id,
                userId: req.user ? req.user.id : null,
                action: 'decrement',
                quantity: item.quantity,
                previousStock: prevStock,
                currentStock: updatedStock,
                reason: reasonText, color: item.color || null, size: item.size || null
           });

           // Stock alert emails
           const stockSettings = await Settings.findOne();
           const lowStockThreshold = stockSettings?.notifications?.lowStockThreshold ?? 5;
           
           let variantInfo = null;
           if (item.color || item.size) {
               variantInfo = { color: item.color || '-', size: item.size || '-' };
           }

           if (variantInfo) {
               if (updatedStock <= 0) {
                   await Product.findByIdAndUpdate(item.productId, { label: 'Sold Out' });
                   sendStockAlertEmail(prod, 'out_of_stock', 0, reasonText, variantInfo);
               } else if (updatedStock <= lowStockThreshold) {
                   sendStockAlertEmail(prod, 'low_stock', updatedStock, reasonText, variantInfo);
               }
           } else {
               if (prod.stock <= 0) {
                   await Product.findByIdAndUpdate(item.productId, { label: 'Sold Out' });
                   sendStockAlertEmail(prod, 'out_of_stock', 0, reasonText);
               } else if (prod.stock <= lowStockThreshold) {
                   sendStockAlertEmail(prod, 'low_stock', prod.stock, reasonText);
               }
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

    // Dispatch Email for Stripe order
    sendOrderEmailObj(order, 'create');
    
    res.json({ success: true, sessionId: session.id, url: session.url, orderId: order._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Razorpay checkout
router.post('/razorpay', optionalAuth, checkMaintenance, async (req, res) => {
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
        let prod = await Product.findById(item.productId);
        if (prod) {
           let updatedStock = 0; let prevStock = 0; let reasonText = 'New Order (Razorpay)';
           const vIndex = (item.color && prod.variants) ? prod.variants.findIndex(v => v.color === item.color) : -1;
           
           if (vIndex !== -1) {
              prevStock = prod.variants[vIndex].stock || 0;
              prod.variants[vIndex].stock = prevStock - item.quantity;
              updatedStock = prod.variants[vIndex].stock;
              reasonText += ` - Variant: ${item.color}`;
           } else {
              prevStock = prod.stock || 0;
              prod.stock = prevStock - item.quantity;
              updatedStock = prod.stock;
           }

           prod.markModified('variants');
           await prod.save();

           await StockLog.create({
                productId: prod._id,
                userId: req.user ? req.user.id : null,
                action: 'decrement',
                quantity: item.quantity,
                previousStock: prevStock,
                currentStock: updatedStock,
                reason: reasonText, color: item.color || null, size: item.size || null
           });

           // Stock alert emails
           const stockSettingsRz = await Settings.findOne();
           const lowStockThresholdRz = stockSettingsRz?.notifications?.lowStockThreshold ?? 5;
           if (prod.stock <= 0) {
              await Product.findByIdAndUpdate(item.productId, { label: 'Sold Out' });
              sendStockAlertEmail(prod, 'out_of_stock', 0);
           } else if (prod.stock <= lowStockThresholdRz) {
              sendStockAlertEmail(prod, 'low_stock', prod.stock);
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
      const order = await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid' }, { new: true }).populate('userId', 'email');
      
      // Dispatch Order Confirmed Email
      if (order) sendOrderEmailObj(order, 'create');
      
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
router.post('/guest-return', upload.array('images', 5), async (req, res) => {
  try {
    const { orderId, email, reason } = req.body;
    const images = req.files ? req.files.map(f => f.path.replace(/\\/g, '/')) : [];
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
    const globalReturnDays = settings?.returnWindowDays ?? 7;

    const productIds = order.items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    let minReturnDays = globalReturnDays;
    let nonReturnableItemNames = [];

    for (const item of order.items) {
      const prod = products.find(p => p._id.toString() === item.productId.toString());
      if (prod) {
         if (prod.returnWindowDays === 0) {
            nonReturnableItemNames.push(prod.name);
         } else if (prod.returnWindowDays !== null && prod.returnWindowDays !== undefined) {
            minReturnDays = Math.min(minReturnDays, prod.returnWindowDays);
         }
      }
    }

    if (nonReturnableItemNames.length > 0) {
       return res.status(400).json({ success: false, message: `Order contains non-returnable items: ${nonReturnableItemNames.join(', ')}` });
    }

    const deliveryDate = order.deliveredAt || order.updatedAt;
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(deliveryDate)) / (1000 * 60 * 60 * 24));
    
    if (diffDays > minReturnDays) {
       return res.status(400).json({ success: false, message: `Return window of ${minReturnDays} days has expired.` });
    }

    order.returnRequested = true;
    order.returnReason = reason || 'No reason provided';
    if (images && Array.isArray(images)) {
       order.returnImages = images;
    }
    order.returnStatus = 'pending';

    await order.save();

    // Dispatch Return Request Email (guest)
    sendOrderEmailObj(order, 'return_requested');

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
        let prod = await Product.findById(item.productId);
        if (prod) {
           let prevStock = 0;
           let updatedStock = 0;
           let baseReason = `Order Cancelled: #${order._id.toString().slice(-8).toUpperCase()}`;

           const vIndex = (item.color && prod.variants) ? prod.variants.findIndex(v => v.color === item.color) : -1;
           if (vIndex !== -1) {
              const variant = prod.variants[vIndex];
              const sIndex = (item.size && variant.inventory) ? variant.inventory.findIndex(inv => inv.size === item.size) : -1;
              
              if (sIndex !== -1) {
                 prevStock = variant.inventory[sIndex].stock || 0;
                 variant.inventory[sIndex].stock = prevStock + item.quantity;
                 updatedStock = variant.inventory[sIndex].stock;
                 baseReason += ` (${item.color} - ${item.size})`;
              } else {
                 prevStock = variant.stock || 0;
                 variant.stock = prevStock + item.quantity;
                 updatedStock = variant.stock;
                 baseReason += ` (${item.color})`;
              }
              
              if (sIndex !== -1) {
                 variant.stock = variant.inventory.reduce((sum, inv) => sum + (inv.stock || 0), 0);
              }
              prod.stock = prod.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
              
           } else {
              prevStock = prod.stock || 0;
              prod.stock = prevStock + item.quantity;
              updatedStock = prod.stock;
           }


           prod.markModified('variants');
           await prod.save();

           await StockLog.create({
              productId: prod._id,
              userId: req.user.id,
              action: 'increment',
              quantity: item.quantity,
              previousStock: prevStock,
              currentStock: updatedStock,
              reason: baseReason, color: item.color || null, size: item.size || null
           });
        }
      }
    }

    order.orderStatus = 'cancelled';
    order.cancellationReason = req.body.reason || 'Cancelled by user';
    order.cancelledBy = 'user';
    await order.save();

    // Dispatch Cancellation Email
    const populatedCancelOrder = await Order.findById(order._id).populate('userId', 'email');
    sendOrderEmailObj(populatedCancelOrder || order, 'cancelled');
    
    res.json({ success: true, message: 'Order cancelled successfully', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Request an order return (user action)
router.post('/:id/return', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const { reason } = req.body;
    const images = req.files ? req.files.map(f => f.path.replace(/\\/g, '/')) : [];
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });
    }
    
    if (order.returnRequested) {
      return res.status(400).json({ success: false, message: 'Return already requested for this order' });
    }

    const settings = await Settings.findOne();
    const globalReturnDays = settings?.returnWindowDays ?? 7;

    const productIds = order.items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    let minReturnDays = globalReturnDays;
    let nonReturnableItemNames = [];

    for (const item of order.items) {
      const prod = products.find(p => p._id.toString() === item.productId.toString());
      if (prod) {
         if (prod.returnWindowDays === 0) {
            nonReturnableItemNames.push(prod.name);
         } else if (prod.returnWindowDays !== null && prod.returnWindowDays !== undefined) {
            minReturnDays = Math.min(minReturnDays, prod.returnWindowDays);
         }
      }
    }

    if (nonReturnableItemNames.length > 0) {
       return res.status(400).json({ success: false, message: `Order contains non-returnable items: ${nonReturnableItemNames.join(', ')}` });
    }

    const deliveryDate = order.deliveredAt || order.updatedAt;
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(deliveryDate)) / (1000 * 60 * 60 * 24));
    
    if (diffDays > minReturnDays) {
       return res.status(400).json({ success: false, message: `Return window of ${minReturnDays} days has expired.` });
    }

    order.returnRequested = true;
    order.returnReason = reason || 'No reason provided';
    if (images && Array.isArray(images)) {
       order.returnImages = images;
    }
    order.returnStatus = 'pending';

    await order.save();

    // Dispatch Return Request Email (logged-in user)
    const populatedReturnOrder = await Order.findById(order._id).populate('userId', 'email');
    sendOrderEmailObj(populatedReturnOrder || order, 'return_requested');

    res.json({ success: true, message: 'Return request submitted successfully', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all orders (admin)
router.get('/all', adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate, returns, returnStatus, search } = req.query;
    let query = {};
    if (status && status !== 'returns' && !status.includes(',')) {
      query.orderStatus = status;
    } else if (status && status.includes(',')) {
      query.orderStatus = { $in: status.split(',') };
    }
    
    if (returns === 'true' || status === 'returns') {
      query.returnRequested = true;
      
      // Apply specific return status filter if provided
      if (returnStatus && returnStatus !== 'all') {
        if (returnStatus === 'return_request') {
          query.returnStatus = 'pending';
        } else if (returnStatus === 'return_approved') {
          query.returnStatus = 'approved';
        } else if (returnStatus === 'item_received') {
          query.returnStatus = 'received';
        } else if (returnStatus === 'refund_pending') {
          query.returnStatus = 'received';
          query.paymentStatus = { $ne: 'refunded' };
        } else if (returnStatus === 'refunded') {
          query.paymentStatus = 'refunded';
        } else if (returnStatus === 'return_cancelled') {
          query.returnStatus = 'rejected';
        }
      }
    }
    
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      const orConditions = [
        { 'address.fullName': searchRegex },
        { 'address.phone': searchRegex },
        { guestEmail: searchRegex },
        { guestPhone: searchRegex }
      ];

      // Try searching _id if the search looks like a valid 24 char hex
      if (search.trim().length === 24 && /^[0-9a-fA-F]{24}$/.test(search.trim())) {
        orConditions.push({ _id: search.trim() });
      }

      // We will need to query Users to match email or name in user reference
      const User = require('../models/User');
      const matchedUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }]
      }).select('_id');
      
      if (matchedUsers.length > 0) {
        orConditions.push({ userId: { $in: matchedUsers.map(u => u._id) } });
      }

      if (query.$or) {
        // If there are already any $or conditions from somewhere else (currently there aren't but defensive coding)
        query.$and = query.$and || [];
        query.$and.push({ $or: orConditions });
      } else {
        query.$or = orConditions;
      }
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
    if (orderStatus) {
      if (orderStatus === 'shipped') {
        const hasLogistics = (carrierName && trackingId) || (order.carrierName && order.trackingId);
        if (!hasLogistics) {
          return res.status(400).json({ 
            success: false, 
            message: 'To mark an order as shipped, you must first provide Carrier Name and Tracking ID.' 
          });
        }
      }
      update.orderStatus = orderStatus;
      if (orderStatus === 'delivered' && order.orderStatus !== 'delivered') {
        update.deliveredAt = new Date();
      }
      if (orderStatus === 'cancelled') {
        update.cancellationReason = req.body.cancellationReason || 'Cancelled by administrator';
        update.cancelledBy = 'admin';
        
        // Restore stock if admin cancels
        if (order.orderStatus !== 'cancelled') {
            for (const item of order.items) {
                if (item.productId) {
                    let prod = await Product.findById(item.productId);
                    if (prod) {
                        let prevStock = 0;
                        let updatedStock = 0;
                        let baseReason = `Order Cancelled (Admin): #${order._id.toString().slice(-8).toUpperCase()}`;
                        
                        const vIndex = (item.color && prod.variants) ? prod.variants.findIndex(v => v.color === item.color) : -1;
                        if (vIndex !== -1) {
                            const variant = prod.variants[vIndex];
                            const sIndex = (item.size && variant.inventory) ? variant.inventory.findIndex(inv => inv.size === item.size) : -1;
                            
                            if (sIndex !== -1) {
                                prevStock = variant.inventory[sIndex].stock || 0;
                                variant.inventory[sIndex].stock = prevStock + item.quantity;
                                updatedStock = variant.inventory[sIndex].stock;
                                baseReason += ` (${item.color} - ${item.size})`;
                            } else {
                                prevStock = variant.stock || 0;
                                variant.stock = prevStock + item.quantity;
                                updatedStock = variant.stock;
                                baseReason += ` (${item.color})`;
                            }
                            
                            if (sIndex !== -1) {
                                variant.stock = variant.inventory.reduce((sum, inv) => sum + (inv.stock || 0), 0);
                            }
                            prod.stock = prod.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
                            
                        } else {
                            prevStock = prod.stock || 0;
                            prod.stock = prevStock + item.quantity;
                            updatedStock = prod.stock;
                        }

           prod.markModified('variants');
           await prod.save();

                        await StockLog.create({
                           productId: prod._id,
                           userId: req.user.id === 'admin' ? null : req.user.id,
                           action: 'increment',
                           quantity: item.quantity,
                           previousStock: prevStock,
                           currentStock: updatedStock,
                           reason: baseReason, color: item.color || null, size: item.size || null
                        });
                    }
                }
            }
        }
      }
    }
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (carrierName !== undefined) update.carrierName = carrierName;
    if (trackingId !== undefined) update.trackingId = trackingId;
    
    if (returnStatus) {
      // 1. INVENTORY RESTORATION: When an item is marked as "received" for the FIRST time in this return flow
      if (returnStatus === 'received' && order.returnStatus !== 'received') {
        update.orderStatus = 'returned'; // Automatically update order status to returned
        
        for (const item of order.items) {
           if (item.productId) {
             let prod = await Product.findById(item.productId);
             if (prod) {
                let updatedStock = 0; let prevStock = 0; let baseReason = `Return Received: Order #${order._id.toString().slice(-8).toUpperCase()}`;
                
                const vIndex = (item.color && prod.variants) ? prod.variants.findIndex(v => v.color === item.color) : -1;
                if (vIndex !== -1) {
                    const variant = prod.variants[vIndex];
                    const sIndex = (item.size && variant.inventory) ? variant.inventory.findIndex(inv => inv.size === item.size) : -1;
                    
                    if (sIndex !== -1) {
                        prevStock = variant.inventory[sIndex].stock || 0;
                        variant.inventory[sIndex].stock = prevStock + item.quantity;
                        updatedStock = variant.inventory[sIndex].stock;
                        baseReason += ` (${item.color} - ${item.size})`;
                    } else {
                        prevStock = variant.stock || 0;
                        variant.stock = prevStock + item.quantity;
                        updatedStock = variant.stock;
                        baseReason += ` (${item.color})`;
                    }
                    
                    if (sIndex !== -1) {
                        variant.stock = variant.inventory.reduce((sum, inv) => sum + (inv.stock || 0), 0);
                    }
                    prod.stock = prod.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
                    
                } else {
                   prevStock = prod.stock || 0;
                   prod.stock = prevStock + item.quantity;
                   updatedStock = prod.stock;
                }
                

           prod.markModified('variants');
           await prod.save();

                // Record the inventory movement
                await StockLog.create({
                   productId: prod._id,
                   userId: req.user.id === 'admin' ? null : req.user.id,
                   action: 'increment',
                   quantity: item.quantity,
                   previousStock: prevStock,
                   currentStock: updatedStock,
                   reason: baseReason, color: item.color || null, size: item.size || null
                });
                
                // If it was sold out, clear the label
                if (prod.stock > 0 && prod.label === 'Sold Out') {
                   await Product.findByIdAndUpdate(item.productId, { label: '' });
                }
             }
           }
        }
      }
      
      // 2. FINANCIAL SETTLEMENT: When the refund is finalized, update payment status
      if (returnStatus === 'refunded') {
        update.paymentStatus = 'refunded';
      }
      
      update.returnStatus = returnStatus;
    }

    // Automatic status change to shipped if tracking provided for a processing order
    if (trackingId && carrierName && (update.orderStatus === 'processing' || (!update.orderStatus && order.orderStatus === 'processing'))) {
      update.orderStatus = 'shipped';
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, update, { new: true }).populate('userId', 'email');

    // Dispatch Emails based on what changed
    if (updatedOrder) {
      // Order status change emails
      if (update.orderStatus === 'shipped') {
        sendOrderEmailObj(updatedOrder, 'shipped');
      }
      if (update.orderStatus === 'delivered') {
        sendOrderEmailObj(updatedOrder, 'delivered');
      }
      // Return status change emails
      if (returnStatus === 'approved') {
        sendOrderEmailObj(updatedOrder, 'return_accepted');
      }
      if (returnStatus === 'rejected') {
        sendOrderEmailObj(updatedOrder, 'return_cancelled');
      }
      if (returnStatus === 'received') {
        sendOrderEmailObj(updatedOrder, 'item_received');
      }
      if (returnStatus === 'refunded') {
        sendOrderEmailObj(updatedOrder, 'refunded');
      }
    }

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;

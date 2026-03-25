const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { adminMiddleware } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Get settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update settings (Admin)
router.put('/', adminMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({ success: true, settings, message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Test Email (Admin)
router.post('/test-email', adminMiddleware, async (req, res) => {
  const { to } = req.body;
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.smtpConfig.host) {
      return res.status(400).json({ success: false, message: 'SMTP is not configured' });
    }

    const { host, port, secure, user, pass, from } = settings.smtpConfig;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for other ports
      auth: { user, pass },
      tls: {
          rejectUnauthorized: false // Helps avoid SSL validation errors on some SMTP hosts
      }
    });

    const info = await transporter.sendMail({
      from: from || user,
      to,
      subject: 'Test Email from Thaarai Designers',
      text: 'This is a test email from your Admin Configuration page.',
      html: '<b>This is a test email from your Admin Configuration page.</b>'
    });

    res.json({ success: true, message: 'Test email sent successfully', messageId: info.messageId });
  } catch (err) {
    res.status(500).json({ success: false, message: `Email failed: ${err.message}` });
  }
});

module.exports = router;

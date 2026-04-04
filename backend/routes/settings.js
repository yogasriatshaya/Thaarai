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
    } else {
      let changed = false;
      if (settings.countryConfig.IN.taxPercentage === undefined || settings.countryConfig.IN.taxPercentage === null) {
        settings.countryConfig.IN.taxPercentage = 18;
        settings.countryConfig.IN.taxName = 'GST';
        settings.countryConfig.IN.taxInclusive = false;
        changed = true;
      }
      if (settings.countryConfig.US.taxPercentage === undefined || settings.countryConfig.US.taxPercentage === null) {
        settings.countryConfig.US.taxPercentage = 8;
        settings.countryConfig.US.taxName = 'Sales Tax';
        settings.countryConfig.US.taxInclusive = false;
        changed = true;
      }
      if (changed) await settings.save();
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
      // Loop over keys to ensure Mongoose detects nested object changes
      for (const key in req.body) {
        settings[key] = req.body[key];
      }
      settings.markModified('smtpConfig');
      settings.markModified('countryConfig');
      settings.markModified('notifications');
      settings.markModified('socialLinks');
      
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
      secure: Number(port) === 465, // Force secure if port is 465
      auth: { user, pass }
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

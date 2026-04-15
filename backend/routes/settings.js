const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getTransporter } = require('../utils/email');

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
router.put('/', adminMiddleware, upload.any(), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      const updateData = { ...req.body };

      // Handle file uploads for fallbacks
      if (req.files && req.files.length > 0) {
        const bannerFile = req.files.find(f => f.fieldname === 'bannerFallback');
        const productFile = req.files.find(f => f.fieldname === 'productFallback');
        
        if (bannerFile) updateData.bannerFallback = bannerFile.path.replace(/\\/g, '/');
        if (productFile) updateData.productFallback = productFile.path.replace(/\\/g, '/');
      }

      // Loop over keys to ensure Mongoose detects nested object changes
      for (const key in updateData) {
        // Handle nested JSON strings if they come from FormData
        try {
          if (typeof updateData[key] === 'string' && (updateData[key].startsWith('{') || updateData[key].startsWith('['))) {
            settings[key] = JSON.parse(updateData[key]);
          } else {
            settings[key] = updateData[key];
          }
        } catch (e) {
          settings[key] = updateData[key];
        }
      }
      
      settings.markModified('smtpConfig');
      settings.markModified('countryConfig');
      settings.markModified('notifications');
      settings.markModified('socialLinks');
      
      await settings.save();
    }
    res.json({ success: true, settings, message: 'Settings updated successfully' });
  } catch (err) {
    console.error('SETTINGS UPDATE ERROR:', err);
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

    const transporter = await getTransporter();
    if (!transporter) {
       return res.status(500).json({ success: false, message: 'Failed to create mail transporter' });
    }

    const info = await transporter.sendMail({
        from: settings.smtpConfig.from || settings.smtpConfig.user,

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


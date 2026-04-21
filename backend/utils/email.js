const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

const getTransporter = async () => {
    try {
        const settings = await Settings.findOne();
        let smtp = settings?.smtpConfig;

        // Fallback to process.env if not in DB
        if (!smtp || !smtp.host) {
            if (process.env.SMTP_HOST) {
                smtp = {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                    secure: process.env.SMTP_SECURE === 'true'
                };
            }
        }

        if (!smtp || !smtp.host) {
            console.warn('SMTP not configured in DB or .env');
            return null;
        }

        const { host, port, user, pass, secure } = smtp;
        
        let transportConfig;
        
        if (host && (host.includes('gmail.com') || host.includes('smtp.gmail.com'))) {
            // Priority 1: Use the built-in 'gmail' service config which is most robust
            transportConfig = {
                service: 'gmail',
                auth: { user, pass },
                tls: { rejectUnauthorized: false }
            };
        } else {
            // Priority 2: Standard SMTP configuration
            transportConfig = {
                host,
                port: Number(port),
                secure: secure !== undefined ? secure : Number(port) === 465,
                auth: { user, pass },
                tls: { rejectUnauthorized: false }
            };
        }

        return nodemailer.createTransport(transportConfig);
    } catch (error) {
        console.error('Error creating email transporter:', error);
        return null;
    }
};

const getEmailTemplate = (title, message, orderDetails = '') => {
    const year = new Date().getFullYear();
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f1ec;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ec;padding:30px 10px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        
        <!-- Header with Logo -->
        <tr>
          <td style="background-color:#1a1a1a;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:6px;color:#c9a96e;font-weight:400;">THAARAI</h1>
            <p style="margin:4px 0 0;font-size:9px;letter-spacing:4px;color:#999;text-transform:uppercase;">Luxury Ethnic Designers</p>
          </td>
        </tr>

        <!-- Gold divider -->
        <tr><td style="background:linear-gradient(90deg,#c9a96e,#e8d5a3,#c9a96e);height:3px;"></td></tr>

        <!-- Title -->
        <tr>
          <td style="padding:35px 40px 10px;text-align:center;">
            <h2 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1a1a;font-weight:400;letter-spacing:1px;">${title}</h2>
          </td>
        </tr>

        <!-- Body Message -->
        <tr>
          <td style="padding:15px 40px 25px;color:#555;font-size:14px;line-height:1.8;">
            ${message}
          </td>
        </tr>

        <!-- Order Details Box -->
        ${orderDetails ? `
        <tr>
          <td style="padding:0 40px 30px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf8f4;border:1px solid #e8e2d6;border-radius:6px;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0 0 10px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c9a96e;font-weight:600;">Order Details</p>
                  <div style="font-size:13px;color:#444;line-height:1.8;">${orderDetails}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ` : ''}

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #eee;margin:0;"></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:25px 40px;text-align:center;">
            <p style="margin:0 0 5px;font-size:11px;color:#999;">&copy; ${year} Thaarai Designers. All rights reserved.</p>
            <p style="margin:0;font-size:10px;color:#bbb;">Need help? Reply to this email or visit our website.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const sendEmail = async (to, subject, title, message, orderDetails = '') => {
    try {
        const settings = await Settings.findOne();
        const hasSmtp = settings?.smtpConfig?.host || process.env.SMTP_HOST;
        
        if (!hasSmtp) {
            console.warn('Email skipped: SMTP not configured in Settings or .env.');
            return { success: false, message: 'Email service not configured' };
        }

        const transporter = await getTransporter();
        if (!transporter) {
            return { success: false, message: 'Failed to create mail transporter' };
        }

        const fromName = settings?.siteName || process.env.SITE_NAME || 'Thaarai Designers';
        const fromEmail = settings?.smtpConfig?.from || settings?.smtpConfig?.user || process.env.SMTP_USER || 'no-reply@thaarai.com';

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject: `${fromName} - ${subject}`,
            html: getEmailTemplate(title, message, orderDetails)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId, 'to:', to);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending failed:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Send a stock alert email to the admin.
 * @param {object} product - Mongoose Product document
 * @param {'low_stock'|'out_of_stock'} alertType
 * @param {number} currentStock - The stock level that triggered the alert
 * @param {string} reason - Reason for the adjustment (optional)
 */
const sendStockAlertEmail = async (product, alertType, currentStock, reason = '', variantInfo = null) => {
    try {
        const settings = await Settings.findOne();
        if (!settings?.notifications?.lowStockAlert) return; // feature disabled

        const adminEmail = settings?.notifications?.adminNotificationEmail || settings?.contactEmail;
        if (!adminEmail) {
            console.warn('Stock alert skipped: no admin notification email configured.');
            return;
        }

        const isOutOfStock = alertType === 'out_of_stock';
        
        let itemNameTitle = product.name;
        let variantDetailHtml = '';
        if (variantInfo) {
            itemNameTitle = `${product.name} (Variant: ${variantInfo.color} - Size: ${variantInfo.size})`;
            variantDetailHtml = `<b>Variant:</b> ${variantInfo.color} - Size ${variantInfo.size}<br>`;
        }

        const subject = isOutOfStock
            ? `⚠️ Out of Stock: ${itemNameTitle}`
            : `🔔 Low Stock Alert: ${itemNameTitle}`;

        const title = isOutOfStock ? 'Product Out of Stock!' : 'Low Stock Warning';

        const message = isOutOfStock
            ? `The following item has gone <b>completely out of stock</b> after a recent order. Please restock it as soon as possible to avoid missing future sales.`
            : `The following item is running <b>low on stock</b> (${currentStock} unit${currentStock !== 1 ? 's' : ''} remaining). Please consider restocking soon.`;

        const imageUrl = (product.images && product.images[0])
            ? product.images[0].startsWith('http')
                ? product.images[0]
                : `${process.env.BACKEND_URL || 'http://localhost:5000'}/${product.images[0]}`
            : null;

        const imageHtml = imageUrl
            ? `<tr><td style="padding:0 40px 20px;text-align:center;"><img src="${imageUrl}" alt="${product.name}" style="max-width:200px;max-height:200px;object-fit:cover;border-radius:6px;border:1px solid #e8e2d6;" /></td></tr>`
            : '';

        const stockBadgeColor = isOutOfStock ? '#dc2626' : '#d97706';
        const stockBadgeBg = isOutOfStock ? '#fef2f2' : '#fffbeb';
        const stockBadgeText = isOutOfStock ? 'OUT OF STOCK' : `LOW STOCK: ${currentStock} left`;

        const productDetails = `
            <b>Product Name:</b> ${product.name}<br>
            ${variantDetailHtml}
            <b>Category:</b> ${product.category || '-'}${product.subcategory ? ' › ' + product.subcategory : ''}<br>
            <b>SKU / ID:</b> ${product._id.toString().slice(-10).toUpperCase()}<br>
            <b>Price (INR):</b> ₹${product.price || 0}${product.priceUSD ? ` &nbsp;|&nbsp; <b>Price (USD):</b> $${product.priceUSD}` : ''}<br>
            <b>Current Stock:</b> <span style="color:${stockBadgeColor};font-weight:700;">${currentStock}</span><br>
            ${reason ? `<b>Adjustment Reason:</b> ${reason}<br>` : ''}
            ${product.label ? `<b>Label:</b> ${product.label}<br>` : ''}
            ${product.fabric && !variantInfo ? `<b>Fabric:</b> ${product.fabric}<br>` : ''}
            ${product.sizes && product.sizes.length && !variantInfo ? `<b>Sizes:</b> ${product.sizes.join(', ')}<br>` : ''}
            ${product.colors && product.colors.length && !variantInfo ? `<b>Colors:</b> ${product.colors.join(', ')}<br>` : ''}
        `;

        // Build a custom HTML email with the image and stock badge inline
        const year = new Date().getFullYear();
        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f1ec;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ec;padding:30px 10px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background-color:#1a1a1a;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:6px;color:#c9a96e;font-weight:400;">THAARAI</h1>
            <p style="margin:4px 0 0;font-size:9px;letter-spacing:4px;color:#999;text-transform:uppercase;">Luxury Ethnic Designers</p>
          </td>
        </tr>

        <!-- Gold divider -->
        <tr><td style="background:linear-gradient(90deg,#c9a96e,#e8d5a3,#c9a96e);height:3px;"></td></tr>

        <!-- Alert Badge -->
        <tr>
          <td style="padding:25px 40px 10px;text-align:center;">
            <span style="display:inline-block;background-color:${stockBadgeBg};color:${stockBadgeColor};border:1px solid ${stockBadgeColor};border-radius:4px;font-size:11px;font-weight:700;letter-spacing:2px;padding:6px 16px;text-transform:uppercase;">${stockBadgeText}</span>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td style="padding:10px 40px 10px;text-align:center;">
            <h2 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1a1a1a;font-weight:400;letter-spacing:1px;">${title}</h2>
          </td>
        </tr>

        <!-- Body Message -->
        <tr>
          <td style="padding:10px 40px 20px;color:#555;font-size:14px;line-height:1.8;text-align:center;">
            ${message}
          </td>
        </tr>

        <!-- Product Image -->
        ${imageHtml}

        <!-- Product Details Box -->
        <tr>
          <td style="padding:0 40px 30px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf8f4;border:1px solid #e8e2d6;border-radius:6px;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0 0 10px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c9a96e;font-weight:600;">Product Details</p>
                  <div style="font-size:13px;color:#444;line-height:1.9;">${productDetails}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #eee;margin:0;"></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:25px 40px;text-align:center;">
            <p style="margin:0 0 5px;font-size:11px;color:#999;">&copy; ${year} Thaarai Designers. All rights reserved.</p>
            <p style="margin:0;font-size:10px;color:#bbb;">This is an automated inventory alert. Please login to admin to manage stock.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

        const transporter = await getTransporter();
        if (!transporter) {
            console.warn('Stock alert skipped: could not create transporter.');
            return;
        }

        const fromName = settings.siteName || 'Thaarai Designers';
        const fromEmail = settings.smtpConfig.from || settings.smtpConfig.user;

        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: adminEmail,
            subject: `${fromName} - ${subject}`,
            html
        });

        console.log(`Stock alert email sent (${alertType}) for product: ${product.name} → ${adminEmail}`);
    } catch (error) {
        console.error('Stock alert email failed:', error.message);
    }
};

module.exports = { sendEmail, getTransporter, sendStockAlertEmail };


const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

const getTransporter = async () => {
    try {
        const settings = await Settings.findOne();
        if (!settings || !settings.smtpConfig || !settings.smtpConfig.host) {
            console.log('SMTP not configured.');
            return null;
        }

        const { host, port, user, pass } = settings.smtpConfig;

        return nodemailer.createTransport({
            host,
            port: Number(port),
            secure: Number(port) === 465,
            auth: { user, pass }
        });
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
        if (!settings || !settings.smtpConfig || !settings.smtpConfig.host) return;

        const transporter = await getTransporter();
        if (!transporter) return;

        const fromName = settings.siteName || 'Thaarai Designers';
        const fromEmail = settings.smtpConfig.from || settings.smtpConfig.user;

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject: `${fromName} - ${subject}`,
            html: getEmailTemplate(title, message, orderDetails)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId, 'to:', to);
        return info;
    } catch (error) {
        console.error('Email sending failed:', error.message);
    }
};

module.exports = { sendEmail };

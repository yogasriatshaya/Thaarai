const fs = require('fs');
let code = fs.readFileSync('backend/routes/settings.js', 'utf8');

const search = '        from: settings.smtpConfig.from || settings.smtpConfig.user,';

if (code.includes(search)) {
    code = code.substring(0, code.indexOf(search) + search.length);
    code += `
        to,
        subject: 'Test Email from Thaarai Designers',
        text: 'This is a test email from your Admin Configuration page.',
        html: '<b>This is a test email from your Admin Configuration page.</b>'
      });

      res.json({ success: true, message: 'Test email sent successfully', messageId: info.messageId });
    } catch (err) {
      res.status(500).json({ success: false, message: \`Email failed: ${err.message}\` });
    }
});

module.exports = router;`;
    fs.writeFileSync('backend/routes/settings.js', code);
    console.log('Fixed');
} else {
    console.log('Search string not found');
}

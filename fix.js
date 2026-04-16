const fs = require('fs');
let code = fs.readFileSync('backend/routes/settings.js', 'utf8');

const search = '        from: settings.smtpConfig.from || settings.smtpConfig.user,';

if (code.includes(search)) {
    code = code.substring(0, code.indexOf(search) + search.length);
    code += \n        to,\n        subject: 'Test Email from Thaarai Designers',\n        text: 'This is a test email from your Admin Configuration page.',\n        html: '<b>This is a test email from your Admin Configuration page.</b>'\n      });\n\n      res.json({ success: true, message: 'Test email sent successfully', messageId: info.messageId });\n    } catch (err) {\n      res.status(500).json({ success: false, message: \Email failed: \\ });\n    }\n});\n\nmodule.exports = router;;
    fs.writeFileSync('backend/routes/settings.js', code);
    console.log('Fixed');
} else {
    console.log('Search string not found');
}

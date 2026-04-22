const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Settings = require('./models/Settings');

dotenv.config();

async function checkSettings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const settings = await Settings.findOne();
        if (settings) {
            console.log("Current SMTP Config:");
            console.log("Host:", settings.smtpConfig.host);
            console.log("User:", settings.smtpConfig.user);
            console.log("Port:", settings.smtpConfig.port);
            console.log("Pass exists:", !!settings.smtpConfig.pass);
            console.log("Pass length:", settings.smtpConfig.pass.length);
        } else {
            console.log("No settings found.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSettings();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Settings = require('./models/Settings');

async function debugSettings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thaarai');
        const settings = await Settings.findOne();
        if (!settings) {
            console.log('No settings found in DB');
            return;
        }
        
        console.log('--- SMTP SETTINGS IN DB ---');
        console.log('Host:', settings.smtpConfig.host);
        console.log('Port:', settings.smtpConfig.port);
        console.log('User:', settings.smtpConfig.user);
        console.log('Pass Length:', settings.smtpConfig.pass?.length || 0);
        console.log('Pass Hint:', settings.smtpConfig.pass ? settings.smtpConfig.pass.substring(0, 3) + '...' : 'NONE');
        console.log('Secure:', settings.smtpConfig.secure);
        console.log('--- END ---');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

debugSettings();

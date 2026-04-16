const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Settings = require('./models/Settings');

async function forceUpdate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thaarai');
        const settings = await Settings.findOne();
        if (!settings) {
            console.log('No settings found');
            return;
        }
        
        settings.smtpConfig.user = 'selvasharma60@gmail.com';
        settings.smtpConfig.pass = 'zhlmoxeeoltzrlze';
        settings.smtpConfig.from = 'selvasharma60@gmail.com';
        settings.smtpConfig.host = 'smtp.gmail.com';
        settings.smtpConfig.port = 465;
        settings.smtpConfig.secure = true;
        
        settings.markModified('smtpConfig');
        await settings.save();
        
        console.log('SUCCESS: Settings forced in DB!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

forceUpdate();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend/.env'), override: true });

async function migrate() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/thaarai';
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const Settings = require('./backend/models/Settings');
        const settings = await Settings.findOne();
        
        if (settings) {
            console.log('Found settings, updating to SMTP Port 465 / Secure...');
            settings.smtpConfig.port = 465;
            settings.smtpConfig.secure = true;
            await settings.save();
            console.log('SMTP settings updated successfully.');
        } else {
            console.log('No settings document found to migrate.');
        }
        
    } catch (err) {
        console.error('Error during migration:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();

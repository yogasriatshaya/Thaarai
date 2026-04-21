const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const PendingUser = require('./models/PendingUser');

dotenv.config({ path: path.join(__dirname, '.env') });

async function getOTP() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const pendings = await PendingUser.find().sort({ createdAt: -1 }).limit(1);
        if (pendings.length === 0) {
            console.log("No pending users found.");
        } else {
            const p = pendings[0];
            console.log(`\n================================`);
            console.log(`OTP FOUND FOR: ${p.email}`);
            console.log(`YOUR CODE IS: ${p.otp}`);
            console.log(`EXPIRES AT: ${p.otpExpires}`);
            console.log(`================================\n`);
        }
        mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

getOTP();

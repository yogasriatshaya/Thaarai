const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: String,
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null }
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function resetAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const email = process.env.ADMIN_EMAIL || 'admin@thaarai.com';
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const result = await User.findOneAndUpdate(
            { email: email },
            { 
                password: hashedPassword, 
                role: 'admin', 
                failedLoginAttempts: 0, 
                lockedUntil: null 
            },
            { upsert: true, new: true }
        );
        
        console.log(`Successfully reset password for: ${email}`);
        console.log(`New Password: ${password}`);
        console.log("Account has been unlocked and failed attempts reset.");
        
        mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

resetAdmin();

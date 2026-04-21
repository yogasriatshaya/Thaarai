const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({
    name: String, 
    email: String, 
    role: { type: String, default: 'user' }, 
    isVerified: { type: Boolean, default: false }
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function listAndVerify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find();
        console.log("--- FOUND USERS ---");
        if (users.length === 0) {
            console.log("No users found in database.");
        } else {
            users.forEach(u => {
                console.log(`[${u.role.toUpperCase()}] ${u.name} (${u.email}) - Verified: ${u.isVerified}`);
            });
        }
        
        // Tip: To manually promote a user to admin or verify them, you can use:
        // await User.findOneAndUpdate({ email: 'user@example.com' }, { isVerified: true, role: 'admin' });
        
        mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

listAndVerify();

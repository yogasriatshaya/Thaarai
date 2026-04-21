require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const PendingUser = require('./models/PendingUser');

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = await User.find({}, 'name email role isVerified failedLoginAttempts lockedUntil');
    console.log('--- Verified Users in DB ---');
    users.forEach(user => {
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Verified: ${user.isVerified}`);
      console.log(`Failed Attempts: ${user.failedLoginAttempts}`);
      console.log(`Locked Until: ${user.lockedUntil}`);
      console.log('-------------------');
    });

    const pending = await PendingUser.find({}, 'name email otp otpExpires');
    console.log('\n--- Pending Users (Unverified) ---');
    pending.forEach(user => {
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`OTP: ${user.otp}`);
      console.log(`Expires: ${user.otpExpires}`);
      console.log('-------------------');
    });
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkUsers();

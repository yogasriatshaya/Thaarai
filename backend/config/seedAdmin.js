const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cube.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      wishlist: [],
      cartData: {}
    });

    await adminUser.save();

    console.log('✓ Admin user created successfully');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);

  } catch (error) {
    console.error('✗ Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;

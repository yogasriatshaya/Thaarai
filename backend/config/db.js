const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed admin user after successful connection
    const seedAdmin = require('./seedAdmin');
    await seedAdmin();

    // Seed storefront mock products into DB so admin can manage them
    // const seedProducts = require('./seedProducts');
    // await seedProducts();

  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const checkCoutureStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const coutureProducts = await Product.find({ category: { $regex: /^Couture$/i } });
    console.log(`Couture Products Found: ${coutureProducts.length}`);
    coutureProducts.forEach(p => {
      console.log(`- ${p.name} | Category: ${p.category} | Status: ${p.status} | Images: ${JSON.stringify(p.images)}`);
    });
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkCoutureStatus();

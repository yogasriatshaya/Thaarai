const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('./models/Product');

dotenv.config({ override: true });

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thaarai');
    const products = await Product.find({}).limit(5);
    console.log('--- Sample Products ---');
    products.forEach(p => {
      console.log(`Name: ${p.name}`);
      console.log(`Colors: ${JSON.stringify(p.colors)}`);
      console.log(`Sizes: ${JSON.stringify(p.sizes)}`);
      console.log('-------------------');
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkProducts();

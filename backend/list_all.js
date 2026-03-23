require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const listAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await Product.find({});
    console.log(`Total Products in DB: ${products.length}`);
    products.forEach((p, i) => {
      console.log(`${i+1}. ${p.name} | Cat: ${p.category}`);
    });
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

listAll();

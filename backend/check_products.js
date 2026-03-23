require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const checkProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Product.countDocuments();
    const categories = await Product.distinct('category');
    const recent = await Product.find().sort({ createdAt: -1 }).limit(5);

    console.log(`Total Products: ${count}`);
    console.log(`Categories: ${categories.join(', ')}`);
    console.log(`Recent Products:`, recent.map(p => ({ name: p.name, category: p.category, image: p.images[0] })));
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkProducts();

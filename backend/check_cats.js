const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config({ override: true });

async function checkCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thaarai');
    const categories = await Product.distinct('category');
    console.log('--- Current Categories in DB ---');
    console.log(categories);
    
    const sample = await Product.findOne({});
    if (sample) {
      console.log('Sample Product Name:', sample.name);
      console.log('Sample Product Category:', sample.category);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkCategories();

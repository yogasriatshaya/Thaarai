const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config({ override: true });

async function seedColors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thaarai');
    
    // Update sample products with colors
    await Product.updateOne({ name: /Nyrika/i }, { $set: { colors: ['Blue', 'Gold'] } });
    await Product.updateOne({ name: /Tamilnadu Maxi/i }, { $set: { colors: ['Black', 'Red'] } });
    await Product.updateOne({ name: /kurti/i }, { $set: { colors: ['White', 'Pink'] } });
    await Product.updateOne({ name: /Chettinadu Kurti/i }, { $set: { colors: ['Yellow', 'Green'] } });

    console.log('✓ Sample colors added to products');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

seedColors();

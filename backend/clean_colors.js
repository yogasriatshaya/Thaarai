const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config({ override: true });

async function cleanAndSeed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thaarai');
    
    // 1. Reset all colors to empty first to ensure a clean slate
    await Product.updateMany({}, { $set: { colors: [] } });
    console.log('✓ Reset all product colors');

    // 2. Assign colors to specific categories carefully
    // Update products in "Dresses" category
    await Product.updateMany(
      { category: /Dress/i }, 
      { $set: { colors: ['Pink', 'White'] } }
    );
    console.log('✓ Assigned Pink and White to Dresses');

    // Update products in "Kurti" category
    await Product.updateMany(
      { category: /Kurti/i }, 
      { $set: { colors: ['Gold', 'Red'] } }
    );
    console.log('✓ Assigned Gold and Red to Kurtis');

    // Update products in "Co-ords" or other categories
    await Product.updateMany(
      { category: /Co-ord/i }, 
      { $set: { colors: ['Blue', 'Black'] } }
    );
    console.log('✓ Assigned Blue and Black to Co-ords');

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

cleanAndSeed();

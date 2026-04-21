const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config({ override: true });

async function syncAllProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thaarai');
    
    const products = await Product.find({});
    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        const colors = Array.from(new Set(p.variants.map(v => v.color).filter(Boolean)));
        await Product.updateOne({ _id: p._id }, { $set: { colors } });
      }
    }
    
    console.log('✓ Successfully synced all existing color variants to the filters.');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

syncAllProducts();

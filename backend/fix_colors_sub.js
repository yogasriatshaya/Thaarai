const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config({ override: true });

async function fixColorsBySub() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thaarai');
    
    // Reset
    await Product.updateMany({}, { $set: { colors: [] } });

    // Target subcategories correctly
    await Product.updateMany({ subcategory: /kurti/i }, { $set: { colors: ['Gold', 'Red'] } });
    await Product.updateMany({ subcategory: /maxi/i }, { $set: { colors: ['Pink', 'White'] } });
    await Product.updateMany({ subcategory: /dress/i }, { $set: { colors: ['Pink', 'White'] } });
    await Product.updateMany({ subcategory: /co-ord/i }, { $set: { colors: ['Blue', 'Black'] } });

    // Fallback: If some products have no subcategory, give them a color so they show up
    await Product.updateMany({ colors: { $size: 0 } }, { $set: { colors: ['Yellow'] } });

    console.log('✓ Colors assigned by subcategory');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

fixColorsBySub();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config({ override: true });

async function clearAllColors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thaarai');
    
    // Completely wipe all color data so user has a clean slate
    await Product.updateMany({}, { $set: { colors: [] } });
    
    console.log('✓ Successfully wiped all color data. Your database is now clean.');
    console.log('Now, only colors you manually add in the Admin Panel will appear.');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

clearAllColors();

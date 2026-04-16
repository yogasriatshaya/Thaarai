const mongoose = require('mongoose');
const Product = require('./models/Product');
const StockLog = require('./models/StockLog');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const prod = await Product.findOne({ name: 'professsioal shoe' });
  if (prod) {
    const vIndex = prod.variants.findIndex(v => v.color === 'Red');
    if (vIndex !== -1) {
      prod.variants[vIndex].stock = 10;
      await prod.save();
      
      const log = await StockLog.findOne({ 
        productId: prod._id, 
        action: 'increment', 
        reason: { $regex: 'Return Received', $options: 'i' }
      }).sort({ createdAt: -1 });

      if (log) {
        log.previousStock = 9;
        log.currentStock = 10;
        await log.save();
        console.log("Fixed Log");
      }
    }
  }
  process.exit(0);
}
fix();

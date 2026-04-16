const mongoose = require('mongoose');
const Product = require('./backend/models/Product');
const StockLog = require('./backend/models/StockLog');
require('dotenv').config({ path: './backend/.env' });

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Find "professsioal shoe"
  const prod = await Product.findOne({ name: 'professsioal shoe' });
  if (!prod) {
    console.log("Not found"); 
    return process.exit(0);
  }

  // Look for the "Red" variant
  const vIndex = prod.variants.findIndex(v => v.color === 'Red');
  if (vIndex !== -1) {
    console.log(`Current DB stock for Red: ${prod.variants[vIndex].stock}`);
    
    // We know it actually incremented twice to 11. It's supposed to be 10.
    // The starting stock was 10, so after 1 sale it was 9. 
    // And after 1 return it should be 10.
    
    // Let's set it to 10.
    prod.variants[vIndex].stock = 10;
    await prod.save();
    
    // Now fix the StockLog "Prev: 10 +1 Curr: 11" to "Prev: 9 +1 Curr: 10"
    const log = await StockLog.findOne({ 
      productId: prod._id, 
      action: 'increment', 
      reason: { $regex: /Return/i }
    }).sort({ createdAt: -1 });

    if (log) {
      console.log(`Current Log: Prev ${log.previousStock}, Curr ${log.currentStock}`);
      log.previousStock = 9;
      log.currentStock = 10;
      await log.save();
      console.log("Fixed Log");
    }
  }

  console.log("Done");
  process.exit(0);
}

fix();

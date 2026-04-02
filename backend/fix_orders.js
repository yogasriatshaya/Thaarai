const mongoose = require('mongoose');
require('dotenv').config();

const Order = mongoose.model('Order', new mongoose.Schema({
  currency: String
}));

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/thaarai');
    
    // Fix "undefined" string
    const res1 = await Order.updateMany({ currency: "undefined" }, { currency: "INR" });
    console.log(`Updated ${res1.modifiedCount} orders (curreny "undefined" -> "INR")`);
    
    // Fix missing currency
    const res2 = await Order.updateMany({ currency: { $exists: false } }, { currency: "INR" });
    console.log(`Updated ${res2.modifiedCount} orders (missing currency -> "INR")`);

    // Fix null currency
    const res3 = await Order.updateMany({ currency: null }, { currency: "INR" });
    console.log(`Updated ${res3.modifiedCount} orders (null currency -> "INR")`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();

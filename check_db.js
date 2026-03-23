const mongoose = require('mongoose');
require('dotenv').config(); 

const check = async () => {
   try {
     await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/thaarai");
     const Order = mongoose.model('Order');
     const orders = await Order.find().sort({ createdAt: -1 }).limit(1);
     console.log("LAST ORDER DATA:", JSON.stringify(orders[0], null, 2));
     process.exit(0);
   } catch (err) { console.error(err); process.exit(1); }
};

check();

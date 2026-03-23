const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order'); 

const check = async () => {
   try {
     await mongoose.connect(process.env.MONGODB_URI);
     const orders = await Order.find().sort({ createdAt: -1 }).limit(1);
     console.log("LAST ORDER DATA:", JSON.stringify(orders[0], null, 2));
     process.exit(0);
   } catch (err) { console.error(err); process.exit(1); }
};

check();

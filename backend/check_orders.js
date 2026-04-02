const mongoose = require('mongoose');
require('dotenv').config();

const OrderSchema = new mongoose.Schema({
  currency: String,
  totalAmount: Number,
  paymentStatus: String
});
const Order = mongoose.model('Order', OrderSchema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/thaarai');
    const orders = await Order.find({});
    console.log('Orders found:', orders.length);
    orders.forEach(o => {
        console.log(`ID: ${o._id}, Currency: "${o.currency}", Amount: ${o.totalAmount}, Status: ${o.paymentStatus}, Items: ${o.items?.length}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();

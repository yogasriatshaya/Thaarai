require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const auditCouture = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const coutureProducts = await Product.find({ category: /Couture/i });
    console.log(`Couture (Case-Insensitive) Products Found: ${coutureProducts.length}`);
    coutureProducts.forEach(p => {
      console.log(`- ID: ${p._id} | Name: ${p.name} | Category: "${p.category}" | Status: ${p.status} | Images: ${JSON.stringify(p.images)}`);
    });

    const allCats = await Product.distinct('category');
    console.log(`All Categories in DB: ${JSON.stringify(allCats)}`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

auditCouture();

const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}), 'products');
  const Category = mongoose.model('Category', new mongoose.Schema({}), 'categories');

  const cats = await Category.find({}, { name: 1, subcategories: 1 }).lean();
  console.log('--- CATEGORIES ---');
  cats.forEach(c => console.log(`- ${c.name} (${c.subcategories.join(', ')})`));

  const prodsWithBadCat = await Product.find({
    $or: [
      { category: { $in: ['Kurti', 'Anarkali', 'Maxi', 'Co-ords'] } },
      { subcategory: { $exists: false } },
      { subcategory: '' }
    ]
  }).lean();

  console.log('--- PRODUCTS NEEDING MIGRATION ---');
  console.log('Count:', prodsWithBadCat.length);
  prodsWithBadCat.forEach(p => console.log(`[${p.name}] Cat:${p.category} | Sub:${p.subcategory}`));

  process.exit(0);
}
run();

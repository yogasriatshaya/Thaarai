const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');

  console.log('--- STARTING GLOBAL PRODUCT CATEGORY MIGRATION ---');

  const products = await Product.find({});
  let updatedCount = 0;

  for (const p of products) {
    const oldCat = (p.category || '').trim();
    const oldSub = (p.subcategory || '').trim();
    let newCat = oldCat;
    let newSub = oldSub;
    let changed = false;

    // 1. Move old top-level categories under 'Women' parent
    const mapping = {
      'Kurti': 'Kurtis',
      'Kurtis': 'Kurtis',
      'Kurta': 'Kurtis',
      'Anarkali': 'Anarkali',
      'Maxi': 'Maxi',
      'Co-ords': 'Co-ords',
      'Co-ord': 'Co-ords',
      'Co-ord Set': 'Co-ords',
      'Co-ord set': 'Co-ords',
      'Co-ord sets': 'Co-ords'
    };

    if (mapping[oldCat]) {
      newCat = 'Women';
      newSub = mapping[oldCat];
      changed = true;
    }

    // 2. If already 'Women', but subcategory is missing or misspelled
    if (oldCat === 'Women') {
      if (!oldSub || oldSub === '' || oldSub === 'Silk Cotton' || oldSub === 'Cotton') {
         // Try to guess from name
         if (p.name.toLowerCase().includes('kurti')) { newSub = 'Kurtis'; changed = true; }
         else if (p.name.toLowerCase().includes('anarkali')) { newSub = 'Anarkali'; changed = true; }
         else if (p.name.toLowerCase().includes('maxi')) { newSub = 'Maxi'; changed = true; }
         else if (p.name.toLowerCase().includes('co-ord')) { newSub = 'Co-ords'; changed = true; }
      }
    }
    
    // 3. Normalize subcategory names to match categories list
    if (newSub === 'Kurti') { newSub = 'Kurtis'; changed = true; }

    if (changed) {
      await Product.updateOne({ _id: p._id }, { $set: { category: newCat, subcategory: newSub } });
      console.log(`Updated: [${p.name}] -> ${newCat} > ${newSub}`);
      updatedCount++;
    }
  }

  console.log(`--- MIGRATION COMPLETE. Updated ${updatedCount} products. ---`);
  process.exit(0);
}
run();

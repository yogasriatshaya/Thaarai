const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Category = require('../models/Category');

dotenv.config({ path: path.join(__dirname, '../.env') });

const categories = [
  {
    name: 'Women',
    description: 'Womens Ethnic and Western Wear',
    subcategories: ['Kurti', 'Maxi', 'Co-ords', 'Anarkali', 'Sarees', 'Leggings', 'Bottoms']
  },
  {
    name: 'Men',
    description: 'Mens Casual and Formal Clothing',
    subcategories: ['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Ethnic Wear', 'Shorts']
  },
  {
    name: 'Kids',
    description: 'Clothing for Boys, Girls, and Infants',
    subcategories: ['Boys', 'Girls', 'Toddlers', 'Infants', 'Ethnic Kids']
  }
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/thaarai');
    console.log('Connected to MongoDB');

    for (const cat of categories) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        cat,
        { upsert: true, new: true }
      );
      console.log(`Seeded Category: ${cat.name}`);
    }

    console.log('Category seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding categories:', err);
    process.exit(1);
  }
};

seedCategories();

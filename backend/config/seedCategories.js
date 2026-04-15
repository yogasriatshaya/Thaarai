const Category = require('../models/Category');

const seedCategories = async () => {
  try {
    const defaultCategories = [
      {
        name: 'Women',
        description: 'Ethnic and Contemporary wear for women',
        subcategories: [
          { name: 'Kurti' },
          { name: 'Maxi' },
          { name: 'Co-ords' },
          { name: 'Anarkali' },
          { name: 'Sarees' },
          { name: 'Lehengas' }
        ]
      },
      {
        name: 'Men',
        description: 'Mens Casual and Formal Clothing',
        subcategories: [{ name: 'Shirts' }, { name: 'Trousers' }, { name: 'Suits' }]
      },
      {
        name: 'Kids',
        description: 'Clothing for children and infants',
        subcategories: [{ name: 'Boys' }, { name: 'Girls' }, { name: 'Infants' }]
      },
      {
        name: 'Shoes',
        description: 'Premium footwear collection',
        subcategories: [{ name: 'Ethnic Shoes' }]
      }
    ];

    for (const catData of defaultCategories) {
      const existing = await Category.findOne({ name: { $regex: new RegExp(`^${catData.name}$`, 'i') } });
      if (existing) {
        // Update existing category with correct description and subcategories if needed
        existing.description = catData.description || existing.description;
        
        // Merge subcategories (avoiding duplicates)
        const currentSubs = existing.subcategories.map(s => s.name.toLowerCase());
        for (const sub of catData.subcategories) {
          if (!currentSubs.includes(sub.name.toLowerCase())) {
            existing.subcategories.push(sub);
          }
        }
        await existing.save();
        console.log(`✓ Updated category: ${catData.name}`);
      } else {
        const newCat = new Category({
          ...catData,
          isActive: true
        });
        await newCat.save();
        console.log(`✓ Created category: ${catData.name}`);
      }
    }

    // CLEANUP: Remove old categories that are now subcategories
    const subNames = ['Kurti', 'Maxi', 'Co-ords', 'Anarkali'];
    await Category.deleteMany({ name: { $in: subNames } });
    console.log(`✓ Cleaned up legacy categories: ${subNames.join(', ')}`);

  } catch (error) {
    console.error('✗ Error seeding categories:', error.message);
  }
};

module.exports = seedCategories;

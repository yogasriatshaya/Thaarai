const path = require('path');
const { pathToFileURL } = require('url');
const Product = require('../models/Product');

const normalizeLabel = (label) => {
  if (!label) return '';
  const value = String(label).trim().toLowerCase();
  if (value === 'new') return 'New Arrival';
  if (value === 'hot') return 'Hot';
  if (value === 'trending') return 'Trending';
  if (value === 'sold out') return 'Sold Out';
  return '';
};

const seedProducts = async () => {
  try {
    const mockFilePath = path.join(__dirname, '../../frontend/src/data/mockProducts.js');
    const mockFileUrl = pathToFileURL(mockFilePath).href;
    const module = await import(mockFileUrl);
    const mockProducts = Array.isArray(module.MOCK_PRODUCTS) ? module.MOCK_PRODUCTS : [];

    if (mockProducts.length === 0) {
      console.log('No mock products found to seed');
      return;
    }

    let created = 0;

    for (const item of mockProducts) {
      const exists = await Product.findOne({ name: item.name });
      if (exists) continue;

      await Product.create({
        name: item.name,
        description: item.description || 'Premium product',
        category: item.category || 'Kurti',
        subcategory: item.subcategory || '',
        price: Number(item.price) || 0,
        originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        colors: Array.isArray(item.colors) ? item.colors : [],
        images: Array.isArray(item.images) ? item.images : [],
        stock: 50,
        bestseller: Boolean(item.bestseller || item.bestSeller),
        label: normalizeLabel(item.label),
        fabric: item.subcategory || '',
        style: item.category || '',
        availability: 'Available',
        material: item.subcategory || '',
        heritage: '',
        status: 'Publish',
      });

      created += 1;
    }

    if (created > 0) {
      console.log(`Seeded ${created} products from frontend mock data`);
    } else {
      console.log('Products already seeded');
    }
  } catch (error) {
    console.error('Error seeding products:', error.message);
  }
};

module.exports = seedProducts;

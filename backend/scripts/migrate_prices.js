const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Product = require('../models/Product');

// Current conversion rate: 1 USD ≈ 83.5 INR
// We'll use 83.0 for a slightly cleaner conversion or whatever standard is preferred.
const CONVERSION_RATE = 83.0;

const migratePrices = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully.');

        console.log('Finding products to migrate...');
        const products = await Product.find({ 
            $or: [
                { priceUSD: 0 }, 
                { priceUSD: { $exists: false } }
            ]
        });

        console.log(`Found ${products.length} products to update.`);

        let count = 0;
        for (const product of products) {
            // Convert Price
            if (product.price > 0) {
                // Round to 2 decimal places e.g., 1499 / 83 = 18.06
                product.priceUSD = parseFloat((product.price / CONVERSION_RATE).toFixed(2));
            }

            // Convert Original Price if exists
            if (product.originalPrice > 0) {
                product.originalPriceUSD = parseFloat((product.originalPrice / CONVERSION_RATE).toFixed(2));
            }

            // Convert Cost Price if exists
            if (product.costPrice > 0) {
                product.costPriceUSD = parseFloat((product.costPrice / CONVERSION_RATE).toFixed(2));
            }

            // Set available in US true for existing items
            product.availableInUS = true;

            await product.save();
            count++;
            if (count % 10 === 0) console.log(`Updated ${count} products...`);
        }

        console.log(`Successfully migrated ${count} products to USD prices.`);
        console.log('Migration Complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migratePrices();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Path relative to where this script IS: backend/scripts/cleanup_images.js
const BACKEND = path.join(__dirname, '..');
const ROOT = path.join(BACKEND, '..');
const FRONTEND = path.join(ROOT, 'frontend');

dotenv.config({ path: path.join(BACKEND, '.env'), override: true });

async function cleanup() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI not found in environment');

        await mongoose.connect(uri);
        console.log('Connected to DB');

        const Product = require(path.join(BACKEND, 'models', 'Product'));
        const Order = require(path.join(BACKEND, 'models', 'Order'));
        
        const products = await Product.find({}, { images: 1 });
        const orders = await Order.find({ returnRequested: true }, { returnImages: 1 });
        
        let dbImages = new Set();
        products.forEach(p => {
            if (p.images) {
                p.images.forEach(img => {
                    const basename = path.basename(img);
                    dbImages.add(basename);
                });
            }
        });

        orders.forEach(o => {
            if (o.returnImages) {
                o.returnImages.forEach(img => {
                    const basename = path.basename(img);
                    dbImages.add(basename);
                });
            }
        });

        console.log(`Found ${dbImages.size} unique image references in DB.`);

        const uploadsDir = path.join(BACKEND, 'uploads');
        const generatedDir = path.join(FRONTEND, 'public', 'generated');

        const processDir = (dir) => {
            if (!fs.existsSync(dir)) {
                console.log(`Directory ${dir} not found.`);
                return;
            }

            const files = fs.readdirSync(dir, { withFileTypes: true });
            files.forEach(file => {
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    return;
                }

                if (!dbImages.has(file.name)) {
                    console.log(`Deleting unused file: ${file.name}`);
                    fs.unlinkSync(fullPath);
                } else {
                    console.log(`Keeping: ${file.name}`);
                }
            });
        };

        console.log('\n--- Cleaning up backend/uploads ---');
        processDir(uploadsDir);

        console.log('\n--- Cleaning up frontend/public/generated ---');
        processDir(generatedDir);

    } catch (error) {
        console.error('Cleanup failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

cleanup();

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const coutureProducts = [
  {
    name: "Embroidered Silk Gown",
    description: "Exquisite hand-embroidered silk gown from our Couture collection.",
    category: "Couture",
    price: 12500,
    images: ["/uploads/couture/c1.webp"],
    stock: 5,
    label: "New Arrival",
    material: "Pure Silk",
    availability: "Available"
  },
  {
    name: "Velvet Nightgown",
    description: "Luxurious velvet nightgown designed for ultimate comfort and elegance.",
    category: "Couture",
    price: 8500,
    images: ["/uploads/couture/c2.webp"],
    stock: 10,
    label: "Trending",
    material: "Velvet",
    availability: "Available"
  },
  {
    name: "Golden Weave Sari",
    description: "A masterpiece of golden weave, perfect for royal occasions.",
    category: "Couture",
    price: 18000,
    images: ["/uploads/couture/c3.webp"],
    stock: 3,
    label: "Hot",
    material: "Silk Blend",
    availability: "Limited Stock"
  },
  {
    name: "Royal Blue Ensemble",
    description: "Deep royal blue ensemble with intricate silver detailing.",
    category: "Couture",
    price: 14000,
    images: ["/uploads/couture/c4.webp"],
    stock: 7,
    material: "Georgette",
    availability: "Available"
  }
];

const restoreCouture = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for restoration...");

    // Check if they already exist
    for (const p of coutureProducts) {
        const exists = await Product.findOne({ name: p.name });
        if (!exists) {
            await Product.create(p);
            console.log(`Created: ${p.name}`);
        } else {
            console.log(`Already exists: ${p.name}`);
        }
    }
    
    console.log("Couture restoration complete!");
    process.exit();
  } catch (error) {
    console.error("Error restoring Couture:", error);
    process.exit(1);
  }
};

restoreCouture();

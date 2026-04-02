const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin CRUD
// 1. Create category
router.post('/', adminMiddleware, async (req, res) => {
  const { name, subcategories, description, defaultFabrics, defaultStyles, availableSizes } = req.body;
  try {
    const newCat = await Category.create({ name, subcategories, description, defaultFabrics, defaultStyles, availableSizes });
    res.json({ success: true, category: newCat });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 2. Update category (and update products if name changed)
router.put('/:id', adminMiddleware, async (req, res) => {
  const { name, subcategories, description, isActive, defaultFabrics, defaultStyles, availableSizes } = req.body;
  try {
    const oldCat = await Category.findById(req.params.id);
    if (!oldCat) return res.status(404).json({ success: false, message: 'Category not found' });

    const oldName = oldCat.name;
    const update = { name, subcategories, description, isActive, defaultFabrics, defaultStyles, availableSizes };
    
    const updatedCat = await Category.findByIdAndUpdate(req.params.id, update, { new: true });

    // If name changed, update all products with this category
    if (name && name !== oldName) {
      await Product.updateMany({ category: oldName }, { $set: { category: name } });
    }

    res.json({ success: true, category: updatedCat });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 4. Rename subcategory globally
router.put('/:id/rename-subcategory', adminMiddleware, async (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ success: false, message: 'Old and new names are required' });

  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Update in Category model (handle object structure)
    const subIdx = category.subcategories.findIndex(s => 
      (typeof s === 'string' ? s.toLowerCase() : s.name.toLowerCase()) === oldName.toLowerCase()
    );
    
    if (subIdx !== -1) {
      if (typeof category.subcategories[subIdx] === 'string') {
        category.subcategories[subIdx] = newName;
      } else {
        category.subcategories[subIdx].name = newName;
      }
      category.markModified('subcategories');
      await category.save();
    }

    // Update in Product model
    const result1 = await Product.updateMany(
      { category: category.name, subcategory: oldName },
      { $set: { subcategory: newName } }
    );

    const result2 = await Product.updateMany(
      { category: { $regex: new RegExp(`^${oldName}$`, 'i') } },
      { $set: { category: category.name, subcategory: newName } }
    );

    res.json({ 
      success: true, 
      message: `Renamed "${oldName}" to "${newName}".`,
      details: `Updated ${result1.modifiedCount} products and migrated ${result2.modifiedCount} old products.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Delete category
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    
    // Check if products exist in this category before deleting (or just mark inactive)
    const prods = await Product.countDocuments({ category: cat.name });
    if (prods > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${prods} products exist in this category. Delete those or mark this category as inactive.` });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

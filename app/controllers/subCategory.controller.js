const SubCategory = require('../models/subCategory.model');
const Category = require('../models/category.model');


exports.createSubCategory = async (req, res) => {
    try {
        const { name, category } = req.body;

        const existingCategory = await Category.findById(category);        if (!existingCategory) {
            return res.status(400).json({ message: 'The specified category does not exist' });
        }

        const existingSubCategory = await SubCategory.findOne({ name, category });
        if (existingSubCategory) {
            return res.status(400).json({ message: 'This subcategory already exists in the specified category' });
        }

        const subCategory = new SubCategory({
            name,
            category,
        });

        await subCategory.save();        res.status(201).json({ message: 'Subcategory created successfully', subCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating the subcategory' });
    }
};

exports.getSubCategoriesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const subCategories = await SubCategory.find({ category: categoryId }).populate('category', 'name');        if (subCategories.length === 0) {
            return res.status(404).json({ message: 'No subcategories found for this category' });
        }

        res.status(200).json({ subCategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while retrieving subcategories' });
    }
};

exports.deleteSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const subCategory = await SubCategory.findById(id);        if (!subCategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }
        
        await SubCategory.findByIdAndDelete(id);
        
        res.status(200).json({ message: 'Subcategory deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while deleting the subcategory' });
    }
};

exports.updateSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category } = req.body;
          const existingCategory = await Category.findById(category);
        if (!existingCategory) {
            return res.status(400).json({ message: 'The specified category does not exist' });
        }
        
        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }
        
        const duplicateSubCategory = await SubCategory.findOne({ 
            name, 
            category,
            _id: { $ne: id } 
        });
          if (duplicateSubCategory) {
            return res.status(400).json({ message: 'A subcategory with this name already exists in this category' });
        }
        
        // Update subcategory
        const updatedSubCategory = await SubCategory.findByIdAndUpdate(
            id, 
            { name, category },
            { new: true }
        );
        
        res.status(200).json({ 
            message: 'Subcategory updated successfully', 
            subCategory: updatedSubCategory 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while updating the subcategory' });
    }
};



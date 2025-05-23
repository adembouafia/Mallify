const Category = require('../models/category.model'); 
const SubCategory = require('../models/subCategory.model');

//new category
exports.createCategory = async (req, res) => {
    try {
        const {categoryName} = req.body;

        const existingCategory = await Category.findOne({ categoryName });
        if (existingCategory) {
        return res.status(400).json({ message: 'Category already exists' });
        }

        const category = new Category(
            {categoryName}
        );

        await category.save();

        res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating category' });
    }
};


//delete category
exports.deleteCategory = async(req , res)=>{
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                status: "fail",
                message: "Category not found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Category deleted successfully"
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err.message
        });
    }
};

//get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while retrieving categories' });
    }
};


//get category by id
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while retrieving category' });
    }
};

//get categories with subcategories
exports.getCategoriesWithSubCategories = async (req, res) => {
    try {
        // First, get all categories
        const categories = await Category.find();
        
        // Create an array to hold our results
        const result = [];
        
        // For each category, find its subcategories
        for (const category of categories) {
            // Find subcategories for this category
            const subCategories = await SubCategory.find({ category: category._id });
            
            // Add this category with its subcategories to our result
            result.push({
                _id: category._id,
                categoryName: category.categoryName,
                subCategories: subCategories
            });
        }
        
        // Send the result
        return res.status(200).json({ categories: result });
    } catch (error) {
        console.error("Error in getCategoriesWithSubCategories:", error);
        return res.status(500).json({ 
            message: 'Error loading categories with subcategories', 
            error: error.message 
        });
    }
};
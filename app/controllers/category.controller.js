const Category = require('../models/category.model'); 

//new category
exports.createCategory = async (req, res) => {
    try {
        const {categoryName} = req.body;

        const existingCategory = await Category.findOne({ categoryName });
        if (existingCategory) {
        return res.status(400).json({ message: 'La catégorie existe déjà' });
        }

        const category = new Category(
            {categoryName}
        );

        await category.save();

        res.status(201).json({ message: 'Catégorie créée avec succès', category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de la catégorie' });
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
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des catégories' });
    }
};


//get category by id
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Catégorie non trouvée' });
        }
        res.status(200).json({ category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération de la catégorie' });
    }
};
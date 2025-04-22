const Category = require('../models/category.model'); 

//new category
exports.createCategory = async (req, res) => {
    try {
        const {name} = req.body;

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
        return res.status(400).json({ message: 'La catégorie existe déjà' });
        }

        const category = await Category.create({name});

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

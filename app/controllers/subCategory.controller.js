const SubCategory = require('../models/subCategory.model');
const Category = require('../models/category.model');


exports.createSubCategory = async (req, res) => {
    try {
        const { name, category } = req.body;

        const existingCategory = await Category.findById(category);
        if (!existingCategory) {
            return res.status(400).json({ message: 'La catégorie spécifiée n\'existe pas' });
        }

        const existingSubCategory = await SubCategory.findOne({ name, category });
        if (existingSubCategory) {
            return res.status(400).json({ message: 'Cette sous-catégorie existe déjà dans la catégorie spécifiée' });
        }

        const subCategory = new SubCategory({
            name,
            category,
        });

        await subCategory.save();

        res.status(201).json({ message: 'Sous-catégorie créée avec succès', subCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de la sous-catégorie' });
    }
};

exports.getSubCategoriesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const subCategories = await SubCategory.find({ category: categoryId }).populate('category', 'name');

        if (subCategories.length === 0) {
            return res.status(404).json({ message: 'Aucune sous-catégorie trouvée pour cette catégorie' });
        }

        res.status(200).json({ subCategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des sous-catégories' });
    }
};



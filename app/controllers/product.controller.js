const Product = require("../models/product.model");
const SubCategory = require("../models/subCategory.model");
const dotenv = require("dotenv");
dotenv.config();

// Create a new product
exports.createProduct = async (req, res) => {
    try {
        const {subCategory } = req.body;

        // Vérifier si la sous-catégorie existe
        const existingSubCategory = await SubCategory.findById(subCategory);
        if (!existingSubCategory) {
            return res.status(400).json({
                status: "fail",
                message: "La sous-catégorie spécifiée n'existe pas",
            });
        }

        // Créer un nouveau produit
        const product = await Product.create(req.body);

        res.status(201).json({
            status: "success",
            data: {
                product,
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err.message
        });
    }
}

// Get all products with populated subCategory
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('subCategory', 'name');  // Peupler la sous-catégorie

        res.status(200).json({
            status: "success",
            results: products.length,
            data: {
                products,
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err.message,
        });
    }
}

// Get product by ID with populated subCategory
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('subCategory', 'name');  // Peupler la sous-catégorie

        if (!product) {
            return res.status(404).json({
                status: "fail",
                message: "Product not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                product,
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err.message,
        });
    }
}

// Update product by ID
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!product) {
            return res.status(404).json({
                status: "fail",
                message: "Product not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                product,
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err.message,
        });
    }
}

// Delete product by ID
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                status: "fail",
                message: "Product not found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Product deleted successfully"
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err.message
        });
    }
};

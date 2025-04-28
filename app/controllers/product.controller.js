const Product = require("../models/product.model");
const SubCategory = require("../models/subCategory.model");
const dotenv = require("dotenv");
const multer = require("multer");
dotenv.config();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } 
}).fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'otherImages', maxCount: 12 }
]);

// Create a new product
exports.createProduct = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ 
                status: "fail",
                message: err.message || "Error uploading files" 
            });
        }

        try {
            const { subCategory } = req.body;

            const existingSubCategory = await SubCategory.findById(subCategory);
            if (!existingSubCategory) {
                return res.status(400).json({
                    status: "fail",
                    message: "La sous-catégorie spécifiée n'existe pas",
                });
            }

            const productData = {
                ...req.body,
                // shop: req.shop._id ? req.shop._id : null,
                mainImage: req.files['mainImage'] ? req.files['mainImage'][0].filename : null,
                otherImages: req.files['otherImages'] ? req.files['otherImages'].map(file => file.filename) : []
            };

            const product = await Product.create(productData);

            res.status(201).json({
                status: "success",
                data: {
                    product
                }
            });
        } catch (err) {
            res.status(400).json({
                status: "fail",
                message: err.message
            });
        }
    });
};

// Get all products with populated subCategory
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('subCategory', 'name');  // Populate subCategory

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
};

// Get product by ID with populated subCategory
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('subCategory', 'name');  // Populate subCategory

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
};

// Get products belonging to the current shop
exports.getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ shop: req.shop._id }).populate('subCategory', 'name');

        res.status(200).json({
            status: "success",
            results: products.length,
            data: {
                products
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err.message
        });
    }
};

// Update product by ID
exports.updateProduct = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ 
                status: "fail",
                message: err.message || "Error uploading files" 
            });
        }

        try {
            const { subCategory } = req.body;

            // Ensure subCategory exists
            const existingSubCategory = await SubCategory.findById(subCategory);
            if (!existingSubCategory) {
                return res.status(400).json({
                    status: "fail",
                    message: "La sous-catégorie spécifiée n'existe pas",
                });
            }

            // Prepare product data
            const updatedData = {
                ...req.body,
                mainImage: req.files['mainImage'] ? req.files['mainImage'][0].filename : req.body.currentMainImage,
                otherImages: req.files['otherImages'] ? req.files['otherImages'].map(file => file.filename) : req.body.currentOtherImages
            };

            const product = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true });

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
    });
};

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

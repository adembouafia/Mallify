const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true
    },

    productId: {
        type: String,
        required: true,
        unique: true
    },

    productPrice: {
        type: Number,
        required: true
    },

    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true
    },

    availability: {
        type: String,
        enum: ["In stock", "Out of stock"],
        required: true
    },

    stock: {
        type: Number,
        required: true
    },

    description: {
        type: String,
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        required: false  // Shop is not always required
    },
    mainImage: {
        type: String,
        required: false  // Optional, as not all products may have a main image
    },
    otherImages: {
        type: [String],  // Array of strings to store filenames of additional images
        default: []
    }

}, {
    timestamps: true  // Adds createdAt and updatedAt timestamps to the document
});

module.exports = mongoose.model("Product", productSchema);

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
}

}, {
timestamps: true
});

module.exports = mongoose.model("Product", productSchema);

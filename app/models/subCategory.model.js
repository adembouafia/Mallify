const mongoose = require('mongoose');
const Product = require('./product.model');

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    }
    }, {
    timestamps: true
});

subCategorySchema.pre('remove', async function(next) {
    try {
    await Product.deleteMany({ subCategory: this._id }); 
    next();
    } catch (error) {
    next(error);
    }
});


module.exports = mongoose.model('SubCategory', subCategorySchema);

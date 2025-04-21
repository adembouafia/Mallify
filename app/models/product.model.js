const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName :{
        type : String ,
        required : true
    },

    productId : {
        type : String ,
        required : true
    },

    productPrice : {
        type : Number ,
        required : true
    },

    productCategory : {
        type : String ,
        required : true
    },

    Availability: {
        type: String,
        enum: ["In stock", "Out of stock"],
        required: true
    },

    Stock : {
        type : Number ,
        required : true
    },

    description : {
        type : String,
        required : true
    }
})

module.exports = mongoose.model("Product", productSchema);
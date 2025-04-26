const Shop = require("../models/shop.model");
const dotenv = require("dotenv");
dotenv.config();

exports.getAllShops = async (req , res) =>{
    try{
        const shops = await Shop.find().populate("vendor"); 
        res.send(shops);
    }catch(err){
        res.status(500).send({ message: err.message || "Error fetching shops" })
    }
}


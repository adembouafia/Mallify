const Vendor = require("../models/vendor.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

//register 
exports.register = async (req , res) =>{
    try{

        const existingVendor = await Vendor.findOne({email:req.body.email});
        if (existingVendor){
            return res.status(400).json({message:"Email already exists"});
        }

        const vendor =  new Vendor ({
            vendorname:req.body.vendorname ,
            shopname:req.body.shopname ,
            email:req.body.email ,
            phone:req.body.phone ,
            shoplogo:req.body.shoplogo ,
            adresse:req.body.adresse ,
            shopdescription:req.body.shopdescription ,
            vendorpassword:req.body.vendorpassword
        })

        const savedVendor = await vendor.save();
        res.status(201).send({ message: "Vendor registered successfully", vendor : savedVendor });

    }catch (err) {
        res.status(500).send({ message: err.message || "Error registering Vendor" });
    }
};

//login
exports.login = async (req , res) =>{
    const {email , vendorpassword} = req.body ; 

    try{
        const vendor = await Vendor.findOne({email});
        if (!vendor){
            return res.status(400).json({message:"Email not found"});
        }

        const isMatch = await bcrypt.compare(vendorpassword , vendor.vendorpassword)
        if (!isMatch){
            return res.status(400).json({message:"Invalid password"});
        }

        const token = jwt.sign({
            id : vendor._id , email : vendor.email
        } , process.env.JWT_SECRET , {expiresIn : "1h"});

        res.send({
            message : 'login successfully',
            token ,
            vendor : {
                id : vendor._id ,
                vendorname : vendor.vendorname,
                shopname : vendor.shopname ,
                email : vendor.email ,
                phone : vendor.phone ,
                shoplogo : vendor.shoplogo ,
                adresse : vendor.adresse ,
                shopdescription : vendor.shopdescription ,
            }
        })
    }catch(err){
        res.status(500).send({message : err.message || "Error logging in" });
    }
}

//get all Vendors 
exports.getAll = async (req , res) =>{
    try{
        const vendor = await Vendors.find();
        res.send(vendor);
    }catch(err){
        res.status(500).send({message : err.message || "Error fetching vendors" });
    }
}
const Client = require("../models/client.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

//register 
exports.register = async (req , res) =>{
    try{
        const existingClient = await Client.findOne({email:req.body.email});
        if (existingClient){
            return res.status(400).json({message:"Email already exists"});
        }

        const client =  new Client ({
            firstname:req.body.firstname ,
            lastname:req.body.lastname ,
            email:req.body.email ,
            password:req.body.password 
        })

        const savedClient = await client.save();
        res.status(201).send({ message: "Client registered successfully", client: savedClient });

    }catch (err) {
        res.status(500).send({ message: err.message || "Error registering Client" });
    }
};

//login
exports.login = async (req , res) =>{
    const {email , password} = req.body ; 

    try{
        const client = await Client.findOne({email});
        if (!client){
            return res.status(400).json({message:"Email not found"});
        }

        const isMatch = await bcrypt.compare(password , client.password)
        if (!isMatch){
            return res.status(400).json({message:"Invalid password"});
        }

        const token = jwt.sign({
            id : client._id , email : client.email
        } , process.env.JWT_SECRET , {expireIn : "1h"});

        res.send({
            message : 'login successfully',
            token ,
            client : {
                id : client._id ,
                firstname : client.firstname,
                lastname : client.lastname ,
                email : client.email ,
            }
        })
    }catch(err){
        res.status(500).send({message : err.message || "Error logging in" });
    }
}
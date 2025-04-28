const Client = require("../models/client.model");
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Vendor = require("../models/vendor.model");
const crypto = require("crypto");
dotenv.config();

//register 
exports.register = async (req , res) =>{
    try{

        const existingClient = await Client.findOne({email:req.body.email});
        const existingVendor = await Vendor.findOne({email:req.body.email});
        if (existingClient || existingVendor){
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
        } , process.env.JWT_SECRET , {expiresIn : "1h"});

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


//reset password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const client = await Client.findOne({ email });
        if (!client) {
            return res.status(404).send({ message: "User not found" });
        }

      // Générer un code aléatoire
        const resetCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // Exemple : "A1B2C3"
        client.resetPasswordCode = resetCode;
        client.resetPasswordExpires = Date.now() + 3600000; // 1 heure

        await client.save();

      // Envoyer l'email avec le code
      // transporter nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });


        const mailOptions = {
            to: client.email,
            from: process.env.EMAIL_USER,
            subject: "Password Reset Code",
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
            Your reset code is: ${resetCode}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        };
    
        await transporter.sendMail(mailOptions);
        res.send({ message: "Reset code sent to your email." });
    } catch (err) {
        console.error("Error sending email:", err);
        res.status(500).send({ message: "Error sending reset code" });
    }
};


// Reset password function
exports.resetPassword = async (req, res) => {
  const { code, newPassword } = req.body;

  try {
    const client = await Client.findOne({
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }, // Vérifie que le code n'a pas expiré
    });

    if (!client) {
      return res.status(400).send({ message: "Invalid or expired reset code." });
    }

    // Mettre à jour le mot de passe
    client.password = newPassword;
    client.resetPasswordCode = undefined;
    client.resetPasswordExpires = undefined;

    await client.save();

    res.send({ message: "Password has been reset." });
  } catch (err) {
    res.status(500).send({ message: "Error resetting password" });
  }
};


//get all clients 
exports.getAll = async (req , res) =>{
    try{
        const client = await Client.find();
        res.send(client);
    }catch(err){
        res.status(500).send({message : err.message || "Error fetching clients" });
    }
}
exports.getById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).send({ message: "Client not found" });
        }
        
        // Check if the requesting user is the client or has admin privileges
        if (req.userId !== client._id.toString() && 
            !['admin', 'superAdmin', 'vendor', 'moderator'].includes(req.role)) {
            return res.status(403).send({ message: "Unauthorized" });
        }
        
        res.status(200).send(client);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};
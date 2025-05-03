const Vendor = require("../models/vendor.model");
const Shop = require("../models/shop.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Client = require("../models/client.model");
const multer = require("multer");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

dotenv.config();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage }).single("shopLogo"); 



// Register a new vendor
exports.register = (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(500).json({ message: "Error uploading file" });

        try {
            const existingVendor = await Vendor.findOne({ email: req.body.email });
            const existingClient = await Client.findOne({ email: req.body.email });
            if (existingVendor || existingClient) return res.status(400).json({ message: "Email already exists" });

            // Créer le Shop d'abord
            const newShop = new Shop({
                shopName: req.body.shopName,
                adresse: req.body.adresse,
                shopdescription: req.body.shopdescription,
                shopLogo: req.file ? req.file.filename : null
            });

            const savedShop = await newShop.save();

            // Créer le Vendor en liant au Shop
            const vendor = new Vendor({
                vendorName: req.body.vendorName,
                email: req.body.email,
                phone: req.body.phone,
                vendorPassword: req.body.vendorPassword,
                shop: savedShop._id
            });

            const savedVendor = await vendor.save();

            // 🔥 Maintenant on met à jour le Shop pour lui lier le Vendor
            savedShop.vendor = savedVendor._id;
            await savedShop.save();

            res.status(201).send({
                message: "Vendor & Shop registered successfully",
                vendor: savedVendor,
                shop: savedShop
            });

        } catch (err) {
            console.error(err);
            res.status(500).send({ message: err.message || "Server error" });
        }
    });
};



// Vendor login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            return res.status(400).json({ message: "Email not found" });
        }

        const isMatch = await bcrypt.compare(password, vendor.vendorPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Récupérer le shop associé au vendor pour vérifier son statut
        const shop = await Shop.findById(vendor.shop);
        
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        // Vérifier le statut du shop
        if (shop.status === "Pending") {
            return res.status(403).json({ 
                message: "Votre boutique est en cours d'étude par l'administration.",
                status: "Pending"
            });
        }

        if (shop.status === "Rejected") {
            return res.status(403).json({ 
                message: "Votre boutique a été rejetée.",
                reason: shop.rejectionReason,
                status: "Rejected"
            });
        }

        // Si le shop est approuvé, continuer avec la connexion normale
        const token = jwt.sign({
            id: vendor._id,
            email: vendor.email,
            role: vendor.role,
            shopId: vendor.shop
        }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.send({
            message: "Login successful",
            token,
            vendor: {
                id: vendor._id,
                vendorname: vendor.vendorName,
                email: vendor.email,
                phone: vendor.phone,
                shop: vendor.shop
            }
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error logging in" });
    }
};



// Get all vendors
exports.getAll = async (req, res) => {
    try {
        const vendors = await Vendor.find();
        res.send(vendors);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error fetching vendors" });
    }
};



//forgot password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            return res.status(404).send({ message: "Vendor not found" });
        }

        const resetCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // Ex: "A1B2C3"
        vendor.resetPasswordCode = resetCode;
        vendor.resetPasswordExpires = Date.now() + 3600000; // 1 heure

        await vendor.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            to: vendor.email,
            from: process.env.EMAIL_USER,
            subject: "Vendor Password Reset Code",
            text: `You have requested a password reset.\n\nYour reset code is: ${resetCode}\n\nIf you did not request this, please ignore this email.`,
        };

        await transporter.sendMail(mailOptions);
        res.send({ message: "Reset code sent to your email." });
    } catch (err) {
        console.error("Error sending reset code:", err);
        res.status(500).send({ message: "Error sending reset code" });
    }
};



// Reset Password 
exports.resetPassword = async (req, res) => {
    const { code, newPassword } = req.body;

    try {
        const vendor = await Vendor.findOne({
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!vendor) {
            return res.status(400).send({ message: "Invalid or expired reset code." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        vendor.vendorPassword = hashedPassword;
        vendor.resetPasswordCode = undefined;
        vendor.resetPasswordExpires = undefined;

        await vendor.save();
        res.send({ message: "Password has been reset successfully." });
    } catch (err) {
        res.status(500).send({ message: "Error resetting password" });
    }
};
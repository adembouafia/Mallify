const Vendor = require("../models/vendor.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const multer = require("multer");

dotenv.config();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");  // Specify upload directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);  // Set unique filename
    }
});

const upload = multer({ storage: storage }).single("shoplogo");  // Handle single file upload for 'shoplogo'

// Register a new vendor
exports.register = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ message: "Error uploading file" });
        }

        try {
            // Check if the email already exists in the database
            const existingVendor = await Vendor.findOne({ email: req.body.email });
            if (existingVendor) {
                return res.status(400).json({ message: "Email already exists" });
            }

            // Create a new vendor
            const vendor = new Vendor({
                vendorname: req.body.vendorname,
                shopname: req.body.shopname,
                email: req.body.email,
                phone: req.body.phone,
                shoplogo: req.file.path,  // Save the file path in the database
                adresse: req.body.adresse,
                shopdescription: req.body.shopdescription,
                vendorpassword: req.body.vendorpassword
            });

            // Save the vendor to the database
            const savedVendor = await vendor.save();

            // Send response
            res.status(201).send({ message: "Vendor registered successfully", vendor: savedVendor });
        } catch (err) {
            res.status(500).send({ message: err.message || "Error registering Vendor" });
        }
    });
};

// Vendor login
exports.login = async (req, res) => {
    const { email, vendorpassword } = req.body;

    try {
        // Find the vendor by email
        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            return res.status(400).json({ message: "Email not found" });
        }

        // Compare password with hashed password
        const isMatch = await bcrypt.compare(vendorpassword, vendor.vendorpassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate a JWT token for the vendor
        const token = jwt.sign({
            id: vendor._id,
            email: vendor.email
        }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Send response with token and vendor data
        res.send({
            message: "Login successful",
            token,
            vendor: {
                id: vendor._id,
                vendorname: vendor.vendorname,
                shopname: vendor.shopname,
                email: vendor.email,
                phone: vendor.phone,
                shoplogo: vendor.shoplogo,
                adresse: vendor.adresse,
                shopdescription: vendor.shopdescription
            }
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error logging in" });
    }
};

// Get all vendors
exports.getAll = async (req, res) => {
    try {
        const vendors = await Vendor.find();  // Fetch all vendors from the database
        res.send(vendors);  // Send the vendors list in the response
    } catch (err) {
        res.status(500).send({ message: err.message || "Error fetching vendors" });
    }
};

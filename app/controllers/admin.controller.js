const Admin = require("../models/admin.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
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
    },
});
const upload = multer({ storage: storage }).single("adminImage");



// Add new admin
exports.addAdmin = (req, res) => {
    upload(req, res, async (err) => {
    if (err) return res.status(500).send({ message: "Error uploading image." });

    const { firstname, lastname, email, password, role } = req.body;

    try {
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).send({ message: "Admin already exists with this email." });
        }

        const newAdmin = new Admin({
            firstname,
            lastname,
            email,
            password, 
            role: role || "admin",
            adminImage: req.file.path,
        });

        const savedAdmin = await newAdmin.save();
        res.status(201).send({ message: "Admin added successfully", admin: savedAdmin });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
};



// Login admin
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: "Email not found" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                role: admin.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );        res.send({
        message: "Login successful",
        token,
        admin: {
            id: admin._id,
            firstname: admin.firstname,
            lastname: admin.lastname,
            email: admin.email,
            role: admin.role,
            adminImage: admin.adminImage,
        },
    });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error logging in" });
    }
};



// Forgot Password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).send({ message: "Admin not found" });
        }
    
        const resetCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // Ex: "A1B2C3"
        admin.resetPasswordCode = resetCode;
        admin.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    
        await admin.save();
    
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    
        const mailOptions = {
            to: admin.email,
            from: process.env.EMAIL_USER,
            subject: "Admin Password Reset Code",
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
        const admin = await Admin.findOne({
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() },
        });
    
        if (!admin) {
            return res.status(400).send({ message: "Invalid or expired reset code." });
        }
    
        const hashedPassword = await bcrypt.hash(newPassword, 10);
    
        admin.Password = hashedPassword;
        admin.resetPasswordCode = undefined;
        admin.resetPasswordExpires = undefined;
    
        await admin.save();
        res.send({ message: "Password has been reset successfully." });
    } catch (err) {
        res.status(500).send({ message: "Error resetting password" });
    }
};



//get all admins
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find();
        res.status(200).send({ message: "Admins retrieved successfully", admins });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};


//delete admin
exports.deleteAdmin = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedAdmin = await Admin.findByIdAndDelete(id);
        if (!deletedAdmin) {
            return res.status(404).send({ message: "Admin not found" });
        }
        res.status(200).send({ message: "Admin deleted successfully", admin: deletedAdmin });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};


//update admin
exports.updateAdmin = async (req, res) => {
    const { id } = req.params;
    const { firstname, lastname, email, password, role } = req.body;

    try {
        const updateData = {
            firstname,
            lastname,
            email,
            password,
            role,
        };

        if (req.file) {
            updateData.adminImage = `uploads/${req.file.filename}`;
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedAdmin) {
            return res.status(404).send({ message: "Admin not found" });
        }

        res.status(200).send({ message: "Admin updated successfully", admin: updatedAdmin });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

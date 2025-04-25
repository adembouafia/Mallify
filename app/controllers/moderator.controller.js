const Moderator = require("../models/moderator.model");
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
        cb(null, "uploads/");  // Specify upload directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);  // Set unique filename
    }
});

const upload = multer({ storage: storage }).single("moderatorImage"); 

//add a new moderator
exports.addModerator = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(500).send({ message: "Error uploading image." });
        }
        try{
            const moderator = new Moderator({
                moderatorName: req.body.moderatorName,
                email: req.body.email,
                moderatorPassword: req.body.moderatorPassword,
                moderatorImage: req.file.path
            });

            const savedModerator = moderator.save();
            res.status(201).send({ message: "Moderator added successfully", moderator: savedModerator });
            
        }catch(err){
            return res.status(500).send({ message: err.message });
        }
    })
}


//login a moderator
exports.login = async (req, res) => {
    const { email, moderatorPassword } = req.body;

    try {
        // Find the moderator by email
        const moderator = await Moderator.findOne({ email });
        if (!moderator) {
            return res.status(400).json({ message: "Email not found" });
        }

        // Compare password with hashed password
        const isMatch = await bcrypt.compare(moderatorPassword, moderator.moderatorPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate a JWT token for the moderator
        const token = jwt.sign({
            id: moderator._id,
            email: moderator.email
        }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Send response with token and moderator data
        res.send({
            message: "Login successful",
            token,
            moderator: {
                id: moderator._id,
                moderatorName: moderator.moderatorName,
                email: moderator.email
            }
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error logging in" });
    }
};

//get all moderators
exports.getAll = async (req, res) => {
    try {
        const moderators = await Moderator.find();
        res.status(200).send({ moderators });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error fetching moderators" });
    }
};


//forgot password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const moderator = await Moderator.findOne({ email });
        if (!moderator) {
            return res.status(404).send({ message: "Moderator not found" });
        }

        const resetCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // Ex: "A1B2C3"
        moderator.resetPasswordCode = resetCode;
        moderator.resetPasswordExpires = Date.now() + 3600000; // 1 heure

        await moderator.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            to: moderator.email,
            from: process.env.EMAIL_USER,
            subject: "Moderator Password Reset Code",
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
        const moderator = await Moderator.findOne({
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!moderator) {
            return res.status(400).send({ message: "Invalid or expired reset code." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        moderator.moderatorPassword = hashedPassword;
        moderator.resetPasswordCode = undefined;
        moderator.resetPasswordExpires = undefined;

        await moderator.save();
        res.send({ message: "Password has been reset successfully." });
    } catch (err) {
        res.status(500).send({ message: "Error resetting password" });
    }
};

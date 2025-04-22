const Moderator = require("../models/moderator.model");
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
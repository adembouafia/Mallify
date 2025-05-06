const Client = require("../models/client.model");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Vendor = require("../models/vendor.model");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
dotenv.config();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `profile-${Date.now()}-${baseName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

exports.uploadProfilePicture = (req, res) => {
  upload.single("profilePicture")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed" });
    }

    const clientId = req.params.id;

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Supprimer ancienne image si existante
      if (client.profilePicture) {
        const oldPath = path.join("uploads", client.profilePicture);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      client.profilePicture = req.file.filename;
      const updatedClient = await client.save();

      res.status(200).json({
        message: "Profile picture updated successfully",
        client: {
          id: updatedClient._id,
          firstname: updatedClient.firstname,
          lastname: updatedClient.lastname,
          email: updatedClient.email,
          profilePicture: updatedClient.profilePicture,
        },
      });
    } catch (err) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });
};

//register
exports.register = async (req, res) => {
  try {
    const existingClient = await Client.findOne({ email: req.body.email });
    const existingVendor = await Vendor.findOne({ email: req.body.email });
    if (existingClient || existingVendor) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const client = new Client({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: req.body.password,
    });

    const savedClient = await client.save();
    res
      .status(201)
      .send({ message: "Client registered successfully", client: savedClient });
  } catch (err) {
    res
      .status(500)
      .send({ message: err.message || "Error registering Client" });
  }
};

//login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const client = await Client.findOne({ email });
    if (!client) {
      return res.status(400).json({ message: "Email not found" });
    }

    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: client._id,
        email: client.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.send({
      message: "login successfully",
      token,
      client: {
        id: client._id,
        firstname: client.firstname,
        lastname: client.lastname,
        email: client.email,
        dateOfBirth: client.dateOfBirth,
        phoneNumber: client.phoneNumber,
        gender: client.gender,
        role: client.role,
      },
    });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error logging in" });
  }
};
exports.update = async (req, res) => {
  const clientId = req.params.id;
  const {
    firstname,
    lastname,
    email,
    dateOfBirth,
    phoneNumber,
    gender,
    profilePicture,
  } = req.body;

  try {
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).send({ message: "Client not found" });
    }

    // Check if email is changing, and ensure uniqueness
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({ email });
      const existingVendor = await Vendor.findOne({ email });

      if (existingClient || existingVendor) {
        return res.status(400).send({ message: "Email already exists" });
      }

      client.email = email;
    }

    if (firstname) client.firstname = firstname;
    if (lastname) client.lastname = lastname;
    if (dateOfBirth) client.dateOfBirth = dateOfBirth;
    if (phoneNumber) client.phoneNumber = phoneNumber;
    if (gender) client.gender = gender;
    if (profilePicture) client.profilePicture = profilePicture;

    const updatedClient = await client.save();
    res
      .status(200)
      .send({ message: "Client updated successfully", client: updatedClient });
  } catch (err) {
    res
      .status(500)
      .send({ message: err.message || "Error updating client information" });
  }
};

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
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!client) {
      return res
        .status(400)
        .send({ message: "Invalid or expired reset code." });
    }

    // Mettre à jour le mot de passe
    client.password = newPassword;
    client.resetPasswordCode = undefined;
    client.resetPasswordExpires = undefined;

    await client.save();

    res.send({ message: "Password has been reset." });
  } catch (err) {
    res.status(500).send({ message: "Error resetting password" });
  }
};

//get all clients
exports.getAll = async (req, res) => {
  try {
    const client = await Client.find();
    res.send(client);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error fetching clients" });
  }
};
exports.getById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).send({ message: "Client not found" });
    }

    res.status(200).send(client);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// change password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const clientId = req.params.id;

  console.log(req.body);

  try {
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).send({ message: "Client not found" });
    }
    console.log(client);
    if (!currentPassword || !client.password) {
      return res
        .status(400)
        .send({ message: "Old password or client password is missing" });
    }

    const isMatch = await bcrypt.compare(currentPassword, client.password);

    if (!isMatch) {
      return res.status(400).send({ message: "Invalid old password" });
    }
    client.password = newPassword;
    await client.save();
    res.status(200).send({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error changing password" });
  }
};

exports.getProfilePicture = async (req, res) => {
  try {
    const clientId = req.params.id;

    // Find the client
    const client = await Client.findById(clientId).select(
      "profilePicture firstname lastname"
    );

    if (!client) {
      return res.status(404).json({
        status: "fail",
        message: "Client not found",
      });
    }

    // Return the profile picture information
    res.status(200).json({
      status: "success",
      data: {
        profilePicture: client.profilePicture,
        firstname: client.firstname,
        lastname: client.lastname,
      },
    });
  } catch (err) {
    console.error("Error fetching profile picture:", err);
    res.status(500).json({
      status: "fail",
      message: "Error fetching profile picture",
    });
  }
};

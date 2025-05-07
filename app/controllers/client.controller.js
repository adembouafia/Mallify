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
        shippingInfo: client.shippingInfo,
        savedAddresses: client.savedAddresses
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
    shippingInfo
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
    
    // Update shipping info if provided
    if (shippingInfo) {
      client.shippingInfo = {
        ...client.shippingInfo || {},
        ...shippingInfo
      };
    }

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

// New methods for managing shipping addresses

// Add a new shipping address
exports.addShippingAddress = async (req, res) => {
  try {
    const clientId = req.params.id;
    const { name, address, city, governorate, postCode, phone, isDefault } = req.body;

    // Validate required fields
    if (!address || !city || !governorate || !postCode || !phone) {
      return res.status(400).json({
        message: "All address fields are required"
      });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        message: "Client not found"
      });
    }

    // Create new address object
    const newAddress = {
      name: name || "Home",
      address,
      city,
      governorate,
      postCode,
      phone,
      isDefault: isDefault || false
    };

    // If this is the first address or marked as default, update all others to non-default
    if (isDefault || client.savedAddresses.length === 0) {
      if (client.savedAddresses && client.savedAddresses.length > 0) {
        client.savedAddresses.forEach(addr => {
          addr.isDefault = false;
        });
      }
      newAddress.isDefault = true;
    }

    // Add the new address
    if (!client.savedAddresses) {
      client.savedAddresses = [];
    }
    client.savedAddresses.push(newAddress);

    // If this is the first address or it's default, also update the main shipping info
    if (newAddress.isDefault) {
      client.shippingInfo = {
        address: newAddress.address,
        city: newAddress.city,
        governorate: newAddress.governorate,
        postCode: newAddress.postCode,
        phone: newAddress.phone
      };
    }

    await client.save();

    res.status(201).json({
      message: "Shipping address added successfully",
      address: newAddress,
      savedAddresses: client.savedAddresses
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Error adding shipping address"
    });
  }
};

// Get all shipping addresses for a client
exports.getShippingAddresses = async (req, res) => {
  try {
    const clientId = req.params.id;
    
    const client = await Client.findById(clientId).select('savedAddresses shippingInfo');
    if (!client) {
      return res.status(404).json({
        message: "Client not found"
      });
    }

    res.status(200).json({
      message: "Shipping addresses retrieved successfully",
      addresses: client.savedAddresses || [],
      defaultShippingInfo: client.shippingInfo || {}
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Error retrieving shipping addresses"
    });
  }
};

// Update a shipping address
exports.updateShippingAddress = async (req, res) => {
  try {
    const clientId = req.params.id;
    const addressId = req.params.addressId;
    const { name, address, city, governorate, postCode, phone, isDefault } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        message: "Client not found"
      });
    }

    // Find the address to update
    const addressIndex = client.savedAddresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        message: "Address not found"
      });
    }

    // Update the address fields
    if (name) client.savedAddresses[addressIndex].name = name;
    if (address) client.savedAddresses[addressIndex].address = address;
    if (city) client.savedAddresses[addressIndex].city = city;
    if (governorate) client.savedAddresses[addressIndex].governorate = governorate;
    if (postCode) client.savedAddresses[addressIndex].postCode = postCode;
    if (phone) client.savedAddresses[addressIndex].phone = phone;
    
    // Handle default status
    if (isDefault === true) {
      // Set all addresses to non-default
      client.savedAddresses.forEach(addr => {
        addr.isDefault = false;
      });
      
      // Set this address as default
      client.savedAddresses[addressIndex].isDefault = true;
      
      // Update the main shipping info
      client.shippingInfo = {
        address: client.savedAddresses[addressIndex].address,
        city: client.savedAddresses[addressIndex].city,
        governorate: client.savedAddresses[addressIndex].governorate,
        postCode: client.savedAddresses[addressIndex].postCode,
        phone: client.savedAddresses[addressIndex].phone
      };
    }

    await client.save();

    res.status(200).json({
      message: "Shipping address updated successfully",
      address: client.savedAddresses[addressIndex],
      savedAddresses: client.savedAddresses
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Error updating shipping address"
    });
  }
};

// Delete a shipping address
exports.deleteShippingAddress = async (req, res) => {
  try {
    const clientId = req.params.id;
    const addressId = req.params.addressId;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        message: "Client not found"
      });
    }

    // Find the address to delete
    const addressIndex = client.savedAddresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        message: "Address not found"
      });
    }

    // Check if this is the default address
    const isDefault = client.savedAddresses[addressIndex].isDefault;

    // Remove the address
    client.savedAddresses.splice(addressIndex, 1);

    // If we deleted the default address and there are other addresses, make another one default
    if (isDefault && client.savedAddresses.length > 0) {
      client.savedAddresses[0].isDefault = true;
      
      // Update the main shipping info
      client.shippingInfo = {
        address: client.savedAddresses[0].address,
        city: client.savedAddresses[0].city,
        governorate: client.savedAddresses[0].governorate,
        postCode: client.savedAddresses[0].postCode,
        phone: client.savedAddresses[0].phone
      };
    } else if (client.savedAddresses.length === 0) {
      // If no addresses left, clear shipping info
      client.shippingInfo = {};
    }

    await client.save();

    res.status(200).json({
      message: "Shipping address deleted successfully",
      savedAddresses: client.savedAddresses
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Error deleting shipping address"
    });
  }
};

// Set a shipping address as default
exports.setDefaultShippingAddress = async (req, res) => {
  try {
    const clientId = req.params.id;
    const addressId = req.params.addressId;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        message: "Client not found"
      });
    }

    // Find the address to set as default
    const addressIndex = client.savedAddresses.findIndex(
      addr => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        message: "Address not found"
      });
    }

    // Set all addresses to non-default
    client.savedAddresses.forEach(addr => {
      addr.isDefault = false;
    });
    
    // Set this address as default
    client.savedAddresses[addressIndex].isDefault = true;
    
    // Update the main shipping info
    client.shippingInfo = {
      address: client.savedAddresses[addressIndex].address,
      city: client.savedAddresses[addressIndex].city,
      governorate: client.savedAddresses[addressIndex].governorate,
      postCode: client.savedAddresses[addressIndex].postCode,
      phone: client.savedAddresses[addressIndex].phone
    };

    await client.save();

    res.status(200).json({
      message: "Default shipping address updated successfully",
      address: client.savedAddresses[addressIndex],
      savedAddresses: client.savedAddresses
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Error setting default shipping address"
    });
  }
};
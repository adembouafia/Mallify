const Vendor = require("../models/vendor.model")
const Shop = require("../models/shop.model")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const Client = require("../models/client.model")
const multer = require("multer")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
const Notification = require("../models/notification.model")

dotenv.config()

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({ storage: storage }).fields([
  { name: "shopLogo", maxCount: 1 },
  { name: "vendorImage", maxCount: 1 },
])

// Register a new vendor
exports.register = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ message: "Error uploading file" })

    try {
      const existingVendor = await Vendor.findOne({ email: req.body.email })
      const existingClient = await Client.findOne({ email: req.body.email })
      if (existingVendor || existingClient) return res.status(400).json({ message: "Email already exists" })

      // Create the Shop first
      const newShop = new Shop({
        shopName: req.body.shopName,
        adresse: req.body.adresse,
        shopdescription: req.body.shopdescription,
        shop_phone: req.body.shop_phone,
        shopLogo: req.files && req.files.shopLogo ? req.files.shopLogo[0].filename : null,
      })

      const savedShop = await newShop.save()

      // Create the Vendor linked to the Shop
      const vendor = new Vendor({
        vendorName: req.body.vendorName,
        email: req.body.email,
        phone: req.body.phone,
        vendorPassword: req.body.vendorPassword,
        vendorImage: req.files && req.files.vendorImage ? req.files.vendorImage[0].filename : null,
        shop: savedShop._id,
      })

      const savedVendor = await vendor.save()

      // 🔥 Now update the Shop to link it to the Vendor
      savedShop.vendor = savedVendor._id
      await savedShop.save()

      const notificationMessae = `New shop Created: ${savedShop.shopName} by ${savedVendor.vendorName} waiting for admin approval`
      await Notification.create({
        shopId: savedShop._id,
        message: notificationMessae,
        status: "unread",
        type: "admin",
      })

      res.status(201).send({
        message: "Vendor & Shop registered successfully",
        vendor: savedVendor,
        shop: savedShop,
      })
    } catch (err) {
      console.error(err)
      res.status(500).send({ message: err.message || "Server error" })
    }
  })
}

// Vendor login
exports.login = async (req, res) => {
  const { email, password } = req.body

  try {
    const vendor = await Vendor.findOne({ email })
    if (!vendor) {
      return res.status(400).json({ message: "Email not found" })
    }

    const isMatch = await bcrypt.compare(password, vendor.vendorPassword)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" })
    }

    // Get the shop associated with the vendor to check its status
    const shop = await Shop.findById(vendor.shop)

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" })
    }

    // Check shop status
    if (shop.status === "Pending") {
      return res.status(403).json({
        message: "Your shop is being reviewed by the administration.",
        status: "Pending",
      })
    }

    if (shop.status === "Rejected") {
      return res.status(403).json({
        message: "Your shop has been rejected.",
        reason: shop.rejectionReason,
        status: "Rejected",
      })
    }

    if (shop.status === "Banned") {
      return res.status(403).json({
        message: "Your shop has been banned.",
        reason: shop.bannedReason,
        status: "Banned",
      })
    }

    // If the shop is approved, continue with normal login
    const token = jwt.sign(
      {
        id: vendor._id,
        email: vendor.email,
        role: vendor.role,
        shopId: vendor.shop,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    )

    res.send({
      message: "Login successful",
      token,
      vendor: {
        id: vendor._id,
        vendorname: vendor.vendorName,
        email: vendor.email,
        phone: vendor.phone,
        shop: vendor.shop,
      },
    })
  } catch (err) {
    res.status(500).send({ message: err.message || "Error logging in" })
  }
}

// Get all vendors
exports.getAll = async (req, res) => {
  try {
    const vendors = await Vendor.find()
    res.send(vendors)
  } catch (err) {
    res.status(500).send({ message: err.message || "Error fetching vendors" })
  }
}

//forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body

  try {
    const vendor = await Vendor.findOne({ email })
    if (!vendor) {
      return res.status(404).send({ message: "Vendor not found" })
    }

    const resetCode = crypto.randomBytes(3).toString("hex").toUpperCase() // Ex: "A1B2C3"
    vendor.resetPasswordCode = resetCode
    vendor.resetPasswordExpires = Date.now() + 3600000 // 1 hour

    await vendor.save()

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      to: vendor.email,
      from: process.env.EMAIL_USER,
      subject: "Vendor Password Reset Code",
      text: `You have requested a password reset.\n\nYour reset code is: ${resetCode}\n\nIf you did not request this, please ignore this email.`,
    }

    await transporter.sendMail(mailOptions)
    res.send({ message: "Reset code sent to your email." })
  } catch (err) {
    console.error("Error sending reset code:", err)
    res.status(500).send({ message: "Error sending reset code" })
  }
}

// Reset Password
exports.resetPassword = async (req, res) => {
  const { code, newPassword } = req.body

  try {
    const vendor = await Vendor.findOne({
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!vendor) {
      return res.status(400).send({ message: "Invalid or expired reset code." })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    vendor.vendorPassword = hashedPassword
    vendor.resetPasswordCode = undefined
    vendor.resetPasswordExpires = undefined

    await vendor.save()
    res.send({ message: "Password has been reset successfully." })
  } catch (err) {
    res.status(500).send({ message: "Error resetting password" })
  }
}

// Get vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
    if (!vendor) {
      return res.status(404).send({ message: "Vendor not found" })
    }
    res.status(200).send({ vendor })
  } catch (err) {
    res.status(500).send({ message: err.message || "Error fetching vendor" })
  }
}

// Update vendor
exports.updateVendor = async (req, res) => {
  const uploadForUpdate = multer({ storage: storage }).fields([{ name: "vendorImage", maxCount: 1 }])

  uploadForUpdate(req, res, async (err) => {
    if (err) return res.status(500).json({ message: "Error uploading file" })

    try {
      // Check if the vendor exists
      const vendor = await Vendor.findById(req.params.id)
      if (!vendor) {
        return res.status(404).send({ message: "Vendor not found" })
      }

      const { vendorName, email, phone, vendorPassword } = req.body

      // Prepare the data to update
      const updateData = {
        vendorName: vendorName || vendor.vendorName,
        email: email || vendor.email,
        phone: phone || vendor.phone,
      }

      // If a new vendor image is uploaded, update it
      if (req.files && req.files.vendorImage) {
        updateData.vendorImage = req.files.vendorImage[0].filename
      }

      // If a new password is provided, hash it
      if (vendorPassword) {
        const hashedPassword = await bcrypt.hash(vendorPassword, 10)
        updateData.vendorPassword = hashedPassword
      }

      // Update the vendor
      const updatedVendor = await Vendor.findByIdAndUpdate(req.params.id, updateData, { new: true })

      // If the phone number has been updated, also update the shop
      if (phone && phone !== vendor.phone) {
        await Shop.findByIdAndUpdate(vendor.shop, { phone: phone }, { new: true })
      }

      res.status(200).send({
        message: "Vendor updated successfully",
        vendor: updatedVendor,
      })
    } catch (err) {
      res.status(500).send({ message: err.message || "Error updating vendor" })
    }
  })
}

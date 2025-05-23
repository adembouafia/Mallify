const Moderator = require("../models/moderator.model")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const multer = require("multer")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
dotenv.config()

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/") // Specify upload directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname) // Set unique filename
  },
})

const upload = multer({ storage: storage }).single("moderatorImage")

// Add a new moderator
exports.addModerator = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).send({ message: "Error uploading image." })
    }

    try {
      const shopId = req.user.shopId

      if (!shopId) {
        return res.status(400).send({ message: "Vendor is not associated with a shop" })
      }

      const moderator = new Moderator({
        moderatorName: req.body.moderatorName,
        email: req.body.email,
        moderatorPassword: req.body.moderatorPassword,
        moderatorImage: req.file ? req.file.filename : null,
        shop: shopId,
      })

      const savedModerator = await moderator.save()
      res.status(201).send({
        message: "Moderator added successfully",
        moderator: savedModerator,
      })
    } catch (err) {
      return res.status(500).send({ message: err.message })
    }
  })
}

// Login a moderator
exports.login = async (req, res) => {
  const { email, password } = req.body

  try {
    const moderator = await Moderator.findOne({ email }).populate("shop")
    if (!moderator) {
      return res.status(400).json({ message: "Email not found" })
    }

    const isMatch = await bcrypt.compare(password, moderator.moderatorPassword)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" })
    }

    const token = jwt.sign(
      {
        id: moderator._id,
        email: moderator.email,
        role: moderator.role,
        shopId: moderator.shop?._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    )

    // Send response with token and moderator data
    res.send({
      message: "Login successful",
      token,
      moderator: {
        id: moderator._id,
        moderatorName: moderator.moderatorName,
        email: moderator.email,
        shop: moderator.shop,
      },
    })
  } catch (err) {
    res.status(500).send({ message: err.message || "Error logging in" })
  }
}

// Get all moderators for the vendor's shop
exports.getModeratorByShop = async (req, res) => {
  try {
    const shopId = req.user.shopId

    if (!shopId) {
      return res.status(400).send({ message: "Vendor is not associated with a shop" })
    }
    const moderators = await Moderator.find({ shop: shopId }).populate("shop")
    res.status(200).send({ moderators })
  } catch (err) {
    res.status(500).send({ message: err.message || "Error fetching moderators" })
  }
}

// Forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body

  try {
    const moderator = await Moderator.findOne({ email })
    if (!moderator) {
      return res.status(404).send({ message: "Moderator not found" })
    }

    const resetCode = crypto.randomBytes(3).toString("hex").toUpperCase() // Ex: "A1B2C3"
    moderator.resetPasswordCode = resetCode
    moderator.resetPasswordExpires = Date.now() + 3600000

    await moderator.save()

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      to: moderator.email,
      from: process.env.EMAIL_USER,
      subject: "Moderator Password Reset Code",
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
    const moderator = await Moderator.findOne({
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!moderator) {
      return res.status(400).send({ message: "Invalid or expired reset code." })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    moderator.moderatorPassword = hashedPassword
    moderator.resetPasswordCode = undefined
    moderator.resetPasswordExpires = undefined

    await moderator.save()
    res.send({ message: "Password has been reset successfully." })
  } catch (err) {
    res.status(500).send({ message: "Error resetting password" })
  }
}

// Update moderator
exports.updateModerator = async (req, res) => {
  const { id } = req.params
  const { moderatorName, email, password } = req.body

  try {
    const shopId = req.user.shopId
    const moderator = await Moderator.findById(id)

    if (!moderator) {
      return res.status(404).send({ message: "Moderator not found" })
    }

    if (req.user.role === "vendor" && moderator.shop.toString() !== shopId.toString()) {
      return res.status(403).send({ message: "You can only update moderators from your shop" })
    }

    const updateData = {
      moderatorName,
      email,
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.moderatorPassword = hashedPassword
    }

    if (req.file) {
      updateData.moderatorImage = req.file.filename
    }

    const updatedModerator = await Moderator.findByIdAndUpdate(id, updateData, { new: true })

    res.status(200).send({
      message: "Moderator updated successfully",
      moderator: updatedModerator,
    })
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}

// Delete moderator
exports.deleteModerator = async (req, res) => {
  const { id } = req.params

  try {
    const shopId = req.user.shopId
    const moderator = await Moderator.findById(id)

    if (!moderator) {
      return res.status(404).send({ message: "Moderator not found" })
    }

    if (req.user.role === "vendor" && moderator.shop.toString() !== shopId.toString()) {
      return res.status(403).send({ message: "You can only delete moderators from your shop" })
    }

    const deletedModerator = await Moderator.findByIdAndDelete(id)
    res.status(200).send({
      message: "Moderator deleted successfully",
      moderator: deletedModerator,
    })
  } catch (err) {
    res.status(500).send({ message: err.message })
  }
}

// Get moderator by ID
exports.getModeratorById = async (req, res) => {
  try {
    const moderator = await Moderator.findById(req.params.id)
    if (!moderator) {
      return res.status(404).send({ message: "Moderator not found" })
    }

    // Check that the moderator belongs to the user's shop
    const shopId = req.user.shopId
    if (req.user.role === "vendor" && moderator.shop.toString() !== shopId) {
      return res.status(403).send({ message: "You can only view moderators from your shop" })
    }

    res.status(200).send({ moderator })
  } catch (err) {
    res.status(500).send({ message: err.message || "Error fetching moderator" })
  }
}
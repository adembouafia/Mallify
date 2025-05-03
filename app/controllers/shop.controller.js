const Shop = require("../models/shop.model")
const dotenv = require("dotenv")
const Vendor = require("../models/vendor.model")
const Product = require("../models/product.model")
const moderator = require("../models/moderator.model")
const report = require("../models/report.model")
const invoice = require("../models/invoice.model")
const order = require("../models/order.model")
const delivery = require("../models/delivery.model")

dotenv.config()

// Get all shops
exports.getAllShops = async (req, res) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {}
    const shops = await Shop.find(query).populate("vendor")
    res.send(shops)
  } catch (err) {
    res.status(500).send({ message: err.message || "Error fetching shops" })
  }
}

// Get shop by ID
exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate("vendor")
    if (!shop) return res.status(404).send({ message: "Shop not found" })
    res.send(shop)
  } catch (err) {
    res.status(500).send({ message: err.message || "Error fetching shop" })
  }
}

// Update shop status
exports.updateShopStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body

    if (!["Pending", "Approved", "Rejected"].includes(status))
      return res.status(400).send({ message: "Invalid or missing status" })

    if (status === "Rejected" && !rejectionReason)
      return res.status(400).send({ message: "Rejection reason is required" })

    const shop = await Shop.findById(req.params.id).populate("vendor")
    if (!shop) return res.status(404).send({ message: "Shop not found" })

    if (status === "Rejected") {
      // Update shop with rejection status and reason
      const updatedShop = await Shop.findByIdAndUpdate(
        req.params.id,
        {
            status,
            rejectionReason,
        },
        { new: true },
    ).populate("vendor")

      // Return the updated shop
      return res.send(updatedShop)
    }

  } catch (err) {
    console.error("Error updating shop status:", err)
    res.status(500).send({ message: err.message || "Error updating shop status" })
  }
}

// Delete shop
exports.deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id)
    await Vendor.findByIdAndDelete(shop.vendor._id)
    await Product.deleteMany({ shop: shop._id })
    await moderator.deleteMany({ shop: shop._id })
    await report.deleteMany({ shop: shop._id })
    await invoice.deleteMany({ shop: shop._id })
    await order.deleteMany({ shop: shop._id })
    await delivery.deleteMany({ shop: shop._id })

    if (!shop) return res.status(404).send({ message: "Shop not found" })
    res.send({ message: "Shop deleted successfully" })
  } catch (err) {
    res.status(500).send({ message: err.message || "Error deleting shop" })
  }
}

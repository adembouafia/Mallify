const Shop = require("../models/shop.model");
const dotenv = require("dotenv");
dotenv.config();

// Get all shops
exports.getAllShops = async (req, res) => {
    try {
        const query = req.query.status ? { status: req.query.status } : {};
        const shops = await Shop.find(query).populate("vendor");
        res.send(shops);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error fetching shops" });
    }
};

// Get shop by ID
exports.getShopById = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id).populate("vendor");
        if (!shop) return res.status(404).send({ message: "Shop not found" });
        res.send(shop);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error fetching shop" });
    }
};

// Update shop status
exports.updateShopStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        if (!["Pending", "Approved", "Rejected"].includes(status))
            return res.status(400).send({ message: "Invalid or missing status" });

        if (status === "Rejected" && !rejectionReason)
            return res.status(400).send({ message: "Rejection reason is required" });

        const shop = await Shop.findByIdAndUpdate(
            req.params.id,
            { status, ...(status === "Rejected" && { rejectionReason }) },
            { new: true }
        ).populate("vendor");

        if (!shop) return res.status(404).send({ message: "Shop not found" });
        res.send(shop);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error updating shop status" });
    }
};

// Delete shop
exports.deleteShop = async (req, res) => {
    try {
        const shop = await Shop.findByIdAndDelete(req.params.id);
        if (!shop) return res.status(404).send({ message: "Shop not found" });
        res.send({ message: "Shop deleted successfully" });
    } catch (err) {
        res.status(500).send({ message: err.message || "Error deleting shop" });
    }
};

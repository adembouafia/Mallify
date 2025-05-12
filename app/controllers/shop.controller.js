const Shop = require("../models/shop.model")
const dotenv = require("dotenv")
const Vendor = require("../models/vendor.model")
const Product = require("../models/product.model")
const moderator = require("../models/moderator.model")
const report = require("../models/report.model")
const invoice = require("../models/invoice.model")
const order = require("../models/order.model")
const delivery = require("../models/delivery.model")
const multer = require("multer")
const path = require("path")

dotenv.config()

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage: storage }).single("shopLogo");

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
    res.send({ shop })
  } catch (err) {
    res.status(500).send({ message: err.message || "Error fetching shop" })
  }
}

// Modifier la fonction updateShop pour synchroniser le numéro de téléphone avec celui du vendor
exports.updateShop = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).send({ message: err.message })
      }

      const shopId = req.params.id
      const shop = await Shop.findById(shopId).populate("vendor")

      if (!shop) {
        return res.status(404).send({ message: "Shop not found" })
      }

      // Ajouter des logs pour déboguer
      console.log("req.userId:", req.userId);
      console.log("req.user:", req.user);
      console.log("shop.vendor._id:", shop.vendor._id);
      console.log("shop.vendor._id.toString():", shop.vendor._id.toString());

      let userId = null;
      
      if (!req.userId && req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(" ")[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
          console.log("ID extrait du token:", userId);
        } catch (tokenError) {
          console.error("Erreur lors de l'extraction de l'ID du token:", tokenError);
        }
      } else {
        userId = req.userId;
      }
      
      const vendorId = shop.vendor._id.toString();
      
      if (userId && userId !== vendorId && req.role !== "admin" && req.role !== "superAdmin") {
        return res.status(403).send({ 
          message: "Not authorized to update this shop",
          debug: {
            userId: userId,
            vendorId: vendorId,
            role: req.role
          }
        });
      }
      
      return updateShopData();
      
      // Fonction interne pour mettre à jour les données du shop
      async function updateShopData() {
        const updateData = {
          shopName: req.body.shopName || shop.shopName,
          shopdescription: req.body.shopdescription || shop.shopdescription,
          adresse: req.body.adresse || shop.adresse,
          shop_phone: req.body.shop_phone || shop.shop_phone,
        };
        

        // Si un nouveau logo a été téléchargé
        if (req.file) {
          updateData.shopLogo = req.file.filename;
        }

        const updatedShop = await Shop.findByIdAndUpdate(shopId, updateData, { new: true });
        res.send(updatedShop);
      }
    });
  } catch (err) {
    console.error("Error in updateShop:", err);
    res.status(500).send({ message: err.message || "Error updating shop" });
  }
};

// Update shop stock limit
exports.updateStockLimit = async (req, res) => {
  try {
    const { stockLimit } = req.body;

    if (stockLimit === undefined || stockLimit === null) {
      return res.status(400).send({ message: "Stock limit is required" });
    }

    const shopId = req.params.id;
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).send({ message: "Shop not found" });
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      { stockLimit: stockLimit },
      { new: true }
    );

    res.send(updatedShop);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating stock limit" });
  }
};


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

    const updateData = { status }

    if (status === "Rejected") {
      updateData.rejectionReason = rejectionReason
    } else if (status === "Approved") {
      updateData.rejectionReason = undefined
    }

    const updatedShop = await Shop.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate("vendor")

    return res.send(updatedShop)
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

//ban shop
exports.banShop = async (req, res) => {
  try {
    const { id } = req.params
    const { bannedReason } = req.body

    const shop = await Shop.findByIdAndUpdate(
      id,
      {
        status: "Banned",
        bannedReason: bannedReason || "Violation of marketplace policies",
      },
      { new: true },
    )

    if (!shop) return res.status(404).send({ message: "Shop not found" })

    res.send(shop)
  } catch (err) {
    res.status(500).send({ message: err.message || "Error banning shop" })
  }
}

//unban shop
exports.unbanShop = async (req, res) => {
  try {
    const { id } = req.params

    const shop = await Shop.findByIdAndUpdate(
      id,
      {
        status: "Approved",
        bannedReason: null,
      },
      { new: true },
    )

    if (!shop) return res.status(404).send({ message: "Shop not found" })

    res.send(shop)
  } catch (err) {
    res.status(500).send({ message: err.message || "Error unbanning shop" })
  }
}

exports.updateShopPhone = async (req, res) => {
  try {
    const { phone } = req.body

    if (!phone) {
      return res.status(400).send({ message: "Phone number is required" })
    }

    const shopId = req.params.id
    const shop = await Shop.findById(shopId)

    if (!shop) {
      return res.status(404).send({ message: "Shop not found" })
    }

    // Vérifier si l'utilisateur est autorisé à mettre à jour ce shop
    if (req.userId !== shop.vendor.toString() && req.role !== "admin" && req.role !== "superAdmin") {
      return res.status(403).send({ message: "Not authorized to update this shop" })
    }

    const updatedShop = await Shop.findByIdAndUpdate(shopId, { phone: phone }, { new: true })

    res.send(updatedShop)
  } catch (err) {
    res.status(500).send({ message: err.message || "Error updating shop phone" })
  }
}

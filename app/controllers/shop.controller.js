const Shop = require("../models/shop.model");
const dotenv = require("dotenv");
const Vendor = require("../models/vendor.model");
const Product = require("../models/product.model");
const moderator = require("../models/moderator.model");
const report = require("../models/report.model");
const invoice = require("../models/invoice.model");
const order = require("../models/order.model");
const delivery = require("../models/delivery.model");
const multer = require("multer");
const path = require("path");

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
const upload = multer({ storage: storage }).single("shopLogo");

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
    res.send({ shop });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error fetching shop" });
  }
};

// Modify the updateShop function to synchronize the phone number with the vendor's
exports.updateShop = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).send({ message: err.message });
      }

      const shopId = req.params.id;
      const shop = await Shop.findById(shopId).populate("vendor");

      if (!shop) {
        return res.status(404).send({ message: "Shop not found" });
      }

      // Add logs for debugging
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
          console.log("ID extracted from token:", userId);
        } catch (tokenError) {
          console.error(
            "Error extracting ID from token:",
            tokenError
          );
        }
      } else {
        userId = req.userId;
      }

      const vendorId = shop.vendor._id.toString();

      if (
        userId &&
        userId !== vendorId &&
        req.role !== "admin" &&
        req.role !== "superAdmin"
      ) {
        return res.status(403).send({
          message: "Not authorized to update this shop",
          debug: {
            userId: userId,
            vendorId: vendorId,
            role: req.role,
          },
        });
      }

      return updateShopData();

      // Internal function to update shop data
      async function updateShopData() {
        const updateData = {
          shopName: req.body.shopName || shop.shopName,
          shopdescription: req.body.shopdescription || shop.shopdescription,
          adresse: req.body.adresse || shop.adresse,
          shop_phone: req.body.shop_phone || shop.shop_phone,
        };

        // If a new logo has been uploaded
        if (req.file) {
          updateData.shopLogo = req.file.filename;
        }

        const updatedShop = await Shop.findByIdAndUpdate(shopId, updateData, {
          new: true,
        });
        res.send(updatedShop);
      }
    });
  } catch (err) {
    console.error("Error in updateShop:", err);
    res.status(500).send({ message: err.message || "Error updating shop" });
  }
};

// Stock limit functionality has been moved to the product level

// Update shop status
exports.updateShopStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status))
      return res.status(400).send({ message: "Invalid or missing status" });

    if (status === "Rejected" && !rejectionReason)
      return res.status(400).send({ message: "Rejection reason is required" });

    const shop = await Shop.findById(req.params.id).populate("vendor");
    if (!shop) return res.status(404).send({ message: "Shop not found" });

    const updateData = { status };

    if (status === "Rejected") {
      updateData.rejectionReason = rejectionReason;
    } else if (status === "Approved") {
      updateData.rejectionReason = undefined;
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("vendor");

    return res.send(updatedShop);
  } catch (err) {
    console.error("Error updating shop status:", err);
    res
      .status(500)
      .send({ message: err.message || "Error updating shop status" });
  }
};

// Delete shop
exports.deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);
    await Vendor.findByIdAndDelete(shop.vendor._id);
    await Product.deleteMany({ shop: shop._id });
    await moderator.deleteMany({ shop: shop._id });
    await report.deleteMany({ shop: shop._id });
    await invoice.deleteMany({ shop: shop._id });
    await order.deleteMany({ shop: shop._id });
    await delivery.deleteMany({ shop: shop._id });

    if (!shop) return res.status(404).send({ message: "Shop not found" });
    res.send({ message: "Shop deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error deleting shop" });
  }
};

//ban shop
exports.banShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { bannedReason } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      id,
      {
        status: "Banned",
        bannedReason: bannedReason || "Violation of marketplace policies",
      },
      { new: true }
    );

    if (!shop) return res.status(404).send({ message: "Shop not found" });

    res.send(shop);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error banning shop" });
  }
};

//unban shop
exports.unbanShop = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findByIdAndUpdate(
      id,
      {
        status: "Approved",
        bannedReason: null,
      },
      { new: true }
    );

    if (!shop) return res.status(404).send({ message: "Shop not found" });

    res.send(shop);
  } catch (err) {
    res.status(500).send({ message: err.message || "Error unbanning shop" });
  }
};

exports.updateShopPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).send({ message: "Phone number is required" });
    }

    const shopId = req.params.id;
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).send({ message: "Shop not found" });
    }

    // Check if the user is authorized to update this shop
    if (
      req.userId !== shop.vendor.toString() &&
      req.role !== "admin" &&
      req.role !== "superAdmin"
    ) {
      return res
        .status(403)
        .send({ message: "Not authorized to update this shop" });
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      { phone: phone },
      { new: true }
    );

    res.send(updatedShop);
  } catch (err) {
    res
      .status(500)
      .send({ message: err.message || "Error updating shop phone" });
  }
};

// Get shop count for admin dashboard
exports.getShopCount = async (req, res) => {
  try {
    const count = await Shop.countDocuments();
    res.status(200).json({ count });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Error fetching shop count" });
  }
};

// Get all categories with their subcategories for the admin dashboard
exports.getShopCategories = async (req, res) => {
  try {
    console.log(
      "Fetching all platform categories and subcategories for admin dashboard"
    );

    // Import the Category model
    const Category = require("../models/category.model");
    const SubCategory = require("../models/subCategory.model");

    // Get all categories from database
    const categories = await Category.find({}).lean().exec();

    if (!categories || categories.length === 0) {
      console.log("No categories found in the database, returning sample data");

      // Return sample categories as fallback
      const sampleCategories = [
        {
          name: "Electronics",
          _id: "electronics-id",
          count: 8,
          subcategories: [],
        },
        { name: "Clothing", _id: "clothing-id", count: 6, subcategories: [] },
        {
          name: "Home Goods",
          _id: "home-goods-id",
          count: 4,
          subcategories: [],
        },
        { name: "Beauty", _id: "beauty-id", count: 3, subcategories: [] },
        { name: "Food", _id: "food-id", count: 2, subcategories: [] },
      ];

      return res.status(200).json(sampleCategories);
    }

    console.log(
      `Found ${categories.length} categories. Now fetching their subcategories...`
    );

    // For each category, find its subcategories
    const categoriesWithData = await Promise.all(
      categories.map(async (category) => {
        // Find subcategories for this category
        const subcategories = await SubCategory.find({ category: category._id })
          .lean()
          .exec();

        // Count products per category
        const productsInCategory = await Product.countDocuments({
          category: category._id,
        });

        return {
          name: category.categoryName,
          _id: category._id,
          count: productsInCategory || 0,
          subcategories: subcategories.map((sub) => ({
            name: sub.name,
            _id: sub._id,
          })),
        };
      })
    );

    // Sort by product count (most popular first)
    categoriesWithData.sort((a, b) => b.count - a.count);

    console.log(
      `Successfully fetched ${categoriesWithData.length} categories with their subcategories`
    );
    return res.status(200).json(categoriesWithData);
  } catch (err) {
    console.error("Error in getShopCategories:", err);

    // Provide sample data even if an error occurs
    try {
      const sampleCategories = [
        {
          name: "Electronics",
          _id: "electronics-id",
          count: 8,
          subcategories: [],
        },
        { name: "Clothing", _id: "clothing-id", count: 6, subcategories: [] },
        {
          name: "Home Goods",
          _id: "home-goods-id",
          count: 4,
          subcategories: [],
        },
        { name: "Beauty", _id: "beauty-id", count: 3, subcategories: [] },
        { name: "Food", _id: "food-id", count: 2, subcategories: [] },
      ];

      console.log("Error occurred, returning sample category data as fallback");
      return res.status(200).json(sampleCategories);
    } catch (fallbackErr) {
      res.status(500).json({
        message: "Failed to retrieve categories and subcategories",
        error: err.message,
      });
    }
  }
};

// Get best selling shops
exports.getBestSellers = async (req, res) => {
  try {
    // Get orders data aggregated by shop with direct lookup to shop collection
    const bestSellers = await order.aggregate([
      // Match only valid orders
      { $match: { shop: { $exists: true, $ne: null } } },
      // Lookup shop details
      {
        $lookup: {
          from: "shops",
          localField: "shop",
          foreignField: "_id",
          as: "shopDetails",
        },
      },
      // Unwind the shop details array
      { $unwind: { path: "$shopDetails", preserveNullAndEmptyArrays: true } },
      // Group by shop ID and count orders
      {
        $group: {
          _id: "$shop",
          shopName: {
            $first: { $ifNull: ["$shopDetails.shopName", "$shopDetails.name"] },
          },
          sales: { $sum: 1 },
        },
      },
      // Ensure we have a shop name
      {
        $project: {
          _id: 0,
          shopName: { $ifNull: ["$shopName", "Unknown Shop"] },
          sales: 1,
        },
      },
      // Sort by sales count descending
      { $sort: { sales: -1 } },
      // Limit to top sellers
      { $limit: 10 },
    ]);

    console.log(`Found ${bestSellers.length} shops with orders`);

    if (bestSellers.length > 0) {
      return res.status(200).json(bestSellers);
    }

    // If no orders found, get all shops and set sales to 0
    const allShops = await Shop.find({}, { shopName: 1, name: 1 })
      .lean()
      .limit(10);

    if (allShops && allShops.length > 0) {
      const shopData = allShops.map((shop) => ({
        shopName: shop.shopName || shop.name || "Unknown Shop",
        sales: 0,
      }));

      console.log(
        `No sales data found. Returning ${shopData.length} shops with zero sales`
      );
      return res.status(200).json(shopData);
    }

    // If all else fails, return sample data
    console.warn("No shop data found, returning sample data");
    const sampleData = [
      { shopName: "Electronics Store", sales: 0 },
      { shopName: "Fashion Boutique", sales: 0 },
      { shopName: "Home Goods", sales: 0 },
      { shopName: "Tech Gadgets", sales: 0 },
      { shopName: "Beauty Shop", sales: 0 },
    ];

    res.status(200).json(sampleData);
  } catch (err) {
    console.error("Error in getBestSellers:", err);
    res
      .status(500)
      .json({ message: err.message || "Error fetching best sellers" });
  }
};
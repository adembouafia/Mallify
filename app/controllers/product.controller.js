const Product = require("../models/product.model");
const SubCategory = require("../models/subCategory.model");
const Shop = require("../models/shop.model");
const Vendor = require("../models/vendor.model");
const dotenv = require("dotenv");
const multer = require("multer");
dotenv.config();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
}).fields([
  { name: "mainImage", maxCount: 1 },
  { name: "otherImages", maxCount: 12 },
]);

// Create a new product
exports.createProduct = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({
        status: "fail",
        message: err.message || "Error uploading files",
      });
    }

    try {
      const { subCategory } = req.body;

      // Verify the subcategory exists
      const existingSubCategory = await SubCategory.findById(subCategory);
      if (!existingSubCategory) {
        return res.status(400).json({
          status: "fail",
          message: "La sous-catégorie spécifiée n'existe pas",
        });
      }

      let shopId;

      // If the user is a vendor, get their shop ID
      if (req.user.role === "vendor") {
        // Check if shopId is directly in the token
        if (req.user.shopId) {
          shopId = req.user.shopId;
        } else {
          // If not, find the vendor and get their shop
          const vendor = await Vendor.findById(req.user.id);
          if (!vendor || !vendor.shop) {
            return res.status(403).json({
              status: "fail",
              message: "Vendor does not have a shop",
            });
          }
          shopId = vendor.shop;
        }
      } else if (req.user.role === "moderator") {
        // For moderators or admins, they might be managing products for a specific shop
        // So we'll use the shopId from the request body if provided
        if (req.body.shopId) {
          // Verify the shop exists
          const shopExists = await Shop.findById(req.body.shopId);
          if (!shopExists) {
            return res.status(404).json({
              status: "fail",
              message: "Shop not found",
            });
          }
          shopId = req.body.shopId;
        } else {
          return res.status(400).json({
            status: "fail",
            message: "Shop ID is required for moderators and admins",
          });
        }
      } else {
        return res.status(403).json({
          status: "fail",
          message: "Unauthorized role",
        });
      }

      const productData = {
        ...req.body,
        shop: shopId,
        mainImage: req.files["mainImage"]
          ? req.files["mainImage"][0].filename
          : null,
        otherImages: req.files["otherImages"]
          ? req.files["otherImages"].map((file) => file.filename)
          : [],
      };

      const product = await Product.create(productData);

      res.status(201).json({
        status: "success",
        data: {
          product,
        },
      });
    } catch (err) {
      res.status(400).json({
        status: "fail",
        message: err.message,
      });
    }
  });
};

// Get all products with populated subCategory and shop
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("subCategory", "name")
      .populate("shop", "shopName"); // Also populate shop information

    res.status(200).json({
      status: "success",
      results: products.length,
      data: {
        products,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// Get product by ID with populated subCategory and shop
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: "subCategory",
        populate: {
          path: "category",
          select: "categoryName",
        },
        select: "name",
      })
      .populate("shop", "shopName"); // Also populate shop information

    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// Get products belonging to the current vendor's shop
exports.getMyProducts = async (req, res) => {
  try {
    let shopId;
    console.log("step1");
    // If the user is a vendor, get their shop ID
    if (req.user.role === "vendor") {
      console.log("step2");
      // Check if shopId is directly in the token
      if (req.user.shopId) {
        shopId = req.user.shopId;
      } else {
        // If not, find the vendor and get their shop
        console.log("step3");

        const vendor = await Vendor.findById(req.user.id);
        if (!vendor || !vendor.shop) {
          return res.status(403).json({
            status: "fail",
            message: "Vendor does not have a shop",
          });
        }
        shopId = vendor.shop;
      }
    } else if (req.user.role === "moderator" && req.query.shopId) {
      // Moderators can view products for a specific shop if they provide the shop ID
      shopId = req.query.shopId;
    } else if (req.user.role === "admin" && req.query.shopId) {
      // Admins can view products for a specific shop if they provide the shop ID
      shopId = req.query.shopId;
    } else if (req.user.role === "admin" || req.user.role === "moderator") {
      // If no shop ID is provided, return all products for admins and moderators
      const products = await Product.find()
        .populate("subCategory", "name")
        .populate("shop", "shopName");

      console.log("step4");

      return res.status(200).json({
        status: "success",
        results: products.length,
        data: {
          products,
        },
      });
    } else {
      return res.status(403).json({
        status: "fail",
        message: "Unauthorized role",
      });
    }

    const products = await Product.find({ shop: shopId })
      .populate("subCategory", "name")
      .populate("shop", "shopName");

    res.status(200).json({
      status: "success",
      results: products.length,
      data: {
        shopId,
        products,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

// Update product by ID
exports.updateProduct = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({
        status: "fail",
        message: err.message || "Error uploading files",
      });
    }

    try {
      // First, find the product
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          status: "fail",
          message: "Product not found",
        });
      }

      // Check permissions based on role
      if (req.user.role === "vendor") {
        let vendorShopId;

        // Get vendor's shop ID
        if (req.user.shopId) {
          vendorShopId = req.user.shopId;
        } else {
          const vendor = await Vendor.findById(req.user.id);
          if (!vendor || !vendor.shop) {
            return res.status(403).json({
              status: "fail",
              message: "Vendor does not have a shop",
            });
          }
          vendorShopId = vendor.shop;
        }

        // Check if the product belongs to the vendor's shop
        if (product.shop.toString() !== vendorShopId.toString()) {
          return res.status(403).json({
            status: "fail",
            message: "You don't have permission to update this product",
          });
        }
      }
      // Admins and moderators can update any product

      const { subCategory } = req.body;

      // Ensure subCategory exists if provided
      if (subCategory) {
        const existingSubCategory = await SubCategory.findById(subCategory);
        if (!existingSubCategory) {
          return res.status(400).json({
            status: "fail",
            message: "La sous-catégorie spécifiée n'existe pas",
          });
        }
      }

      // Prepare product data
      const updatedData = {
        ...req.body,
        mainImage: req.files["mainImage"]
          ? req.files["mainImage"][0].filename
          : req.body.currentMainImage,
        otherImages: req.files["otherImages"]
          ? req.files["otherImages"].map((file) => file.filename)
          : req.body.currentOtherImages,
      };

      // Don't allow changing the shop
      delete updatedData.shop;

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updatedData,
        { new: true }
      );

      res.status(200).json({
        status: "success",
        data: {
          product: updatedProduct,
        },
      });
    } catch (err) {
      res.status(400).json({
        status: "fail",
        message: err.message,
      });
    }
  });
};

// Delete product by ID
exports.deleteProduct = async (req, res) => {
  try {
    // First, find the product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      });
    }

    // Check permissions based on role
    if (req.user.role === "vendor") {
      let vendorShopId;

      // Get vendor's shop ID
      if (req.user.shopId) {
        vendorShopId = req.user.shopId;
      } else {
        const vendor = await Vendor.findById(req.user.id);
        if (!vendor || !vendor.shop) {
          return res.status(403).json({
            status: "fail",
            message: "Vendor does not have a shop",
          });
        }
        vendorShopId = vendor.shop;
      }

      // Check if the product belongs to the vendor's shop
      if (product.shop.toString() !== vendorShopId.toString()) {
        return res.status(403).json({
          status: "fail",
          message: "You don't have permission to delete this product",
        });
      }
    }
    // Admins and moderators can delete any product

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

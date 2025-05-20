const Product = require("../models/product.model")
const SubCategory = require("../models/subCategory.model")
const Shop = require("../models/shop.model")
const Vendor = require("../models/vendor.model")
const dotenv = require("dotenv")
const multer = require("multer")
dotenv.config()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
}).fields([
  { name: "mainImage", maxCount: 1 },
  { name: "otherImages", maxCount: 12 },
])

// Create a new product
exports.createProduct = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({
        status: "fail",
        message: err.message || "Error uploading files",
      })
    }

    try {
      const { subCategory } = req.body
      const existingSubCategory = await SubCategory.findById(subCategory)
      if (!existingSubCategory) {
        return res.status(400).json({
          status: "fail",
          message: "La sous-catégorie spécifiée n'existe pas",
        })
      }

      let shopId
      if (req.user.role === "vendor" || req.user.role === "moderator") {
        if (req.user.shopId) {
          shopId = req.user.shopId
        } else {
          const vendor = await Vendor.findById(req.user.id)
          if (!vendor || !vendor.shop) {
            return res.status(403).json({
              status: "fail",
              message: "Vendor does not have a shop",
            })
          }
          shopId = vendor.shop
        }
      } else {
        return res.status(403).json({
          status: "fail",
          message: "Unauthorized role",
        })
      }

      const productData = {
        ...req.body,
        shop: shopId,
        mainImage: req.files["mainImage"] ? req.files["mainImage"][0].filename : null,
        otherImages: req.files["otherImages"] ? req.files["otherImages"].map((file) => file.filename) : [],
      }

      const product = await Product.create(productData)

      res.status(201).json({
        status: "success",
        data: {
          product,
        },
      })
    } catch (err) {
      res.status(400).json({
        status: "fail",
        message: err.message,
      })
    }
  })
}

// Get all products with populated subCategory and shop
exports.getAllProducts = async (req, res) => {
  try {
    let products = await Product.find().populate("subCategory", "name").populate("shop", "shopName status") // Ajout du status pour vérifier si la boutique est bannie
    if (req.user && (req.user.role === "vendor" || req.user.role === "admin" || req.user.role === "superAdmin")) {
    } else {
      products = products.filter((product) => {
        if (product.banned) return false
        if (product.shop && product.shop.status === "Banned") return false

        return true
      })
    }

    res.status(200).json({
      status: "success",
      results: products.length,
      data: {
        products,
      },
    })
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}
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
      .populate("shop", "shopName")

    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      })
    }

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    })
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

// Get products belonging to the current vendor's shop
exports.getMyProducts = async (req, res) => {
  try {
    let shopId
    if (req.user.role === "vendor") {
      if (req.user.shopId) {
        shopId = req.user.shopId
      } else {
        const vendor = await Vendor.findById(req.user.id)
        if (!vendor || !vendor.shop) {
          return res.status(403).json({
            status: "fail",
            message: "Vendor does not have a shop",
          })
        }
        shopId = vendor.shop
      }
    } else if (req.user.role === "moderator") {
      // Pour les modérateurs, utiliser leur shopId du token
      shopId = req.user.shopId
      if (!shopId) {
        return res.status(400).json({
          status: "fail",
          message: "Shop ID non trouvé dans le token d'authentification",
        })
      }
    } else if (req.user.role === "admin" && req.query.shopId) {
      shopId = req.query.shopId
    } else if (req.user.role === "admin" || req.user.role === "moderator") {
      const products = await Product.find().populate("subCategory", "name").populate("shop", "shopName")
      return res.status(200).json({
        status: "success",
        results: products.length,
        data: {
          products,
        },
      })
    } else {
      return res.status(403).json({
        status: "fail",
        message: "Unauthorized role",
      })
    }

    const products = await Product.find({ shop: shopId }).populate("subCategory", "name").populate("shop", "shopName")

    res.status(200).json({
      status: "success",
      results: products.length,
      data: {
        shopId,
        products,
      },
    })
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

// Update product by ID
exports.updateProduct = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({
        status: "fail",
        message: err.message || "Error uploading files",
      })
    }

    try {
      const product = await Product.findById(req.params.id)
      if (!product) {
        return res.status(404).json({
          status: "fail",
          message: "Product not found",
        })
      }

      // Vérifier que le produit appartient au shop de l'utilisateur
      const shopId = req.user.shopId
      if (product.shop.toString() !== shopId) {
        return res.status(403).json({
          status: "fail",
          message: "You don't have permission to update this product",
        })
      }

      const { subCategory } = req.body
      if (subCategory) {
        const existingSubCategory = await SubCategory.findById(subCategory)
        if (!existingSubCategory) {
          return res.status(400).json({
            status: "fail",
            message: "La sous-catégorie spécifiée n'existe pas",
          })
        }
      }
      const updatedData = {
        ...req.body,
        mainImage: req.files["mainImage"] ? req.files["mainImage"][0].filename : req.body.currentMainImage,
        otherImages: req.files["otherImages"]
          ? req.files["otherImages"].map((file) => file.filename)
          : req.body.currentOtherImages,
      }
      delete updatedData.shop

      const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true })

      res.status(200).json({
        status: "success",
        data: {
          product: updatedProduct,
        },
      })
    } catch (err) {
      res.status(400).json({
        status: "fail",
        message: err.message,
      })
    }
  })
}

// Delete product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      })
    }

    // Vérifier que le produit appartient au shop de l'utilisateur
    const shopId = req.user.shopId
    if (product.shop.toString() !== shopId) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission to delete this product",
      })
    }

    await Product.findByIdAndDelete(req.params.id)

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
    })
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

// Add review to product
exports.addReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body
    const productId = req.params.id

    console.log("Received data:", { rating, title, comment, productId })
    if (!rating || !comment) {
      return res.status(400).json({
        status: "fail",
        message: "Rating and comment are required",
      })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        status: "fail",
        message: "Rating must be between 1 and 5",
      })
    }
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      })
    }

    console.log("Product found:", product)

    product.reviews.push({
      productId: product._id,
      clientId: req.user.id,
      clientName: req.user.name || req.user.email.split("@")[0],
      rating,
      title: title.trim(),
      comment: comment.trim(),
    })
    await product.save()

    res.status(200).json({
      status: "success",
      data: {
        reviews: product.reviews,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
      },
    })
  } catch (err) {
    console.error("Error processing review:", err)
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      })
    }

    res.status(200).json({
      status: "success",
      data: {
        reviews: product.reviews,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
      },
    })
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ status: "fail", message: "Product not found" })

    const review = product.reviews.id(reviewId)
    if (!review) return res.status(404).json({ status: "fail", message: "Review not found" })

    console.log("req.user =", req.user)
    console.log("review.clientId =", review.clientId)

    if (
      (!review.clientId || review.clientId.toString() !== req.user.id) &&
      !["admin", "moderator", "vendor"].includes(req.user.role)
    ) {
      return res.status(403).json({
        status: "fail",
        message: "Not authorized to delete this review",
      })
    }

    product.reviews = product.reviews.filter((r) => r._id.toString() !== reviewId)
    await product.save()

    res.status(200).json({
      status: "success",
      message: "Review deleted",
      data: {
        reviews: product.reviews,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
      },
    })
  } catch (err) {
    console.error("Delete review error:", err)
    res.status(500).json({
      status: "fail",
      message: "Server error",
      error: err.message,
    })
  }
}

// Get user's review for a product
exports.getUserReview = async (req, res) => {
  try {
    const productId = req.params.id
    const userId = req.user.id
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      })
    }
    const review = product.reviews.find((review) => review.userId.toString() === userId)

    res.status(200).json({
      status: "success",
      data: {
        review: review || null,
      },
    })
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

// Add a specific endpoint to ban products
exports.banProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      })
    }
    if (req.user.role !== "admin" && req.user.role !== "superAdmin") {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission to ban this product",
      })
    }
    const banReason = req.body.banReason || "Counterfeit"
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        banned: true,
        bannedReason: banReason,
      },
      { new: true },
    )

    res.status(200).json({
      status: "success",
      data: {
        product: updatedProduct,
      },
      message: "Product banned successfully",
    })
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

// Add a specific endpoint to unban products
exports.unbanProduct = async (req, res) => {
  try {
    // First, find the product
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Product not found",
      })
    }

    if (req.user.role !== "admin" && req.user.role !== "superAdmin") {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission to unban this product",
      })
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        banned: false,
        bannedReason: null,
      },
      { new: true },
    )

    res.status(200).json({
      status: "success",
      data: {
        product: updatedProduct,
      },
      message: "Product unbanned successfully",
    })
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

// Get all banned products
exports.getBannedProducts = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superAdmin") {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission to access banned products",
      })
    }

    const bannedProducts = await Product.find({ banned: true })
      .populate({
        path: "subCategory",
        populate: {
          path: "category",
          select: "categoryName",
        },
      })
      .populate("shop", "shopName")

    res.status(200).json({
      status: "success",
      results: bannedProducts.length,
      data: {
        products: bannedProducts,
      },
    })
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const categoryName = req.params.categoryName
    if (categoryName.toLowerCase() === "all") {
      return this.getAllProducts(req, res)
    }
    const products = await Product.find()
      .populate({
        path: "subCategory",
        populate: {
          path: "category",
          select: "categoryName",
        },
      })
      .populate("shop", "shopName status")

    // Filtrer les produits par catégorie
    const filteredProducts = products.filter((product) => {
      if (product.subCategory && product.subCategory.category && product.subCategory.category.categoryName) {
        return product.subCategory.category.categoryName === categoryName
      }
      return false
    })
    let finalProducts = filteredProducts
    if (!(req.user && (req.user.role === "vendor" || req.user.role === "admin" || req.user.role === "superAdmin"))) {
      finalProducts = filteredProducts.filter((product) => {
        if (product.banned) return false
        if (product.shop && product.shop.status === "Banned") return false
        return true
      })
    }

    res.status(200).json({
      status: "success",
      results: finalProducts.length,
      products: finalProducts,
    })
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

// Get category counts
exports.getCategoryCounts = async (req, res) => {
  try {
    const products = await Product.find({ banned: { $ne: true } })
      .populate({
        path: "subCategory",
        populate: {
          path: "category",
          select: "categoryName",
        },
      })
      .populate("shop", "shopName status")
    const validProducts = products.filter((product) => !(product.shop && product.shop.status === "Banned"))
    const categoryCounts = {}
    validProducts.forEach((product) => {
      let categoryId = null
      if (product.category) {
        categoryId = typeof product.category === "object" ? product.category._id : product.category
      } else if (product.subCategory && product.subCategory.category) {
        if (typeof product.subCategory.category === "string") {
          categoryId = product.subCategory.category
        } else if (product.subCategory.category && product.subCategory.category._id) {
          categoryId = product.subCategory.category._id
        }
      } else if (product.parentCategory) {
        categoryId = product.parentCategory
      }

      if (categoryId) {
        const categoryIdStr = categoryId.toString()
        categoryCounts[categoryIdStr] = (categoryCounts[categoryIdStr] || 0) + 1
      }
    })

    res.status(200).json({
      status: "success",
      categoryCounts,
    })
  } catch (err) {
    console.error("Error getting category counts:", err)
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

exports.getFilteredProducts = async (req, res) => {
  try {
    const { category, subcategory, name, minRating, maxRating, minPrice, maxPrice, search, shop } = req.query
    const filter = {}
    if (shop) {
      filter.shop = shop
    }
    if (category) {
    }
    if (subcategory) {
      filter.subCategory = subcategory
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.productPrice = {}
      if (minPrice !== undefined) {
        filter.productPrice.$gte = Number(minPrice)
      }
      if (maxPrice !== undefined) {
        filter.productPrice.$lte = Number(maxPrice)
      }
    }
    if (minRating !== undefined) {
      filter.averageRating = { $gte: Number(minRating) }
    }
    if (name) {
      filter.productName = { $regex: name, $options: "i" }
    }
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { productDetails: { $regex: search, $options: "i" } },
      ]
    }
    if (!(req.user && (req.user.role === "vendor" || req.user.role === "admin" || req.user.role === "superAdmin"))) {
      filter.banned = { $ne: true }
    }

    let products
    if (category) {
      const subCategories = await SubCategory.find({ category: category }).select("_id")
      const subCategoryIds = subCategories.map((sc) => sc._id)
      products = await Product.find({
        $or: [{ category: category }, { subCategory: { $in: subCategoryIds } }],
        ...filter,
      })
        .populate({
          path: "subCategory",
          populate: {
            path: "category",
            select: "categoryName",
          },
        })
        .populate("shop", "shopName status")
    } else {
      products = await Product.find(filter)
        .populate({
          path: "subCategory",
          populate: {
            path: "category",
            select: "categoryName",
          },
        })
        .populate("shop", "shopName status")
    }
    products = products.filter((product) => !(product.shop && product.shop.status === "Banned"))
    const { sort } = req.query
    if (sort) {
      switch (sort) {
        case "rating":
          products.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          break
        case "newest":
          products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          break
        case "price_asc":
          products.sort((a, b) => a.productPrice - b.productPrice)
          break
        case "price_desc":
          products.sort((a, b) => b.productPrice - a.productPrice)
          break
      }
    }
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 12
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const total = products.length

    const paginatedProducts = products.slice(startIndex, endIndex)

    res.status(200).json({
      status: "success",
      results: total,
      page,
      pages: Math.ceil(total / limit),
      data: {
        products: paginatedProducts,
      },
    })
  } catch (err) {
    console.error("Error in getFilteredProducts:", err)
    res.status(400).json({
      status: "fail",
      message: err.message,
    })
  }
}

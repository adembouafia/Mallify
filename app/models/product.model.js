const mongoose = require("mongoose")
const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },

    productId: {
      type: String,
      required: true,
      unique: true,
    },

    productPrice: {
      type: Number,
      required: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },

    availability: {
      type: String,
      enum: ["In stock", "Out of stock"],
      required: true,
    },

    stock: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shop",
      required: true,
    },
    mainImage: {
      type: String,
      required: true,
    },
    otherImages: {
      type: [String],
      default: [],
    },

    productDetails: {
      type: String,
      required: true,
    },

    banned: {
      type: Boolean,
      default: false,
    },
    bannedReason: {
      type: String,
    },
    reviews: [reviewSchema],
    averageRating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

productSchema.pre("save", function (next) {
  if (this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0)
    this.averageRating = Math.round((totalRating / this.reviews.length) * 10) / 10
    this.reviewCount = this.reviews.length
  } else {
    this.averageRating = 0
    this.reviewCount = 0
  }
  next()
})

module.exports = mongoose.model("Product", productSchema)

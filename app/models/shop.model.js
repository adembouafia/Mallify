
const mongoose = require("mongoose")

const shopSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
    },
    shopLogo: {
      type: String,
      required: true,
    },
    adresse: {
      type: String,
      required: false,
    },
    shopdescription: {
      type: String,
      required: false,
    },
    shop_phone: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Banned"],
      default: "Pending",
    },
    bannedReason: {
      type: String,
    },
    rejectionReason: {
      type: String,
      required: false,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vendor",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("shop", shopSchema)


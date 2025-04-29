const mongoose = require("mongoose")

// Define a schema for the cart data to be embedded in orders
const OrderCartItemSchema = new mongoose.Schema({
  productId: {
    type: Object, // Store the complete product data
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
})

const OrderCartDataSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
  },
  items: [OrderCartItemSchema],
  totalPrice: {
    type: Number,
    default: 0,
  },
})

const orderSchema = new mongoose.Schema({
  idPanier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
  },
  idClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  dateCommande: {
    type: Date,
    default: Date.now,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "shop",
  },
  // Add complete cart data to the order
  cartData: {
    type: OrderCartDataSchema,
    default: null,
  },
  orderTotal: {
    type: Number,
    default: 0,
  },
})

module.exports = mongoose.model("Order", orderSchema)

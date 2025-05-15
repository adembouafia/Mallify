const mongoose = require("mongoose");

// Define a schema for the cart data to be embedded in orders
const OrderCartItemSchema = new mongoose.Schema({
  productId: {
    type: Object,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
});

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
});

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

  cartData: {
    type: OrderCartDataSchema,
    default: null,
  },
  orderTotal: {
    type: Number,
    default: 0,
  },
  orderStatus: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "completed",
      "cancelled",
      "shipped",
      "postponed",
    ],
    default: "pending",
  },
  postponedDate: {
    type: Date,
    default: null,
  },
  refusalReason: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("Order", orderSchema);

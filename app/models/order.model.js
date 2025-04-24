const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  idPanier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    required: true,
  },
  idClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  dateCommande: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Order", orderSchema);

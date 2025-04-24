const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    idCommande: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    dateFacture: {
        type: Date,
        default: Date.now,
    },
    montantTotal: {
        type: Number,
        required: true,
    },
    statutPaiement: {
        type: String,
        enum: ['non payé', 'payé'],
        default: 'non payé',
    }
});

module.exports = mongoose.model("Invoice", invoiceSchema);

const Invoice = require("../models/invoice.model");


// Récupérer toutes les factures
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
        .populate({
            path: 'idCommande',
            populate: { path: 'idClient idPanier' }
        });
        res.status(200).json({ invoices });
    } catch (err) {
        res.status(500).json({ message: 'Erreur récupération factures', error: err.message });
    }
};



// Récupérer une facture par ID de facture
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
        .populate({
            path: 'idCommande',
            populate: { path: 'idClient idPanier' }
        });
        if (!invoice) return res.status(404).json({ message: 'Facture non trouvée' });
        res.status(200).json({ invoice });
    } catch (err) {
        res.status(500).json({ message: 'Erreur récupération facture', error: err.message });
    }
};



// Récupérer la facture d'une commande spécifique
exports.getInvoiceByOrder = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ idCommande: req.params.orderId })
        .populate({
            path: 'idCommande',
            populate: { path: 'idClient idPanier' }
        });
        if (!invoice) return res.status(404).json({ message: 'Facture pour cette commande non trouvée' });
        res.status(200).json({ invoice });
    } catch (err) {
        res.status(500).json({ message: 'Erreur récupération facture', error: err.message });
    }
};
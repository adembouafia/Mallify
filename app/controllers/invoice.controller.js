const Invoice = require("../models/invoice.model");

// Récupérer toutes les factures
exports.getAllInvoices = async (req, res) => {
  try {
    // Récupérer le shopId depuis la requête
    const shopId = req.query.shopId;

    if (!shopId) {
      return res.status(400).json({
        message: "Le paramètre shopId est requis",
      });
    }

    console.log(`Recherche des factures pour le shop: ${shopId}`);

    // Récupérer toutes les factures
    const allInvoices = await Invoice.find().populate({
      path: "idCommande",
      populate: [
        {
          path: "idClient",
          select:
            "firstname lastname email phoneNumber shippingInfo savedAddresses",
        },
        {
          path: "idPanier",
        },
        {
          path: "shop",
          select: "shopName shopLogo adresse shop_phone _id",
        },
      ],
    });

    // Filtrer les factures qui correspondent au shopId spécifié
    const filteredInvoices = allInvoices.filter(
      (invoice) =>
        invoice.idCommande &&
        invoice.idCommande.shop &&
        invoice.idCommande.shop._id.toString() === shopId
    );

    console.log(`Factures trouvées pour ce shop: ${filteredInvoices.length}`);

    res.status(200).json({ invoices: filteredInvoices });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur récupération factures", error: err.message });
  }
};

// Récupérer une facture par ID de facture
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path: "idCommande",
      populate: [
        {
          path: "idClient",
          select:
            "firstname lastname email phoneNumber shippingInfo savedAddresses",
        },
        {
          path: "idPanier",
        },
        {
          path: "shop",
          select: "shopName shopLogo adresse shop_phone",
        },
      ],
    });
    if (!invoice)
      return res.status(404).json({ message: "Facture non trouvée" });
    res.status(200).json({ invoice });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur récupération facture", error: err.message });
  }
};

// Récupérer la facture d'une commande spécifique
exports.getInvoiceByOrder = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      idCommande: req.params.orderId,
    }).populate({
      path: "idCommande",
      populate: [
        {
          path: "idClient",
          select:
            "firstname lastname email phoneNumber shippingInfo savedAddresses",
        },
        {
          path: "idPanier",
        },
        {
          path: "shop",
          select: "shopName shopLogo adresse shop_phone",
        },
      ],
    });
    if (!invoice)
      return res
        .status(404)
        .json({ message: "Facture pour cette commande non trouvée" });
    res.status(200).json({ invoice });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur récupération facture", error: err.message });
  }
};

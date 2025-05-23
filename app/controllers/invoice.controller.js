const Invoice = require("../models/invoice.model")

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    // Get shopId from authenticated user
    const shopId = req.user.shopId

    if (!shopId) {
      return res.status(400).json({
        message: "Shop ID not found in authentication token",
      })
    }

    console.log(`Searching for invoices for shop: ${shopId}`)

    // Get all invoices
    const allInvoices = await Invoice.find().populate({
      path: "idCommande",
      populate: [
        {
          path: "idClient",
          select: "firstname lastname email phoneNumber shippingInfo savedAddresses",
        },
        {
          path: "idPanier",
        },
        {
          path: "shop",
          select: "shopName shopLogo adresse shop_phone _id",
        },
      ],
    })

    // Filter invoices that match the specified shopId
    const filteredInvoices = allInvoices.filter(
      (invoice) => invoice.idCommande && invoice.idCommande.shop && invoice.idCommande.shop._id.toString() === shopId,
    )

    console.log(`Invoices found for this shop: ${filteredInvoices.length}`)

    res.status(200).json({ invoices: filteredInvoices })
  } catch (err) {
    res.status(500).json({ message: "Error retrieving invoices", error: err.message })
  }
}

// Get an invoice by invoice ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path: "idCommande",
      populate: [
        {
          path: "idClient",
          select: "firstname lastname email phoneNumber shippingInfo savedAddresses",
        },
        {
          path: "idPanier",
        },
        {
          path: "shop",
          select: "shopName shopLogo adresse shop_phone _id",
        },
      ],
    })

    if (!invoice) return res.status(404).json({ message: "Invoice not found" })

    // Check that the invoice belongs to the user's shop
    const shopId = req.user.shopId
    if (invoice.idCommande && invoice.idCommande.shop && invoice.idCommande.shop._id.toString() !== shopId) {
      return res.status(403).json({
        message: "You are not authorized to access this invoice",
      })
    }

    res.status(200).json({ invoice })
  } catch (err) {
    res.status(500).json({ message: "Error retrieving invoice", error: err.message })
  }
}

// Get the invoice for a specific order
exports.getInvoiceByOrder = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      idCommande: req.params.orderId,
    }).populate({
      path: "idCommande",
      populate: [
        {
          path: "idClient",
          select: "firstname lastname email phoneNumber shippingInfo savedAddresses",
        },
        {
          path: "idPanier",
        },
        {
          path: "shop",
          select: "shopName shopLogo adresse shop_phone _id",
        },
      ],
    })

    if (!invoice) return res.status(404).json({ message: "Invoice for this order not found" })

    // Check that the invoice belongs to the user's shop
    const shopId = req.user.shopId
    if (invoice.idCommande && invoice.idCommande.shop && invoice.idCommande.shop._id.toString() !== shopId) {
      return res.status(403).json({
        message: "You are not authorized to access this invoice",
      })
    }

    res.status(200).json({ invoice })
  } catch (err) {
    res.status(500).json({ message: "Error retrieving invoice", error: err.message })
  }
}
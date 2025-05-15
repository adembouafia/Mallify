const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const Invoice = require("../models/invoice.model");
const Shop = require("../models/shop.model");
const Notification = require("../models/notification.model");
const Client = require("../models/client.model");
const Delivery = require("../models/delivery.model");

exports.createOrder = async (req, res) => {
  const { idPanier } = req.body;

  try {
    // Find the cart and populate product details
    const cart = await Cart.findById(idPanier).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: "Panier vide ou non trouvé" });
    }

    // Regrouper les items par shop
    const itemsByShop = {};

    cart.items.forEach((item) => {
      const product = item.productId;

      if (!product) {
        console.warn(`Produit introuvable: ${item.productId}`);
        return; // ignorer cet item
      }

      if (!product.shop) {
        console.warn(`Produit sans shopId: ${product._id}`);
        return; // ignorer cet item
      }

      const shopId = product.shop.toString();

      if (!itemsByShop[shopId]) {
        itemsByShop[shopId] = {
          items: [],
          total: 0,
          cartData: {
            clientId: cart.clientId,
            items: [],
            totalPrice: 0,
          },
        };
      }

      const quantity = item.quantity || 1;
      const price = product.productPrice || 0;

      // Store complete product data, not just the ID
      const productData = {
        _id: product._id,
        productId: product.productId,
        productName: product.productName,
        productPrice: product.productPrice,
        mainImage: product.mainImage,
        shop: product.shop,
      };

      // Add complete item data to the shop's items
      itemsByShop[shopId].items.push({
        productData: productData,
        quantity: quantity,
      });

      // Add to cart data as well (for complete cart data storage)
      itemsByShop[shopId].cartData.items.push({
        productId: productData,
        quantity: quantity,
      });

      itemsByShop[shopId].total += price * quantity;
      itemsByShop[shopId].cartData.totalPrice += price * quantity;
    });

    const orders = [];

    for (const [shopId, data] of Object.entries(itemsByShop)) {
      // Create order with complete cart data and set the orderStatus field
      const order = new Order({
        idPanier: cart._id,
        idClient: cart.clientId,
        shop: shopId,
        cartData: data.cartData, // Store complete cart data
        orderTotal: data.total,
        orderStatus: "pending", // Explicitly set the order status to 'pending'
      });

      await order.save();


      const populatedOrder = await Order.findById(order._id)
        .populate("idClient")
        .populate("shop");

      orders.push(populatedOrder);
    }

    // Clear the cart after successful order creation
    await Cart.findByIdAndDelete(cart._id);

    res.status(201).json({
      message: "Commandes créées avec succès",
      orders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur lors de la création des commandes",
      error: err.message,
    });
  }
};

// Get all orders
exports.getOrdersByShop = async (req, res) => {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      return res.status(400).json({
        message:
          "Shop ID manquant. Assurez-vous d'être authentifié(e) et que le token contient bien shopId.",
      });
    } // No need to populate idPanier since we have cartData
    // Récupérer toutes les commandes sans filtrer par statut
    const orders = await Order.find({
      shop: shopId,
    })
      .populate("idClient")
      .populate("shop");

    res.status(200).json({
      message: "Liste des commandes actives pour la boutique",
      orders,
    });
  } catch (err) {
    console.error("Erreur getOrdersByShop:", err);
    res.status(500).json({
      message: "Erreur lors de la récupération des commandes",
      error: err.message,
    });
  }
};

// Get order histories (completed or cancelled orders)
exports.getOrderHistoriesByShop = async (req, res) => {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      return res.status(400).json({
        message:
          "Shop ID manquant. Assurez-vous d'être authentifié(e) et que le token contient bien shopId.",
      });
    }

    // Récupérer uniquement les commandes terminées ou annulées
    const orders = await Order.find({
      shop: shopId,
      orderStatus: { $in: ["completed", "cancelled"] },
    })
      .populate("idClient")
      .populate("shop");

    res.status(200).json({
      message: "Historique des commandes pour la boutique",
      orders,
    });
  } catch (err) {
    console.error("Erreur getOrderHistoriesByShop:", err);
    res.status(500).json({
      message: "Erreur lors de la récupération de l'historique des commandes",
      error: err.message,
    });
  }
};

// Get order by id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("idClient");

    if (!order) {
      return res.status(404).json({
        message: "Commande non trouvée",
      });
    }

    res.status(200).json({
      message: "Commande trouvée",
      order,
    });
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la récupération de la commande",
      error: err.message,
    });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Commande non trouvée",
      });
    }

    res.status(200).json({
      message: "Commande supprimée avec succès",
    });
  } catch (err) {
    res.status(500).json({
      message: "Erreur suppression de la commande",
      error: err.message,
    });
  }
};

// Mettre à jour le statut d'une commande
exports.updateStatusOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, refusalReason } = req.body;

    if (
      ![
        "pending",
        "accepted",
        "completed",
        "cancelled",
        "non_returned",
        "shipped",
        "postponed",
      ].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Statut invalide. Les valeurs possibles sont: pending, accepted, completed, cancelled, non_returned, shipped, postponed",
      });
    }

    // Si le statut est "cancelled", une raison doit être fournie
    if (status === "cancelled" && !refusalReason) {
      return res.status(400).json({
        message: "Une raison de refus est requise pour annuler une commande",
      });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        message: "Commande non trouvée",
      });
    }

    // Si la commande est annulée, enregistrer la raison
    if (status === "cancelled") {
      order.refusalReason = refusalReason;
    }

    // Vérifier les autorisations (seul le vendeur de la boutique ou un modérateur/admin peut modifier)
    if (
      req.user.role === "vendor" &&
      order.shop.toString() !== req.user.shopId
    ) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier cette commande",
      });
    }

    // Si la commande passe de 'pending' à 'accepted', générer une facture
    if (status === "accepted" && order.orderStatus === "pending") {

      // Mettre à jour le stock des produits
      await updateProductStock(order);
    }

    // Mettre à jour le statut de la commande
    order.orderStatus = status;
    await order.save();

    res.status(200).json({
      message: "Statut de la commande mis à jour avec succès",
      order,
    });
  } catch (err) {
    console.error("Erreur updateStatusOrder:", err);
    res.status(500).json({
      message: "Erreur lors de la mise à jour du statut de la commande",
      error: err.message,
    });
  }
};

// Fonction pour mettre à jour le stock des produits et créer des notifications si nécessaire
async function updateProductStock(order) {
  try {
    // Vérifier si cartData existe et contient des items
    if (
      !order.cartData ||
      !order.cartData.items ||
      order.cartData.items.length === 0
    ) {
      console.warn("Pas d'items dans la commande pour mettre à jour le stock");
      return;
    }

    const shopId = order.shop;
    const shop = await Shop.findById(shopId);

    if (!shop) {
      console.warn(`Boutique non trouvée: ${shopId}`);
      return;
    }

    const stockLimit = shop.stockLimit || 0;

    // Parcourir tous les produits de la commande
    for (const item of order.cartData.items) {
      const productId = item.productId._id;
      const quantity = item.quantity || 1;

      // Récupérer le produit actuel
      const product = await Product.findById(productId);

      if (!product) {
        console.warn(`Produit non trouvé: ${productId}`);
        continue;
      }

      // Mettre à jour le stock
      const newStock = Math.max(0, product.stock - quantity);
      product.stock = newStock;

      // Mettre à jour la disponibilité si nécessaire
      if (newStock === 0) {
        product.availability = "Out of stock";
      }

      await product.save();

      // Vérifier si le stock est inférieur ou égal à la limite
      if (newStock <= stockLimit) {
        // Créer une notification
        const notificationMessage = `Le stock du produit "${product.productName}" est bas (${newStock} restants)`;

        // Afficher la notification dans la console
        console.log("=== NOTIFICATION CRÉÉE ===");
        console.log(`Shop ID: ${shopId}`);
        console.log(`Product ID: ${product._id}`);
        console.log(`Message: ${notificationMessage}`);
        console.log("=========================");

        // Créer la notification dans la base de données
        await Notification.create({
          productId: product._id,
          shopId: shopId,
          message: notificationMessage,
        });
      }
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du stock:", error);
    throw error;
  }
}

//get all orders for a client
exports.getOrdersByClientId = async (req, res) => {
  try {
    const clientId = req.params.id;
    const orders = await Order.find({ idClient: clientId })
      .populate("idClient")
      .sort({ createdAt: -1 });

    res.status(200).send(orders);
  } catch (err) {
    console.error("Error fetching client orders:", err);
    res.status(500).send({
      message: err.message || "Error retrieving orders for this client",
    });
  }
};

// Modifier la fonction makeToShip pour créer automatiquement une livraison
exports.makeToShip = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Find the order
    const order = await Order.findById(orderId).populate("idClient");
    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée" });
    }

    // Check if order is in accepted status
    if (order.orderStatus !== "accepted") {
      return res.status(400).json({
        message:
          "La commande doit être acceptée avant de pouvoir être expédiée",
        currentStatus: order.orderStatus,
      });
    }

    // Create invoice if it doesn't exist
    let invoice = await Invoice.findOne({ idCommande: orderId });
    if (!invoice) {
      invoice = new Invoice({
        idCommande: orderId,
        montantTotal: order.orderTotal,
        statutPaiement: "unpaid",
      });
      await invoice.save();
    }

    // Update order status to shipped
    order.orderStatus = "shipped";
    await order.save();

    // Créer automatiquement une livraison
    const client = await Client.findById(order.idClient);
    if (!client) {
      return res.status(404).json({
        message: "Client non trouvé",
      });
    }

    // Déterminer l'adresse de livraison
    let deliveryAddress = "";
    if (client.shippingInfo && client.shippingInfo.address) {
      deliveryAddress = `${client.shippingInfo.address}, ${client.shippingInfo.city}, ${client.shippingInfo.governorate}, ${client.shippingInfo.postCode}`;
    } else if (client.shippingAddresses && client.shippingAddresses.length > 0) {
      const defaultAddress = client.shippingAddresses.find((addr) => addr.isDefault) || client.shippingAddresses[0];
      deliveryAddress = `${defaultAddress.address}, ${defaultAddress.city}, ${defaultAddress.governorate}, ${defaultAddress.postCode}`;
    } else if (client.defaultShippingInfo) {
      deliveryAddress = `${client.defaultShippingInfo.address}, ${client.defaultShippingInfo.city}, ${client.defaultShippingInfo.governorate}, ${client.defaultShippingInfo.postCode}`;
    } else {
      deliveryAddress = "Adresse non spécifiée";
    }

    // Créer la livraison
    const newDelivery = new Delivery({
      idCommande: orderId,
      idClient: order.idClient,
      deliveryAdresse: deliveryAddress,
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Date de livraison estimée à 3 jours
      statut: "InProgress",
      clientInfo: {
        nom: client.lastname,
        prenom: client.firstname,
      },
    });

    const savedDelivery = await newDelivery.save();

    // Return success response with created data
    res.status(200).json({
      message: "Commande passée en statut expédiée et livraison créée",
      order,
      invoice,
      delivery: savedDelivery,
    });
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors du traitement de la commande",
      error: err.message,
    });
  }
};
const Delivery = require("../models/delivery.model")
const Client = require("../models/client.model")
const Order = require("../models/order.model")
const Invoice = require("../models/invoice.model")
const Notification = require("../models/notification.model")

// Vérifier et mettre à jour automatiquement les livraisons reportées
exports.checkPostponedDeliveries = async (shopId = null) => {
  try {
    const currentDate = new Date()

    // Critères de recherche pour les commandes reportées
    const findCriteria = {
      orderStatus: "postponed",
      postponedDate: { $lte: currentDate },
    }

    // Si un shopId est fourni, ajouter ce critère à la recherche
    if (shopId) {
      findCriteria.shop = shopId
    }

    // Trouver toutes les commandes avec le statut "postponed" dont la date de report est atteinte ou dépassée
    // et qui appartiennent au shop spécifié (si fourni)
    const postponedOrders = await Order.find(findCriteria)

    console.log(`Nombre de commandes reportées à traiter: ${postponedOrders.length}`)

    if (postponedOrders.length === 0) {
      return {
        message: "Aucune livraison reportée à mettre à jour",
        updated: 0,
      }
    }

    let updatedCount = 0

    // Pour chaque commande reportée dont la date est atteinte
    for (const order of postponedOrders) {
      // Trouver la livraison associée à cette commande
      const delivery = await Delivery.findOne({ idCommande: order._id })

      if (delivery && delivery.statut === "Postponed") {
        // Mettre à jour le statut de la livraison à "InProgress"
        await delivery.editStatut("InProgress")

        // Mettre à jour le statut de la commande à "shipped"
        await Order.findByIdAndUpdate(order._id, {
          orderStatus: "shipped",
          postponedDate: null, // Réinitialiser la date de report
        })

        updatedCount++
        console.log(`Livraison ${delivery._id} mise à jour automatiquement de Postponed à InProgress`)
      }
    }

    return {
      message: `${updatedCount} livraisons reportées ont été mises à jour automatiquement`,
      updated: updatedCount,
    }
  } catch (err) {
    console.error("Erreur lors de la vérification des livraisons reportées:", err)
    return {
      message: "Erreur lors de la vérification des livraisons reportées",
      error: err.message,
    }
  }
}

// Endpoint pour vérifier manuellement les livraisons reportées
exports.checkPostponedDeliveriesEndpoint = async (req, res) => {
  try {
    // Récupérer le shopId depuis la requête
    const shopId = req.query.shopId

    if (!shopId) {
      return res.status(400).json({
        message: "Le paramètre shopId est requis",
      })
    }

    console.log(`Vérification des livraisons reportées pour le shop: ${shopId}`)

    const result = await exports.checkPostponedDeliveries(shopId)
    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({
      message: "Erreur lors de la vérification des livraisons reportées",
      error: err.message,
    })
  }
}

// Créer une nouvelle livraison
exports.createDelivery = async (req, res) => {
  try {
    const { idCommande, idClient, deliveryAdresse, deliveryDate } = req.body

    const client = await Client.findById(idClient)
    if (!client)
      return res.status(404).json({
        message: "Client non trouvé",
      })

    const newDelivery = new Delivery({
      idCommande,
      idClient,
      deliveryAdresse,
      deliveryDate,
      statut: "InProgress",
      clientInfo: {
        nom: client.lastname,
        prenom: client.firstname,
      },
    })

    const savedDelivery = await newDelivery.save()

    // Mettre à jour le statut de la commande
    await Order.findByIdAndUpdate(idCommande, { orderStatus: "shipped" })

    res.status(201).json({
      message: "Livraison créée avec succès",
      Delivery: savedDelivery,
      clientInfo: {
        nom: client.lastname,
        prenom: client.firstname,
      },
    })
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la création de la Delivery",
      error: err.message,
    })
  }
}

// Obtenir toutes les livraisons
exports.getAllDeliveries = async (req, res) => {
  try {
    // Vérifier d'abord les livraisons reportées
    await exports.checkPostponedDeliveries()

    // Récupérer le shopId depuis l'utilisateur authentifié
    const shopId = req.user.shopId

    if (!shopId) {
      return res.status(400).json({
        message: "Shop ID non trouvé dans le token d'authentification",
      })
    }

    console.log(`Recherche des livraisons pour le shop: ${shopId}`)

    // Utiliser populate avec plus de profondeur pour obtenir les détails de la commande
    // et filtrer par shopId
    const deliveries = await Delivery.find()
      .populate({
        path: "idClient",
        select: "firstname lastname email phoneNumber",
      })
      .populate({
        path: "idCommande",
        select: "orderTotal cartData orderStatus shop",
        populate: {
          path: "shop",
          select: "name _id",
        },
      })

    // Filtrer les livraisons qui correspondent au shopId spécifié
    const filteredDeliveries = deliveries.filter(
      (delivery) =>
        delivery.idCommande && delivery.idCommande.shop && delivery.idCommande.shop._id.toString() === shopId,
    )
    console.log(`Livraisons trouvées pour ce shop: ${filteredDeliveries.length}`)

    res.status(200).json(filteredDeliveries)
  } catch (err) {
    console.error("Erreur lors de la récupération des livraisons:", err)
    res.status(500).json({
      message: "Erreur lors de la récupération des livraisons",
      error: err.message,
    })
  }
}

// Obtenir une livraison par ID
exports.getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate("idClient")
      .populate({
        path: "idCommande",
        populate: {
          path: "shop",
          select: "name _id",
        },
      })

    if (!delivery) {
      return res.status(404).json({
        message: "Livraison non trouvée",
      })
    }

    // Vérifier que la livraison appartient au shop de l'utilisateur
    const shopId = req.user.shopId
    if (delivery.idCommande && delivery.idCommande.shop && delivery.idCommande.shop._id.toString() !== shopId) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à accéder à cette livraison",
      })
    }

    res.status(200).json(delivery)
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la récupération de la livraison",
      error: err.message,
    })
  }
}

// Mettre à jour le statut d'une livraison
exports.updateDeliveryStatut = async (req, res) => {
  try {
    const { newStatut, postponedDate } = req.body
    const delivery = await Delivery.findById(req.params.id).populate({
      path: "idCommande",
      populate: {
        path: "shop",
        select: "_id",
      },
    })

    if (!delivery) {
      return res.status(404).json({
        message: "Livraison non trouvée",
      })
    }

    // Vérifier que la livraison appartient au shop de l'utilisateur
    const shopId = req.user.shopId
    if (delivery.idCommande && delivery.idCommande.shop && delivery.idCommande.shop._id.toString() !== shopId) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier cette livraison",
      })
    }

    // Mettre à jour le statut de la livraison
    await delivery.editStatut(newStatut)

    // Récupérer la commande associée
    const order = await Order.findById(delivery.idCommande)
    if (!order) {
      return res.status(404).json({
        message: "Commande associée non trouvée",
      })
    }

    // Récupérer la facture associée
    const invoice = await Invoice.findOne({ idCommande: delivery.idCommande })

    // Récupérer le client
    const client = await Client.findById(delivery.idClient)
    const clientName = client ? `${client.firstname} ${client.lastname}` : "Client"

    // Créer une notification pour le changement de statut de livraison
    let notificationMessage = ""

    // Traiter selon le statut
    switch (newStatut) {
      case "Delivered":
        // Mettre à jour le statut de la commande
        await Order.findByIdAndUpdate(delivery.idCommande, {
          orderStatus: "completed",
        })

        // Mettre à jour le statut de la facture
        if (invoice) {
          await Invoice.findByIdAndUpdate(invoice._id, {
            statutPaiement: "paid",
          })
        }

        notificationMessage = `La livraison pour la commande #${order._id.toString().slice(-6)} de ${clientName} a été marquée comme livrée.`
        break

      case "Cancelled":
        // Mettre à jour le statut de la commande
        await Order.findByIdAndUpdate(delivery.idCommande, {
          orderStatus: "cancelled",
        })

        // Restaurer le stock des produits
        await restoreProductStock(order)

        // Supprimer la facture si elle existe
        if (invoice) {
          await Invoice.findByIdAndDelete(invoice._id)
        }

        notificationMessage = `La livraison pour la commande #${order._id.toString().slice(-6)} de ${clientName} a été annulée.`
        break

      case "Postponed":
        if (!postponedDate)
          return res.status(400).json({
            message: "Date de report requise pour une livraison reportée",
          })

        // Mettre à jour la commande avec le statut reporté et la nouvelle date
        await Order.findByIdAndUpdate(delivery.idCommande, {
          orderStatus: "postponed",
          postponedDate: new Date(postponedDate),
        })

        const formattedDate = new Date(postponedDate).toLocaleDateString()
        notificationMessage = `La livraison pour la commande #${order._id.toString().slice(-6)} de ${clientName} a été reportée au ${formattedDate}.`
        break

      default:
        notificationMessage = `Le statut de la livraison pour la commande #${order._id.toString().slice(-6)} a été mis à jour vers ${newStatut}.`
    }

    // Créer la notification
    if (notificationMessage) {
      await Notification.create({
        shopId: order.shop,
        orderId: order._id,
        clientId: delivery.idClient,
        type: "delivery",
        message: notificationMessage,
      })
    }

    res.status(200).json({
      message: "Statut mis à jour avec succès",
      updatedDelivery: delivery,
    })
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la mise à jour du statut",
      error: err.message,
    })
  }
}

// Supprimer une livraison
exports.deleteDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate({
      path: "idCommande",
      populate: {
        path: "shop",
        select: "_id",
      },
    })

    if (!delivery) {
      return res.status(404).json({
        message: "Livraison non trouvée",
      })
    }

    // Vérifier que la livraison appartient au shop de l'utilisateur
    const shopId = req.user.shopId
    if (delivery.idCommande && delivery.idCommande.shop && delivery.idCommande.shop._id.toString() !== shopId) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à supprimer cette livraison",
      })
    }

    const deletedDelivery = await Delivery.findByIdAndDelete(req.params.id)
    res.status(200).json({
      message: "Livraison supprimée avec succès",
    })
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la suppression de la livraison",
      error: err.message,
    })
  }
}

// Fonction pour restaurer le stock des produits lors de l'annulation d'une livraison
async function restoreProductStock(order) {
  try {
    // Vérifier si cartData existe et contient des items
    if (!order.cartData || !order.cartData.items || order.cartData.items.length === 0) {
      console.warn("Pas d'items dans la commande pour restaurer le stock")
      return
    }

    const Product = require("../models/product.model")

    // Parcourir tous les produits de la commande
    for (const item of order.cartData.items) {
      const productId = item.productId._id
      const quantity = item.quantity || 1

      // Récupérer le produit actuel
      const product = await Product.findById(productId)

      if (!product) {
        console.warn(`Produit non trouvé: ${productId}`)
        continue
      }

      console.log(`Restauration du stock pour le produit ${product.productName}: ${product.stock} + ${quantity}`)

      // Mettre à jour le stock (ajouter la quantité)
      product.stock = product.stock + quantity

      // Mettre à jour la disponibilité si nécessaire
      if (product.stock > 0 && product.availability === "Out of stock") {
        product.availability = "In stock"
      }

      await product.save()
      console.log(`Nouveau stock pour le produit ${product.productName}: ${product.stock}`)
    }
  } catch (error) {
    console.error("Erreur lors de la restauration du stock:", error)
    throw error
  }
}

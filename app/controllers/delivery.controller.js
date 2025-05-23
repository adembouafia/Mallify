const Delivery = require("../models/delivery.model")
const Client = require("../models/client.model")
const Order = require("../models/order.model")
const Invoice = require("../models/invoice.model")
const Notification = require("../models/notification.model")

// Check and automatically update postponed deliveries
exports.checkPostponedDeliveries = async (shopId = null) => {
  try {
    const currentDate = new Date()

    // Search criteria for postponed orders
    const findCriteria = {
      orderStatus: "postponed",
      postponedDate: { $lte: currentDate },
    }

    // If a shopId is provided, add this criterion to the search
    if (shopId) {
      findCriteria.shop = shopId
    }

    // Find all orders with "postponed" status whose postponement date has been reached or passed
    // and that belong to the specified shop (if provided)
    const postponedOrders = await Order.find(findCriteria)

    console.log(`Number of postponed orders to process: ${postponedOrders.length}`)

    if (postponedOrders.length === 0) {
      return {
        message: "No postponed deliveries to update",
        updated: 0,
      }
    }

    let updatedCount = 0

    // For each postponed order whose date has been reached
    for (const order of postponedOrders) {
      // Find the delivery associated with this order
      const delivery = await Delivery.findOne({ idCommande: order._id })

      if (delivery && delivery.statut === "Postponed") {
        // Update the delivery status to "InProgress"
        await delivery.editStatut("InProgress")

        // Update the order status to "shipped"
        await Order.findByIdAndUpdate(order._id, {
          orderStatus: "shipped",
          postponedDate: null, // Reset the postponement date
        })

        updatedCount++
        console.log(`Delivery ${delivery._id} automatically updated from Postponed to InProgress`)
      }
    }

    return {
      message: `${updatedCount} postponed deliveries have been automatically updated`,
      updated: updatedCount,
    }
  } catch (err) {
    console.error("Error checking postponed deliveries:", err)
    return {
      message: "Error checking postponed deliveries",
      error: err.message,
    }
  }
}

// Endpoint to manually check postponed deliveries
exports.checkPostponedDeliveriesEndpoint = async (req, res) => {
  try {
    // Get shopId from the request
    const shopId = req.query.shopId

    if (!shopId) {
      return res.status(400).json({
        message: "The shopId parameter is required",
      })
    }

    console.log(`Checking postponed deliveries for shop: ${shopId}`)

    const result = await exports.checkPostponedDeliveries(shopId)
    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({
      message: "Error checking postponed deliveries",
      error: err.message,
    })
  }
}

// Create a new delivery
exports.createDelivery = async (req, res) => {
  try {
    const { idCommande, idClient, deliveryAdresse, deliveryDate } = req.body

    const client = await Client.findById(idClient)
    if (!client)
      return res.status(404).json({
        message: "Client not found",
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

    // Update the order status
    await Order.findByIdAndUpdate(idCommande, { orderStatus: "shipped" })

    res.status(201).json({
      message: "Delivery created successfully",
      Delivery: savedDelivery,
      clientInfo: {
        nom: client.lastname,
        prenom: client.firstname,
      },
    })
  } catch (err) {
    res.status(500).json({
      message: "Error creating the Delivery",
      error: err.message,
    })
  }
}

// Get all deliveries
exports.getAllDeliveries = async (req, res) => {
  try {
    // First check postponed deliveries
    await exports.checkPostponedDeliveries()

    // Get shopId from authenticated user
    const shopId = req.user.shopId

    if (!shopId) {
      return res.status(400).json({
        message: "Shop ID not found in authentication token",
      })
    }

    console.log(`Searching for deliveries for shop: ${shopId}`)

    // Use populate with more depth to get order details
    // and filter by shopId
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

    // Filter deliveries that match the specified shopId
    const filteredDeliveries = deliveries.filter(
      (delivery) =>
        delivery.idCommande && delivery.idCommande.shop && delivery.idCommande.shop._id.toString() === shopId,
    )
    console.log(`Deliveries found for this shop: ${filteredDeliveries.length}`)

    res.status(200).json(filteredDeliveries)
  } catch (err) {
    console.error("Error retrieving deliveries:", err)
    res.status(500).json({
      message: "Error retrieving deliveries",
      error: err.message,
    })
  }
}

// Get a delivery by ID
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
        message: "Delivery not found",
      })
    }

    // Check that the delivery belongs to the user's shop
    const shopId = req.user.shopId
    if (delivery.idCommande && delivery.idCommande.shop && delivery.idCommande.shop._id.toString() !== shopId) {
      return res.status(403).json({
        message: "You are not authorized to access this delivery",
      })
    }

    res.status(200).json(delivery)
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving the delivery",
      error: err.message,
    })
  }
}

// Update a delivery status
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
        message: "Delivery not found",
      })
    }

    // Check that the delivery belongs to the user's shop
    const shopId = req.user.shopId
    if (delivery.idCommande && delivery.idCommande.shop && delivery.idCommande.shop._id.toString() !== shopId) {
      return res.status(403).json({
        message: "You are not authorized to modify this delivery",
      })
    }

    // Update the delivery status
    await delivery.editStatut(newStatut)

    // Get the associated order
    const order = await Order.findById(delivery.idCommande)
    if (!order) {
      return res.status(404).json({
        message: "Associated order not found",
      })
    }

    // Get the associated invoice
    const invoice = await Invoice.findOne({ idCommande: delivery.idCommande })

    // Get the client
    const client = await Client.findById(delivery.idClient)
    const clientName = client ? `${client.firstname} ${client.lastname}` : "Client"

    // Create a notification for the delivery status change
    let notificationMessage = ""

    // Process according to status
    switch (newStatut) {
      case "Delivered":
        // Update the order status
        await Order.findByIdAndUpdate(delivery.idCommande, {
          orderStatus: "completed",
        })

        // Update the invoice status
        if (invoice) {
          await Invoice.findByIdAndUpdate(invoice._id, {
            statutPaiement: "paid",
          })
        }

        notificationMessage = `The delivery for order #${order._id.toString().slice(-6)} from ${clientName} has been marked as delivered.`
        break

      case "Cancelled":
        // Update the order status
        await Order.findByIdAndUpdate(delivery.idCommande, {
          orderStatus: "cancelled",
        })

        // Restore product stock
        await restoreProductStock(order)

        // Delete the invoice if it exists
        if (invoice) {
          await Invoice.findByIdAndDelete(invoice._id)
        }

        notificationMessage = `The delivery for order #${order._id.toString().slice(-6)} from ${clientName} has been cancelled.`
        break

      case "Postponed":
        if (!postponedDate)
          return res.status(400).json({
            message: "Postponement date required for a postponed delivery",
          })

        // Update the order with the postponed status and new date
        await Order.findByIdAndUpdate(delivery.idCommande, {
          orderStatus: "postponed",
          postponedDate: new Date(postponedDate),
        })

        const formattedDate = new Date(postponedDate).toLocaleDateString()
        notificationMessage = `The delivery for order #${order._id.toString().slice(-6)} from ${clientName} has been postponed to ${formattedDate}.`
        break

      default:
        notificationMessage = `The delivery status for order #${order._id.toString().slice(-6)} has been updated to ${newStatut}.`
    }

    // Create the notification
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
      message: "Status updated successfully",
      updatedDelivery: delivery,
    })
  } catch (err) {
    res.status(500).json({
      message: "Error updating status",
      error: err.message,
    })
  }
}

// Delete a delivery
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
        message: "Delivery not found",
      })
    }

    // Check that the delivery belongs to the user's shop
    const shopId = req.user.shopId
    if (delivery.idCommande && delivery.idCommande.shop && delivery.idCommande.shop._id.toString() !== shopId) {
      return res.status(403).json({
        message: "You are not authorized to delete this delivery",
      })
    }

    const deletedDelivery = await Delivery.findByIdAndDelete(req.params.id)
    res.status(200).json({
      message: "Delivery deleted successfully",
    })
  } catch (err) {
    res.status(500).json({
      message: "Error deleting the delivery",
      error: err.message,
    })
  }
}

// Function to restore product stock when cancelling a delivery
async function restoreProductStock(order) {
  try {
    // Check if cartData exists and contains items
    if (!order.cartData || !order.cartData.items || order.cartData.items.length === 0) {
      console.warn("No items in the order to restore stock")
      return
    }

    const Product = require("../models/product.model")

    // Go through all products in the order
    for (const item of order.cartData.items) {
      const productId = item.productId._id
      const quantity = item.quantity || 1

      // Get the current product
      const product = await Product.findById(productId)

      if (!product) {
        console.warn(`Product not found: ${productId}`)
        continue
      }

      console.log(`Restoring stock for product ${product.productName}: ${product.stock} + ${quantity}`)

      // Update the stock (add the quantity)
      product.stock = product.stock + quantity

      // Update availability if necessary
      if (product.stock > 0 && product.availability === "Out of stock") {
        product.availability = "In stock"
      }

      await product.save()
      console.log(`New stock for product ${product.productName}: ${product.stock}`)
    }
  } catch (error) {
    console.error("Error restoring stock:", error)
    throw error
  }
}
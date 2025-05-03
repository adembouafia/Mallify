const Cart = require("../models/cart.model")
const Product = require("../models/product.model")
const Order = require("../models/order.model")
const Invoice = require("../models/invoice.model")

exports.createOrder = async (req, res) => {
  const { idPanier } = req.body

  try {
    // Find the cart and populate product details
    const cart = await Cart.findById(idPanier).populate("items.productId")

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: "Panier vide ou non trouvé" })
    }

    // Regrouper les items par shop
    const itemsByShop = {}

    cart.items.forEach((item) => {
      const product = item.productId

      if (!product) {
        console.warn(`Produit introuvable: ${item.productId}`)
        return // ignorer cet item
      }

      if (!product.shop) {
        console.warn(`Produit sans shopId: ${product._id}`)
        return // ignorer cet item
      }

      const shopId = product.shop.toString()

      if (!itemsByShop[shopId]) {
        itemsByShop[shopId] = {
          items: [],
          total: 0,
          cartData: {
            clientId: cart.clientId,
            items: [],
            totalPrice: 0,
          },
        }
      }

      const quantity = item.quantity || 1
      const price = product.productPrice || 0

      // Store complete product data, not just the ID
      const productData = {
        _id: product._id,
        productName: product.productName,
        productPrice: product.productPrice,
        mainImage: product.mainImage,
        shop: product.shop,
        // Add any other product fields you need
      }

      // Add complete item data to the shop's items
      itemsByShop[shopId].items.push({
        productData: productData,
        quantity: quantity,
      })

      // Add to cart data as well (for complete cart data storage)
      itemsByShop[shopId].cartData.items.push({
        productId: productData,
        quantity: quantity,
      })

      itemsByShop[shopId].total += price * quantity
      itemsByShop[shopId].cartData.totalPrice += price * quantity
    })

    const orders = []
    const invoices = []

    for (const [shopId, data] of Object.entries(itemsByShop)) {
      // Create order with complete cart data
      const order = new Order({
        idPanier: cart._id,
        idClient: cart.clientId,
        shop: shopId,
        cartData: data.cartData, // Store complete cart data
        orderTotal: data.total,
      })

      await order.save()

      const invoice = new Invoice({
        idCommande: order._id,
        montantTotal: data.total,
        shop: shopId,
        idClient: cart.clientId,
      })

      await invoice.save()

      const populatedOrder = await Order.findById(order._id).populate("idClient").populate("shop")

      orders.push(populatedOrder)
      invoices.push(invoice)
    }

    // Clear the cart after successful order creation
    await Cart.findByIdAndDelete(cart._id)

    res.status(201).json({
      message: "Commandes créées avec succès",
      orders,
      invoices,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Erreur lors de la création des commandes",
      error: err.message,
    })
  }
}

// Get all orders
exports.getOrdersByShop = async (req, res) => {
  try {
    const shopId = req.user?.shopId
    if (!shopId) {
      return res.status(400).json({
        message: "Shop ID manquant. Assurez-vous d'être authentifié(e) et que le token contient bien shopId.",
      })
    }

    // No need to populate idPanier since we have cartData
    const orders = await Order.find({ shop: shopId }).populate("idClient").populate("shop")

    res.status(200).json({
      message: "Liste des commandes pour la boutique",
      orders,
    })
  } catch (err) {
    console.error("Erreur getOrdersByShop:", err)
    res.status(500).json({
      message: "Erreur lors de la récupération des commandes",
      error: err.message,
    })
  }
}

// Get order by id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("idClient")

    if (!order) {
      return res.status(404).json({
        message: "Commande non trouvée",
      })
    }

    res.status(200).json({
      message: "Commande trouvée",
      order,
    })
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la récupération de la commande",
      error: err.message,
    })
  }
}

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id)

    if (!order) {
      return res.status(404).json({
        message: "Commande non trouvée",
      })
    }

    res.status(200).json({
      message: "Commande supprimée avec succès",
    })
  } catch (err) {
    res.status(500).json({
      message: "Erreur suppression de la commande",
      error: err.message,
    })
  }
}


//get all orders for a client
exports.getOrdersByClientId = async (req, res) => {
  try {
    const clientId = req.params.id;    
    const orders = await Order.find({ client: clientId })
      .populate('products.product')
      .sort({ createdAt: -1 });     
    
    res.status(200).send(orders);
    
  } catch (err) {
    console.error('Error fetching client orders:', err);
    res.status(500).send({ message: err.message || "Error retrieving orders for this client" });
  }
};

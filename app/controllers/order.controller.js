const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const Invoice = require("../models/invoice.model");



exports.createOrder = async (req, res) => {
    const { idPanier } = req.body;

    try {
        const cart = await Cart.findById(idPanier);
        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ message: 'Panier vide ou non trouvé' });
        }

        // Récupération des produits du panier
        const productIds = cart.items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });

        // Regrouper les items par shop
        const itemsByShop = {};

        cart.items.forEach(item => {
            const product = products.find(p => p._id.toString() === item.productId.toString());

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
                    total: 0
                };
            }

            const quantity = item.quantity || 1;
            const price = product.price || 0;

            itemsByShop[shopId].items.push(item);
            itemsByShop[shopId].total += price * quantity;
        });

        const orders = [];
        const invoices = [];

        for (const [shopId, data] of Object.entries(itemsByShop)) {
            const order = new Order({
                idPanier: cart._id,
                idClient: cart.clientId,
                shop: shopId
            });

            await order.save();

            const invoice = new Invoice({
                idCommande: order._id,
                montantTotal: data.total,
                shop: shopId,
                idClient: cart.clientId
            });

            await invoice.save();

            const populatedOrder = await Order.findById(order._id)
                .populate('idPanier')
                .populate('idClient')
                .populate('shop');

            orders.push(populatedOrder);
            invoices.push(invoice);
        }

        res.status(201).json({
            message: 'Commandes créées avec succès',
            orders,
            invoices
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Erreur lors de la création des commandes',
            error: err.message
        });
    }
};



//get all orders
exports.getOrdersByShop = async (req, res) => {
    try {
        const shopId = req.user?.shopId;
        if (!shopId) {
            return res.status(400).json({
            message: "Shop ID manquant. Assurez-vous d'être authentifié(e) et que le token contient bien shopId."
            });
        }
        const orders = await Order
            .find({ shop: shopId })
            .populate({
                path: 'idPanier',
                populate: {
                    path: 'items.productId', // populate the product in the items
                    model: 'Product'
                }
            })
            .populate('idClient')
            .populate('shop');

        res.status(200).json({
            message: 'Liste des commandes pour la boutique',
            orders
        });
        } catch (err) {
        console.error("Erreur getOrdersByShop:", err);
        res.status(500).json({
            message: 'Erreur lors de la récupération des commandes',
            error: err.message
        });
    }
};



//get order by id
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        .populate('idPanier')
        .populate('idClient');
        if (!order) {
            return res.status(404).json({ 
                message: 'Commande non trouvée' 
            });
        }
        res.status(200).json({ 
            message: 'Commande trouvée', 
            order 
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Erreur lors de la récupération de la commande', 
            error: err.message 
        });
    }
};


//delete order
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id).populate('idPanier').populate('idClient');
        if (!order) {
            return res.status(404).json({ 
                message: 'Commande non trouvée' 
            });
        }
        res.status(200).json({ 
            message: 'Commande supprimée avec succès' 
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Erreur suppression de la commande', 
            error: err.message 
        });
    }
};

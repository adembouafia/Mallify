const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Invoice = require('../models/invoice.model');


//creation de commende
exports.createOrder = async (req, res) => {
    const { idPanier } = req.body;
    try {
        const cart = await Cart.findById(idPanier);
        if (!cart) {
            return res.status(404).json({ 
                message: 'Panier non trouvé' 
            });
        }

        const order = new Order({
            idPanier: cart._id,
            idClient: cart.clientId
        });

        await order.save();

        const invoice = new Invoice({
            idCommande: order._id,
            montantTotal: cart.totalPrice
        });

        await invoice.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('idPanier')
            .populate('idClient');

        // cart.items = [];
        // await cart.save();

        res.status(201).json({ 
            message: 'Commande créée avec succès', 
            order : populatedOrder,
            invoice
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            message: 'Erreur lors de la création de la commande', 
            error: err.message 
        });
    }
};


//get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('idPanier').populate('idClient');
        res.status(200).json({ 
            message: 'Liste des commandes', 
            orders 
        });
    } catch (err) {
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

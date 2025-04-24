const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// Ajout d'un produit au panier
exports.addToCart = async (req, res) => {
    const { clientId, productId, quantity } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Produit non trouvé" });
        }

        let cart = await Cart.findOne({ clientId });

        if (!cart) {
            cart = new Cart({ clientId, items: [{ productId, quantity }] });
        } else {
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ productId, quantity });
            }
        }

        // Calcul du total avant enregistrement
        let total = 0;
        for (const item of cart.items) {
            const prod = item.productId.equals(productId) ? product : await Product.findById(item.productId);
            total += prod.productPrice * item.quantity;
        }
        cart.totalPrice = total;

        await cart.save();

        cart = await Cart.findById(cart._id).populate('items.productId');

        res.status(200).json({
            cart,
            totalPrice: cart.totalPrice
        });
    } catch (err) {
        res.status(500).json({ message: "Erreur ajout panier", error: err.message });
    }
};


// Supprimer un produit du panier
exports.removeFromCart = async (req, res) => {
    const { clientId, productId } = req.body;

    try {
        let cart = await Cart.findOne({ clientId });
        if (!cart) return res.status(404).json({ message: "Panier non trouvé" });

        // Supprimer l'item
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        // Recalculer le total
        let total = 0;
        for (const item of cart.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                total += product.productPrice * item.quantity;
            }
        }
        cart.totalPrice = total;

        await cart.save();
        cart = await Cart.findById(cart._id).populate('items.productId');

        res.status(200).json({
            message: "Produit supprimé du panier",
            cart,
            totalPrice: cart.totalPrice
        });
    } catch (err) {
        res.status(500).json({ message: "Erreur suppression produit du panier", error: err.message });
    }
};

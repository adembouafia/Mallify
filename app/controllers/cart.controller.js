const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

// Add a product to the cart
exports.addToCart = async (req, res) => {
    const { clientId, productId, quantity } = req.body;

    if (!clientId || !productId || typeof quantity !== 'number') {
        return res.status(400).json({ message: "Missing or invalid fields." });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
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

        // Calculate total before saving
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
        res.status(500).json({ message: "Error adding to cart", error: err.message });
    }
};

// Remove a product from the cart
exports.removeFromCart = async (req, res) => {
    const { clientId, productId } = req.body;

    try {
        let cart = await Cart.findOne({ clientId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        // Remove the item
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        // Recalculate the total
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
            message: "Product removed from cart",
            cart,
            totalPrice: cart.totalPrice
        });
    } catch (err) {
        res.status(500).json({ message: "Error removing product from cart", error: err.message });
    }
};
// Get cart items for a client
exports.getCart = async (req, res) => {
    const { clientId } = req.params;

    try {
        let cart = await Cart.findOne({ clientId }).populate('items.productId');
        
        if (!cart) {
            return res.status(200).json({ 
                cart: { items: [] },
                totalPrice: 0
            });
        }

        res.status(200).json({
            cart,
            totalPrice: cart.totalPrice
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching cart", error: err.message });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    const { clientId, productId, quantity } = req.body;

    try {
        let cart = await Cart.findOne({ clientId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) return res.status(404).json({ message: "Item not found in cart" });

        // Update quantity
        cart.items[itemIndex].quantity = quantity;

        // Recalculate total
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
            message: "Cart updated successfully",
            cart,
            totalPrice: cart.totalPrice
        });
    } catch (err) {
        res.status(500).json({ message: "Error updating cart", error: err.message });
    }
};


//clear cart
exports.clearCart = async (req, res) => {
    const { clientId } = req.params;

    try {
        const deletedCart = await Cart.findOneAndDelete({ idClient: clientId });

        if (!deletedCart) {
            return res.status(404).json({
                message: "No cart found for this client"
            });
        }

        res.status(200).json({
            message: "Cart deleted successfully",
            cart: deletedCart
        });
    } catch (error) {
        res.status(500).json({
            message: "Error while deleting cart",
            error: error.message
        });
    }
};
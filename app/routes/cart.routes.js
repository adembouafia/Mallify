module.exports = (app) => {
    const cart = require("../controllers/cart.controller");

    app.post('/cart/add', cart.addToCart);
    app.delete('/cart/remove', cart.removeFromCart);
    app.get('/cart/:clientId', cart.getCart);
    app.put('/cart/update', cart.updateCartItem);
}
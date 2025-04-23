module.exports = (app) => {
    const cart = require("../controllers/cart.controller");

    app.post('/cart/add', cart.addToCart);
    app.delete('/cart/remove', cart.removeFromCart);
}
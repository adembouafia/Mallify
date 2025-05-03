const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const order = require("../controllers/order.controller");
    app.post('/order/create', auth, order.createOrder);
    app.get('/order', auth, order.getOrdersByShop);
    app.get('/order/:id', auth, order.getOrderById);
    app.delete('/order/delete/:id', auth, authorize('vendor', 'moderator'), order.deleteOrder);
    app.get('/client/:id/orders',auth,order.getOrdersByClientId);
};

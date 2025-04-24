// routes/order.routes.js
module.exports = (app) => {
    const order = require("../controllers/order.controller");

    app.post('/order/create', order.createOrder);
    app.get('/order', order.getAllOrders);
    app.get('/order/:id', order.getOrderById);
    app.delete('/order/delete/:id', order.deleteOrder);
};

module.exports = (app) => {
    const delivery = require("../controllers/delivery.controller");

    app.post('/delivery/create', delivery.createDelivery);
    app.get('/delivery/all', delivery.getAllDeliveries);
    app.get('/delivery/:id', delivery.getDeliveryById);
    app.put('/delivery/statut/:id', delivery.updateDeliveryStatut);
    app.delete('/delivery/delete/:id', delivery.deleteDelivery);
};

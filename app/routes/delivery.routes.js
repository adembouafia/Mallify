const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const delivery = require("../controllers/delivery.controller");

    app.post('/delivery/create',auth,authorize('vendor','moderator'),delivery.createDelivery);
    app.get('/delivery/all',auth,authorize('superAdmin', 'admin','vendor' , 'moderator'),delivery.getAllDeliveries);
    app.get('/delivery/:id',auth,authorize('vendor', 'moderator', 'superAdmin', 'admin'),delivery.getDeliveryById);
    app.put('/delivery/statut/:id',auth,authorize('vendor', 'moderator', 'admin', 'superAdmin'),delivery.updateDeliveryStatut);
    app.delete('/delivery/delete/:id',auth,authorize('vendor' , 'moderator'),delivery.deleteDelivery);
};

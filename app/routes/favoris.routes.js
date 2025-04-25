const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const favoris = require("../controllers/favoris.controller");
    app.post('/favoris/add',auth,authorize('client'),favoris.addFavorite);
    app.delete('/favoris/remove',auth,authorize('client'),favoris.removeFavorite);
    app.get('/favoris/:clientId',auth,authorize('client'),favoris.getFavorites);
};

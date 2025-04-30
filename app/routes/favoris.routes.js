const auth = require("../middlewares/auth.middleware");

module.exports = (app) => {
    const favoris = require("../controllers/favoris.controller");
    app.post('/favoris/add',auth,favoris.addFavorite);
    app.delete('/favoris/remove',auth,favoris.removeFavorite);
    app.get('/favoris/:clientId',auth,favoris.getFavorites);
};

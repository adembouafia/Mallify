module.exports = (app) => {
    const favoris = require("../controllers/favoris.controller");

    app.post('/favoris/add', favoris.addFavorite);
    app.delete('/favoris/remove', favoris.removeFavorite);
    app.get('/favoris/:clientId', favoris.getFavorites);
}

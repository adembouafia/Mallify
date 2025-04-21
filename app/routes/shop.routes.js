module.exports = (app) =>{
    const shop = require("../controllers/shop.controller");

    app.get('/shop/get', shop.getAllShops);
}
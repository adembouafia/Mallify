module.exports = (app) => {
    const shop = require("../controllers/shop.controller");

    app.get('/shop/get', shop.getAllShops);
    app.get('/shop/get/:id', shop.getShopById);
    app.put('/shop/update/:id', shop.updateShopStatus);
    app.delete('/shop/delete/:id', shop.deleteShop);
};
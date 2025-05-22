const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
  const shop = require("../controllers/shop.controller");

  app.get("/shop/get", shop.getAllShops);
  app.get("/shop/:id", shop.getShopById);

  app.put("/shop/update/:id", auth, shop.updateShop);
  app.put(
    "/shop/status/:id",
    auth,
    authorize("superAdmin", "admin"),
    shop.updateShopStatus
  );
  app.delete(
    "/shop/delete/:id",
    auth,
    authorize("superAdmin", "admin"),
    shop.deleteShop
  );
  app.put(
    "/shop/ban/:id",
    auth,
    authorize("superAdmin", "admin"),
    shop.banShop
  );
  app.put(
    "/shop/unban/:id",
    auth,
    authorize("superAdmin", "admin"),
    shop.unbanShop
  );
  app.put("/shop/update-phone/:id", auth, shop.updateShopPhone);

  // Admin dashboard API endpoints
  app.get("/api/shop/count", shop.getShopCount);
  app.get("/api/shop/categories", shop.getShopCategories);
  app.get("/api/shop/best-sellers", shop.getBestSellers);
};

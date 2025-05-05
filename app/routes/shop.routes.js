const auth = require("../middlewares/auth.middleware")
const authorize = require("../middlewares/authorize.middleware")
module.exports = (app) => {
  const shop = require("../controllers/shop.controller")

  app.get("/shop/get", shop.getAllShops)
  app.get("/shop/get/:id", shop.getShopById)
  app.put("/shop/update/:id", auth, authorize("superAdmin", "admin"), shop.updateShopStatus)
  app.delete("/shop/delete/:id", auth, authorize("superAdmin", "admin"), shop.deleteShop)
  app.put("/shop/ban/:id", auth, authorize("superAdmin", "admin"), shop.banShop)
  app.put("/shop/unban/:id", auth, authorize("superAdmin", "admin"), shop.unbanShop)
}
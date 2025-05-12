module.exports = (app) => {
  const notification = require("../controllers/notification.controller")
  const auth = require("../middlewares/auth.middleware")
  const authorize = require("../middlewares/authorize.middleware")

  // Protéger les routes avec authentification et autorisation
  app.get("/notifications/shop/:shopId", auth, authorize("vendor", "moderator", "admin"), notification.getNotificationsByShop)
  app.get("/notifications/shop/:shopId/count", auth, authorize("vendor", "moderator", "admin"), notification.countUnreadNotifications)
  app.put("/notifications/read/:id", auth, authorize("vendor", "moderator", "admin"), notification.markAsRead)
  app.put("/notifications/shop/:shopId/read-all", auth, authorize("vendor", "moderator", "admin"), notification.markAllAsRead)
  app.delete("/notifications/:id", auth, authorize("vendor", "moderator", "admin"), notification.deleteNotification)
}
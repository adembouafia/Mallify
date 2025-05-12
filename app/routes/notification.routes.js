const auth = require("../middlewares/auth.middleware")
const authorize = require("../middlewares/authorize.middleware")
  module.exports = (app) => {
    const notification = require("../controllers/notification.controller")
    

    // Protéger les routes avec authentification et autorisation
    app.get("/notifications/shop/:shopId", auth, notification.getNotificationsByShop)
    app.get("/notifications/shop/:shopId/count", auth, notification.countUnreadNotifications)
    app.put("/notifications/read/:id", auth, notification.markAsRead)
    app.put("/notifications/shop/:shopId/read-all", auth, notification.markAllAsRead)
    app.delete("/notifications/:id", auth, notification.deleteNotification)
}
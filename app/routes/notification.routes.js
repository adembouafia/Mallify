const auth = require("../middlewares/auth.middleware")
  module.exports = (app) => {
    const notification = require("../controllers/notification.controller")
    

    // Shopppppppp notifications
    app.get("/notifications/shop/:shopId", auth, notification.getNotificationsByShop)
    app.get("/notifications/shop/:shopId/count", auth, notification.countUnreadNotifications)
    app.put("/notifications/read/:id", auth, notification.markAsRead)
    app.put("/notifications/shop/:shopId/read-all", auth, notification.markAllAsRead)
    app.delete("/notifications/:id", auth, notification.deleteNotification)




    //Admiiiiiinnnnn notifications
    app.get("/notifications/admin", auth, notification.getNotificationsToAdmin)
    app.get("/notifications/admin/count", auth, notification.countUnreadNotificationsToAdmin)
    app.put("/notifications/admin/read/:id", auth, notification.markAsReadToAdmin)
    app.put("/notifications/admin/read-all", auth, notification.markAllAsReadToAdmin)
    app.delete("/notifications/admin/:id", auth, notification.deleteNotificationToAdmin)
}
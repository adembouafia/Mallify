const Notification = require("../models/notification.model")

// Get all notifications for a shop
exports.getNotificationsByShop = async (req, res) => {
  try {
    const { shopId } = req.params
    const notifications = await Notification.find({ shopId }).populate("productId", "productName").sort({ createdAt: -1 })
    console.log(`Notifications récupérées pour la boutique ${shopId}: ${notifications.length}`)
    res.status(200).json({ status: "success", data: notifications })
  } catch (err) {
    console.error("Erreur lors de la récupération des notifications:", err.message)
    res.status(500).json({ status: "fail", message: err.message })
  }
}

// Count unread notifications for a shop
exports.countUnreadNotifications = async (req, res) => {
  try {
    const { shopId } = req.params
    const count = await Notification.countDocuments({ shopId, status: "unread" })
    res.status(200).json({ status: "success", count })
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message })
  }
}

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: "read" },
      { new: true }
    )
    console.log(`Notification ${req.params.id} marquée comme lue`)
    res.status(200).json({ status: "success", data: notification })
  } catch (err) {
    console.error("Erreur lors du marquage de la notification comme lue:", err.message)
    res.status(500).json({ status: "fail", message: err.message })
  }
}

// Mark all notifications as read for a shop
exports.markAllAsRead = async (req, res) => {
  try {
    const { shopId } = req.params
    await Notification.updateMany(
      { shopId, status: "unread" },
      { status: "read" }
    )
    res.status(200).json({ status: "success", message: "All notifications marked as read" })
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message })
  }
}

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id)
    res.status(200).json({ status: "success", message: "Notification deleted" })
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message })
  }
}
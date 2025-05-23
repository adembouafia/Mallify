const Notification = require("../models/notification.model");

// Get all notifications for a shop
exports.getNotificationsByShop = async (req, res) => {
  try {
    // Use the shopId from the authenticated user instead of the parameter
    const shopId = req.user.shopId;

    if (!shopId) {
      return res.status(400).json({
        message: "Shop ID not found in authentication token",
      });
    }

    const notifications = await Notification.find({ shopId })
      .populate("productId", "productName")
      .populate("orderId", "orderTotal orderStatus")
      .populate("clientId", "firstname lastname")
      .sort({ createdAt: -1 });
    console.log(
      `Notifications retrieved for shop ${shopId}: ${notifications.length}`
    );
    res.status(200).json({ status: "success", data: notifications });
  } catch (err) {
    console.error(
      "Error retrieving notifications:",
      err.message
    );
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Count unread notifications for a shop
exports.countUnreadNotifications = async (req, res) => {
  try {
    // Use the shopId from the authenticated user instead of the parameter
    const shopId = req.user.shopId;

    if (!shopId) {
      return res.status(400).json({
        message: "Shop ID not found in authentication token",
      });
    }

    const count = await Notification.countDocuments({
      shopId,
      status: "unread",
    });
    res.status(200).json({ status: "success", count });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res
        .status(404)
        .json({ status: "fail", message: "Notification not found" });
    }

    // Check that the notification belongs to the user's shop
    const shopId = req.user.shopId;
    if (notification.shopId.toString() !== shopId) {
      return res.status(403).json({
        status: "fail",
        message: "You are not authorized to modify this notification",
      });
    }

    notification.status = "read";
    await notification.save();

    console.log(`Notification ${req.params.id} marked as read`);
    res.status(200).json({ status: "success", data: notification });
  } catch (err) {
    console.error(
      "Error marking notification as read:",
      err.message
    );
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Mark all notifications as read for a shop
exports.markAllAsRead = async (req, res) => {
  try {
    // Use the shopId from the authenticated user instead of the parameter
    const shopId = req.user.shopId;

    if (!shopId) {
      return res.status(400).json({
        message: "Shop ID not found in authentication token",
      });
    }

    await Notification.updateMany(
      { shopId, status: "unread" },
      { status: "read" }
    );
    res
      .status(200)
      .json({ status: "success", message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res
        .status(404)
        .json({ status: "fail", message: "Notification not found" });
    }

    // Check that the notification belongs to the user's shop
    const shopId = req.user.shopId;
    if (notification.shopId.toString() !== shopId) {
      return res.status(403).json({
        status: "fail",
        message: "You are not authorized to delete this notification",
      });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ status: "success", message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Admin dashboard notifications ----------------------------------------------------
exports.getNotificationsToAdmin = async (req, res) => {
  try {
    const notifications = await Notification.find({ type: "admin" })
      .populate("shopId", "shopName status")
      .populate("vendorId", "vendorName")
      .sort({ createdAt: -1 });

    res.status(200).json({ status: "success", data: notifications });
  } catch (err) {
    console.error(
      "Error retrieving notifications:",
      err.message
    );
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.countUnreadNotificationsToAdmin = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      status: "unread",
      type: "admin",
    });
    res.status(200).json({ status: "success", count });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.markAsReadToAdmin = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res
        .status(404)
        .json({ status: "fail", message: "Notification not found" });
    }

    // Check that the notification is of admin type
    if (notification.type !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "This notification is not intended for the administrator",
      });
    }

    notification.status = "read";
    await notification.save();

    console.log(`Notification ${req.params.id} marked as read`);
    res.status(200).json({ status: "success", data: notification });
  } catch (err) {
    console.error(
      "Error marking notification as read:",
      err.message
    );
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.markAllAsReadToAdmin = async (req, res) => {
  try {
    await Notification.updateMany(
      { status: "unread", type: "admin" },
      { status: "read" }
    );
    res
      .status(200)
      .json({ status: "success", message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.deleteNotificationToAdmin = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res
        .status(404)
        .json({ status: "fail", message: "Notification not found" });
    }

    // Check that the notification is of admin type
    if (notification.type !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "This notification is not intended for the administrator",
      });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ status: "success", message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};
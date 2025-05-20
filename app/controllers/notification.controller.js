const Notification = require("../models/notification.model");

// Get all notifications for a shop
exports.getNotificationsByShop = async (req, res) => {
  try {
    // Utiliser le shopId de l'utilisateur authentifié au lieu du paramètre
    const shopId = req.user.shopId;

    if (!shopId) {
      return res.status(400).json({
        message: "Shop ID non trouvé dans le token d'authentification",
      });
    }

    const notifications = await Notification.find({ shopId })
      .populate("productId", "productName")
      .populate("orderId", "orderTotal orderStatus")
      .populate("clientId", "firstname lastname")
      .sort({ createdAt: -1 });
    console.log(
      `Notifications récupérées pour la boutique ${shopId}: ${notifications.length}`
    );
    res.status(200).json({ status: "success", data: notifications });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des notifications:",
      err.message
    );
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Count unread notifications for a shop
exports.countUnreadNotifications = async (req, res) => {
  try {
    // Utiliser le shopId de l'utilisateur authentifié au lieu du paramètre
    const shopId = req.user.shopId;

    if (!shopId) {
      return res.status(400).json({
        message: "Shop ID non trouvé dans le token d'authentification",
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

    // Vérifier que la notification appartient au shop de l'utilisateur
    const shopId = req.user.shopId;
    if (notification.shopId.toString() !== shopId) {
      return res.status(403).json({
        status: "fail",
        message: "Vous n'êtes pas autorisé à modifier cette notification",
      });
    }

    notification.status = "read";
    await notification.save();

    console.log(`Notification ${req.params.id} marquée comme lue`);
    res.status(200).json({ status: "success", data: notification });
  } catch (err) {
    console.error(
      "Erreur lors du marquage de la notification comme lue:",
      err.message
    );
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Mark all notifications as read for a shop
exports.markAllAsRead = async (req, res) => {
  try {
    // Utiliser le shopId de l'utilisateur authentifié au lieu du paramètre
    const shopId = req.user.shopId;

    if (!shopId) {
      return res.status(400).json({
        message: "Shop ID non trouvé dans le token d'authentification",
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

    // Vérifier que la notification appartient au shop de l'utilisateur
    const shopId = req.user.shopId;
    if (notification.shopId.toString() !== shopId) {
      return res.status(403).json({
        status: "fail",
        message: "Vous n'êtes pas autorisé à supprimer cette notification",
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

// Dashbord admin notifications ----------------------------------------------------
exports.getNotificationsToAdmin = async (req, res) => {
  try {
    const notifications = await Notification.find({ type: "admin" })
      .populate("shopId", "shopName status")
      .populate("vendorId", "vendorName")
      .sort({ createdAt: -1 });

    res.status(200).json({ status: "success", data: notifications });
  } catch (err) {
    console.error(
      "Erreur lors de la récupération des notifications:",
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

    // Vérifier que la notification est de type admin
    if (notification.type !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Cette notification n'est pas destinée à l'administrateur",
      });
    }

    notification.status = "read";
    await notification.save();

    console.log(`Notification ${req.params.id} marquée comme lue`);
    res.status(200).json({ status: "success", data: notification });
  } catch (err) {
    console.error(
      "Erreur lors du marquage de la notification comme lue:",
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

    // Vérifier que la notification est de type admin
    if (notification.type !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Cette notification n'est pas destinée à l'administrateur",
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

const Report = require("../models/report.model");
const Product = require("../models/product.model");
const Notification = require("../models/notification.model");
const Client = require("../models/client.model");

// Create a report
exports.createReport = async (req, res) => {
  try {
    const { clientId, targetType, targetId, title, message } = req.body;

    if (targetType !== "Platform" && !targetId) {
      return res.status(400).json({
        message: "The targetId field is required for this type of report.",
      });
    }

    // Retrieve client information
    let clientInfo = { firstname: "Client", lastname: "" };
    if (clientId) {
      try {
        const client = await Client.findById(clientId);
        if (client) {
          clientInfo = {
            firstname: client.firstname || "Client",
            lastname: client.lastname || "",
          };
        }
      } catch (err) {
        console.log("Error retrieving client information:", err.message);
      }
    }

    // For Product reports, get the shop ID from the product
    let shopId;
    if (targetType === "Product") {
      const product = await Product.findById(targetId);
      if (!product) {
        return res.status(404).json({
          message: "The reported product does not exist.",
        });
      }
      shopId = product.shop;
    }

    const newReport = new Report({
      clientId,
      targetType,
      targetId: targetType === "Platform" ? undefined : targetId,
      title,
      message,
      shop: shopId,
      forAdmin: targetType === "Platform",
    });

    const savedReport = await newReport.save();

    if (targetType === "Product") {
      // Retrieve product name if available
      let productName = targetId;
      try {
        const product = await Product.findById(targetId);
        if (product && product.productName) {
          productName = product.productName;
        }
      } catch (err) {
        console.log("Error retrieving product name:", err.message);
      }
      await Notification.create({
        productId: targetId,
        shopId: shopId,
        clientId: clientId,
        type: "product",
        status: "unread",
        message: `New report submitted for product "${productName}": "${title}". Submitted by ${clientInfo.firstname} ${clientInfo.lastname}`,
      });
    }

    if (targetType === "Platform") {
      await Notification.create({
        type: "admin",
        status: "unread",
        clientId: clientId,
        message: `New platform report: "${title}", Submitted by ${clientInfo.firstname} ${clientInfo.lastname}`,
      });
    }

    res.status(201).json({
      message: "Report submitted successfully.",
      report: savedReport,
    });
  } catch (err) {
    res.status(500).json({
      message: "An error occurred while creating the report.",
      error: err.message,
    });
  }
};


//get report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("clientId", "username email")
      .populate("shop", "shopName")
      .populate("targetId", "productId productName"); // Add this to get product details

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const userRole = req.user.role;

    // Get shop ID from user object - look for both shop and shopId
    const shopId = req.user.shopId;

    // Check user permissions based on role
    if (userRole === "admin" || userRole === "superAdmin") {
      // Admin and super admin can only see non-product reports
      if (report.targetType === "Product") {
        return res.status(403).json({
          message:
            "Product reports are only visible to their respective shop owners",
        });
      }

      // Format report data
      const reportObj = report.toObject();
      if (reportObj.createdAt) {
        const date = new Date(reportObj.createdAt);
        reportObj.formattedDate = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
      }
      reportObj.displayId = `Report #${reportObj._id.toString().slice(-5)}`;

      return res.status(200).json(reportObj);
    } else if (userRole === "vendor" || userRole === "moderator") {
      // Vendors and moderators can only see product reports for their shop
      if (
        report.targetType === "Product" &&
        report.shop &&
        report.shop.toString() === shopId
      ) {
        // Format report data
        const reportObj = report.toObject();
        if (reportObj.createdAt) {
          const date = new Date(reportObj.createdAt);
          reportObj.formattedDate = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
        }
        reportObj.displayId = `Report #${reportObj._id.toString().slice(-5)}`;

        return res.status(200).json(reportObj);
      } else {
        return res
          .status(403)
          .json({ message: "You are not authorized to access this report" });
      }
    } else {
      // Other users cannot see reports
      return res.status(403).json({ message: "Unauthorized access" });
    }
  } catch (err) {
    console.error("Error in getReportById:", err);
    res.status(500).json({
      message: "Error retrieving the report",
      error: err.message,
    });
  }
};

//get all reports by target type
exports.getReportsByTargetType = async (req, res) => {
  try {
    const { type } = req.params;
    const userRole = req.user.role;

    // Get shop ID from user object
    const shopId = req.user.shopId;

    console.log("User requesting reports by target type:", {
      role: userRole,
      userId: req.user.id,
      shopId: shopId,
      targetType: type,
    });

    let reports;

    // Filter reports based on user role and target type
    if (userRole === "admin" || userRole === "superAdmin") {
      // Admin and Super Admin can only see non-product reports
      if (type === "Product") {
        return res.status(403).json({
          message:
            "Product reports are only visible to their respective shop owners",
        });
      } else {
        reports = await Report.find({ targetType: type })
          .populate("clientId", "username email")
          .populate("shop", "shopName");

        console.log(
          `Found ${reports.length} reports of type ${type} for admin/superAdmin`
        );
      }
    } else if (userRole === "vendor" || userRole === "moderator") {
      // Vendors and moderators can only see product reports for their shop
      if (!shopId) {
        console.log("User has no shop ID in token");
        return res.status(400).json({
          message: "Shop ID not found in token. Please login again.",
        });
      }

      if (type === "Product") {
        console.log("Looking for product reports for shop ID:", shopId);
        reports = await Report.find({
          targetType: "Product",
          shop: shopId,
        })
          .populate("clientId", "username email")
          .populate("shop", "shopName")
          .populate({
            path: "targetId",
            select: "productId productName", // Include the specific productId field
            model: "Product",
          });

        console.log(
          `Found ${reports.length} product reports for shop ${shopId}`
        );

        // Debug: Log the first report to check if targetId is populated
        if (reports.length > 0) {
          console.log("Sample report targetId:", reports[0].targetId);
          if (reports[0].targetId && reports[0].targetId.productId) {
            console.log(
              "Product ID from model:",
              reports[0].targetId.productId
            );
          }
        }
      } else {
        return res.status(403).json({
          message:
            "You are only authorized to view product reports for your shop",
        });
      }
    } else {
      // Other users cannot see reports
      return res.status(403).json({
        message: "Unauthorized access",
      });
    }

    // Format the date to show only the date part and add display ID
    const formattedReports = reports.map((report) => {
      const reportObj = report.toObject();
      if (reportObj.createdAt) {
        const date = new Date(reportObj.createdAt);
        reportObj.formattedDate = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
      }
      // Add a display ID format
      reportObj.displayId = `Report #${reportObj._id.toString().slice(-5)}`;
      return reportObj;
    });

    res.status(200).json(formattedReports);
  } catch (err) {
    console.error("Error in getReportsByTargetType:", err);
    res.status(500).json({
      message: "Error retrieving reports",
      error: err.message,
    });
  }
};

//get all reports
exports.getAllReports = async (req, res) => {
  try {
    let reports;
    const userRole = req.user.role;

    // Get shop ID from user object
    const shopId = req.user.shopId;

    console.log("User requesting reports:", {
      role: userRole,
      userId: req.user.id,
      shopId: shopId,
    });

    // Filter reports based on user role
    if (userRole === "admin" || userRole === "superAdmin") {
      // Admin and Super Admin can see only Platform/Contact reports and non-Product reports
      reports = await Report.find({
        targetType: { $ne: "Product" }, // Exclude Product reports
      })
        .populate("clientId", "username email")
        .populate("shop", "shopName");

      console.log(`Found ${reports.length} reports for admin/superAdmin`);
    } else if (userRole === "vendor" || userRole === "moderator") {
      // Vendors and moderators can only see product reports related to their shops
      if (!shopId) {
        console.log("User has no shop ID in token");
        return res.status(400).json({
          message: "Shop ID not found in token. Please login again.",
        });
      }

      console.log("Looking for product reports with shop ID:", shopId);
      reports = await Report.find({
        targetType: "Product",
        shop: shopId,
      })
        .populate("clientId", "username email")
        .populate("shop", "shopName")
        .populate({
          path: "targetId",
          select: "productId productName", // Include the specific productId field
          model: "Product",
        });

      console.log(`Found ${reports.length} product reports for shop ${shopId}`);

      // Debug: Log the first report to check if targetId is populated
      if (reports.length > 0) {
        console.log("Sample report targetId:", reports[0].targetId);
        if (reports[0].targetId && reports[0].targetId.productId) {
          console.log("Product ID from model:", reports[0].targetId.productId);
        }
      }
    } else {
      // Other users can't see reports
      return res.status(403).json({
        message: "Unauthorized access to reports",
      });
    }

    // Format the date to show only the date part
    const reportsWithFormattedDate = reports.map((report) => {
      const reportObj = report.toObject();
      if (reportObj.createdAt) {
        const date = new Date(reportObj.createdAt);
        reportObj.formattedDate = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
      }
      // Add a display ID format
      reportObj.displayId = `Report #${reportObj._id.toString().slice(-5)}`;

      return reportObj;
    });

    res.status(200).json(reportsWithFormattedDate);
  } catch (err) {
    console.error("Error in getAllReports:", err);
    res.status(500).json({
      message: "Error retrieving reports",
      error: err.message,
    });
  }
};
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check that the report belongs to the user's shop if it's a product report
    if (report.targetType === "Product") {
      const shopId = req.user.shopId;
      if (
        report.shop.toString() !== shopId &&
        req.user.role !== "admin" &&
        req.user.role !== "superAdmin"
      ) {
        return res.status(403).json({
          message: "You are not authorized to delete this report",
        });
      }
    } else if (req.user.role !== "admin" && req.user.role !== "superAdmin") {
      return res.status(403).json({
        message:
          "Only administrators can delete this type of report",
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Report deleted successfully",
      deletedReport: report,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting the report",
      error: err.message,
    });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check that the report belongs to the user's shop if it's a product report
    if (report.targetType === "Product") {
      const shopId = req.user.shopId;
      if (
        report.shop.toString() !== shopId &&
        req.user.role !== "admin" &&
        req.user.role !== "superAdmin"
      ) {
        return res.status(403).json({
          message: "You are not authorized to modify this report",
        });
      }
    } else if (req.user.role !== "admin" && req.user.role !== "superAdmin") {
      return res.status(403).json({
        message:
          "Only administrators can modify this type of report",
      });
    }

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true }
    );

    res.status(200).json({
      message: "Report status updated successfully",
      updatedReport: updatedReport,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating report status",
      error: err.message,
    });
  }
};
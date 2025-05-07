const Report = require('../models/report.model');
const Product = require('../models/product.model');

//create report
exports.createReport = async (req, res) => {
    try {
        const { clientId, targetType, targetId, title, message } = req.body;

        if (targetType !== 'Platform' && !targetId) {
            return res.status(400).json({
                message: 'Le champ targetId est requis pour ce type de signalement',
            });
        }

        // For Product reports, get the shop ID from the product
        let shopId;
        if (targetType === 'Product') {
            const product = await Product.findById(targetId);
            if (!product) {
                return res.status(404).json({
                    message: 'Le produit signalé n\'existe pas',
                });
            }
            shopId = product.shop;
        }

        const newReport = new Report({
            clientId,
            targetType,
            targetId: targetType === 'Platform' ? undefined : targetId,
            title,
            message,
            shop: shopId,
            forAdmin: targetType === 'Platform' // Only Platform reports go to admin by default
        });

        const savedReport = await newReport.save();

        res.status(201).json({
            message: 'Signalement envoyé avec succès',
            report: savedReport,
        });
    } catch (err) {
            res.status(500).json({
            message: 'Erreur lors de la création du signalement',
            error: err.message,
        });
    }
};



//get report by ID
exports.getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('clientId', 'username email')
            .populate('shop', 'shopName');
            
        if (!report) {
            return res.status(404).json({ message: 'Rapport non trouvé' });
        }
        
        const userRole = req.user.role;
        
        // Get shop ID from user object - look for both shop and shopId
        const shopId = req.user.shop || req.user.shopId;
        
        // Check user permissions based on role
        if (userRole === 'admin' || userRole === 'superAdmin') {
            // Admin and super admin can only see non-product reports
            if (report.targetType === 'Product') {
                return res.status(403).json({ 
                    message: 'Product reports are only visible to their respective shop owners' 
                });
            }
            return res.status(200).json(report);
        } else if (userRole === 'vendor') {
            // Vendors can only see product reports for their shop
            if (report.targetType === 'Product' && report.shop && report.shop.toString() === shopId.toString()) {
                return res.status(200).json(report);
            } else {
                return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à ce rapport' });
            }
        } else {
            // Other users cannot see reports
            return res.status(403).json({ message: 'Accès non autorisé' });
        }
    } catch (err) {
        console.error("Error in getReportById:", err);
        res.status(500).json({
            message: 'Erreur lors de la récupération du rapport',
            error: err.message,
        });
    }
};



//get all reports by target type
exports.getReportsByTargetType = async (req, res) => {
    try {
        const { type } = req.params;
        const userRole = req.user.role;
        
        // Get shop ID from user object - look for both shop and shopId properties
        const shopId = req.user.shop || req.user.shopId;
        
        console.log("User requesting reports by target type:", {
            role: userRole,
            userId: req.user.id,
            shopId: shopId,
            targetType: type
        });
        
        let reports;
        
        // Filter reports based on user role and target type
        if (userRole === 'admin' || userRole === 'superAdmin') {
            // Admin and Super Admin can only see non-product reports
            if (type === 'Product') {
                return res.status(403).json({
                    message: 'Product reports are only visible to their respective shop owners',
                });
            } else {
                reports = await Report.find({ targetType: type })
                    .populate('clientId', 'username email')
                    .populate('shop', 'shopName');
                    
                console.log(`Found ${reports.length} reports of type ${type} for admin/superAdmin`);
            }
        } else if (userRole === 'vendor') {
            // Vendors can only see product reports for their shop
            if (!shopId) {
                console.log("Vendor has no shop ID in token");
                return res.status(400).json({
                    message: 'Shop ID not found in token. Please login again.',
                });
            }
            
            if (type === 'Product') {
                console.log("Looking for product reports for shop ID:", shopId);
                reports = await Report.find({
                    targetType: 'Product',
                    shop: shopId
                })
                .populate('clientId', 'username email')
                .populate('shop', 'shopName');
                
                console.log(`Found ${reports.length} product reports for shop ${shopId}`);
            } else {
                return res.status(403).json({
                    message: 'Vous n\'êtes autorisé à voir que les rapports de produits de votre boutique',
                });
            }
        } else {
            // Other users cannot see reports
            return res.status(403).json({
                message: 'Accès non autorisé',
            });
        }
        
        res.status(200).json(reports);
    } catch (err) {
        console.error("Error in getReportsByTargetType:", err);
        res.status(500).json({
            message: 'Erreur lors de la récupération des rapports',
            error: err.message,
        });
    }
};



//get all reports
exports.getAllReports = async (req, res) => {
    try {
        let reports;
        const userRole = req.user.role;
        
        // Get shop ID from user object - look for both shop and shopId
        const shopId = req.user.shop || req.user.shopId;
        
        console.log("User requesting reports:", {
            role: userRole,
            userId: req.user.id,
            shopId: shopId
        });

        // Filter reports based on user role
        if (userRole === 'admin' || userRole === 'superAdmin') {
            // Admin and Super Admin can see only Platform/Contact reports and non-Product reports
            reports = await Report.find({
                targetType: { $ne: 'Product' } // Exclude Product reports
            })
                .populate('clientId', 'username email')
                .populate('shop', 'shopName');
                
            console.log(`Found ${reports.length} reports for admin/superAdmin`);
        } else if (userRole === 'vendor') {
            // Vendors can only see product reports related to their shops
            if (!shopId) {
                console.log("Vendor has no shop ID in token");
                return res.status(400).json({
                    message: 'Shop ID not found in token. Please login again.',
                });
            }
            
            console.log("Looking for product reports with shop ID:", shopId);
            reports = await Report.find({ 
                targetType: 'Product', 
                shop: shopId 
            })
            .populate('clientId', 'username email')
            .populate('shop', 'shopName');
            
            console.log(`Found ${reports.length} product reports for shop ${shopId}`);
        } else {
            // Other users can't see reports
            return res.status(403).json({
                message: 'Unauthorized access to reports',
            });
        }

        res.status(200).json(reports);
    } catch (err) {
        console.error("Error in getAllReports:", err);
        res.status(500).json({
            message: 'Erreur lors de la récupération des rapports',
            error: err.message,
        });
    }
};
exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);
        
        if (!report) {
            return res.status(404).json({ message: 'Rapport non trouvé' });
        }
        
        res.status(200).json({ 
            message: 'Rapport supprimé avec succès',
            deletedReport: report
        });
    } catch (err) {
        res.status(500).json({
            message: 'Erreur lors de la suppression du rapport',
            error: err.message
        });
    }
};

// Update report status
exports.updateReportStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ message: 'Le statut est requis' });
        }
        
        const report = await Report.findByIdAndUpdate(
            req.params.id, 
            { status: status },
            { new: true }
        );
        
        if (!report) {
            return res.status(404).json({ message: 'Rapport non trouvé' });
        }
        
        res.status(200).json({
            message: 'Statut du rapport mis à jour avec succès',
            updatedReport: report
        });
    } catch (err) {
        res.status(500).json({
            message: 'Erreur lors de la mise à jour du statut du rapport',
            error: err.message
        });
    }
};

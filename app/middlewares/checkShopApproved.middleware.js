const Shop = require('../models/shop.model');

const checkShopApproved = async (req, res, next) => {
    try {
        const vendorId = req.user._id; // l'ID du vendor est dans req.user (après vérif du token)

        const shop = await Shop.findOne({ vendor: vendorId }); // on récupère le shop associé au vendor

        if (!shop) {
            return res.status(404).json({ message: "Aucun shop associé à ce vendeur." });
        }

        if (shop.status !== 'Approved') {
            return res.status(403).json({
                message: `Accès refusé : votre shop est actuellement "${shop.status}".`
            });
        }

        // Shop approuvé, on continue
        next();
    } catch (error) {
        console.error("Erreur dans checkShopApproved :", error);
        res.status(500).json({ message: "Erreur serveur lors de la vérification du statut du shop." });
    }
};

module.exports = checkShopApproved;

const Shop = require('../models/shop.model');

const checkShopApproved = async (req, res, next) => {
    try {
        const shopId = req.user.shopId;

        if (!shopId) {
            return res.status(400).json({ message: "ID du shop manquant." });
        }

        const shop = await Shop.findById(shopId);

        if (!shop) {
            return res.status(404).json({ message: "Shop introuvable." });
        }
        console.log('Shop ID:', shopId, 'Shop Status:', shop.status);

        if (shop.status !== 'Approved') {
            return res.status(403).json({ message: "Action non autorisée : le shop n'est pas approuvé." });
        }

        next();
    } catch (error) {
        console.error("Erreur dans checkShopApproved :", error);
        res.status(500).json({ message: "Erreur serveur lors de la vérification du statut du shop." });
    }
};

module.exports = checkShopApproved;

const Favorite = require('../models/favoris.model');


// Ajouter un produit aux favoris
exports.addFavorite = async (req, res) => {
    const { clientId, productId } = req.body;
    try {
        let fav = await Favorite.findOne({ clientId });
        if (!fav) {
            fav = new Favorite({ clientId, items: [{ productId }] });
        } else {
            const exists = fav.items.some(item => item.productId.toString() === productId);
            if (exists) {
                return res.status(400).json({ 
                    message: 'Produit déjà en favoris' 
                });
            }
            fav.items.push({ productId });
        }
        await fav.save();
        res.status(200).json({ 
            message: 'Favori mis à jour', 
            favorites: fav 
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Erreur ajout favori', error: err.message 
        });
    }
};


// Lister les favoris d'un client
exports.getFavorites = async (req, res) => {
    const { clientId } = req.params;
    try {
        const fav = await Favorite.findOne({ clientId }).populate('items.productId');
        if (!fav) {
            return res.status(404).json({ 
                message: 'Aucun favoris pour ce client' 
            });
        }
        res.status(200).json({ favorites: fav.items });
    } catch (err) {
        res.status(500).json({ 
            message: 'Erreur récupération favoris', 
            error: err.message 
        });
    }
};


// Supprimer un favori
exports.removeFavorite = async (req, res) => {
    const { clientId, productId } = req.body;
    try {
        const fav = await Favorite.findOne({ clientId });
        if (!fav) {
            return res.status(404).json({ 
                message: 'Aucun favoris pour ce client' 
            });
        }
        fav.items = fav.items.filter(item => item.productId.toString() !== productId);
        await fav.save();
        res.status(200).json({ 
            message: 'Produit retiré des favoris', favorites: fav.items 
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Erreur suppression favori', error: err.message 
        });
    }
};
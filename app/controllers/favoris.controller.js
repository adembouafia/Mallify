const Favorite = require('../models/favoris.model');


// Add a product to favorites
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
                    message: 'Product already in favorites' 
                });
            }
            fav.items.push({ productId });
        }
        await fav.save();
        res.status(200).json({ 
            message: 'Favorite updated', 
            favorites: fav 
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Error adding favorite', error: err.message 
        });
    }
};


// List a client's favorites
exports.getFavorites = async (req, res) => {
    const { clientId } = req.params;
    try {
        const fav = await Favorite.findOne({ clientId }).populate('items.productId');
        if (!fav) {
            return res.status(404).json({ 
                message: 'No favorites for this client' 
            });
        }
        res.status(200).json({ favorites: fav.items });
    } catch (err) {
        res.status(500).json({ 
            message: 'Error retrieving favorites', 
            error: err.message 
        });
    }
};


// Remove a favorite
exports.removeFavorite = async (req, res) => {
    const { clientId, productId } = req.body;
    try {
        const fav = await Favorite.findOne({ clientId });
        if (!fav) {
            return res.status(404).json({ 
                message: 'No favorites for this client' 
            });
        }
        fav.items = fav.items.filter(item => item.productId.toString() !== productId);
        await fav.save();
        res.status(200).json({ 
            message: 'Product removed from favorites', favorites: fav.items 
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Error removing favorite', error: err.message 
        });
    }
};
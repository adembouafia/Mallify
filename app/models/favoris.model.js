const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    items: [
        {
            productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        }
        }
    ]
    }, {
    timestamps: true
});

favoriteSchema.index({ clientId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
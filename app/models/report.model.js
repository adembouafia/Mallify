const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    targetType: {
        type: String,
        enum: ['Platform', 'Product', 'Vendor', 'Moderator'],
        required: true
    }, 
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: function () {
            return this.targetType !== 'Platform'; // targetId requis sauf pour 'Platform'
        }
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Resolved'],
        default: 'Pending'
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shop",
        required: function () {
            return this.targetType === 'Product'; // shop is required only for Product reports
        }
    },
    forAdmin: {
        type: Boolean,
        default: function() {
            return this.targetType === 'Platform'; // Platform reports are for admin only
        }
    }
},
{
    timestamps: true,
});


module.exports = mongoose.model('Report', reportSchema);
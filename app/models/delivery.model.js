const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  idCommande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  idClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  deliveryDate: {
    type: Date,
    default: Date.now
  },
  deliveryAdresse: {
    type: String,
    required: true
  },
  statut: {
    type: String,
    enum: ['Pending', 'Delivered', 'Cancelled' , 'Postponed'],
    default: 'Pending'
  },
  clientInfo: {
    nom: {
      type: String,
      required: true
    },
    prenom: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
});

// Méthode pour mettre à jour le statut
deliverySchema.methods.editStatut = function(newStatut) {
  this.statut = newStatut;
  return this.save();
};

// Méthode pour suivre l’avancement (retourne l’objet actuel)
deliverySchema.methods.trackDelivery = function() {
  return {
    idDelivery: this._id,
    statut: this.statut,
    deliveryDate: this.deliveryDate,
    deliveryAdresse: this.deliveryAdresse
  };
};

module.exports = mongoose.model('Delivery', deliverySchema);

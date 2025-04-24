const Delivery = require('../models/delivery.model');
const Client = require('../models/client.model'); 


// Créer une nouvelle livraison
exports.createDelivery = async (req, res) => {
    try {
        const { idCommande, idClient, deliveryAdresse, deliveryDate } = req.body;

        const client = await Client.findById(idClient);
        if (!client) return res.status(404).json({ 
            message: 'Client non trouvé' 
        });

        const newDelivery = new Delivery({
            idCommande,
            idClient,
            deliveryAdresse,
            deliveryDate,
            clientInfo: {
                nom: client.lastname,
                prenom: client.firstname
            }
        });

        const savedDelivery = await newDelivery.save();
        res.status(201).json({
            message: "Livraison créée avec succès",
            Delivery: savedDelivery,
            clientInfo: {
                nom: client.lastname,
                prenom: client.firstname
            }
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Erreur lors de la création de la Delivery', 
            error: err.message 
        });
    }
};


// Obtenir toutes les livraisons
exports.getAllDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find().populate('idClient').populate('idCommande');
        res.status(200).json(deliveries);
    } catch (err) {
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des livraisons', 
            error: err.message 
        });
    }
};


// Obtenir une livraison par ID
exports.getDeliveryById = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id).populate('idClient').populate('idCommande');
        if (!delivery) return res.status(404).json({ 
            message: 'Livraison non trouvée' 
        });
        res.status(200).json(delivery);
    } catch (err) {
        res.status(500).json({ 
            message: 'Erreur lors de la récupération de la livraison', 
            error: err.message 
        });
    }
};


// Mettre à jour le statut d'une livraison
exports.updateDeliveryStatut = async (req, res) => {
    try {
        const { newStatut } = req.body;
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) return res.status(404).json({ 
            message: 'Livraison non trouvée' 
        });

        await delivery.editStatut(newStatut);
        res.status(200).json({ 
            message: 'Statut mis à jour avec succès', 
            updatedDelivery: delivery
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Erreur lors de la mise à jour du statut', 
            error: err.message 
        });
    }
};


// Supprimer une livraison
exports.deleteDelivery = async (req, res) => {
    try {
        const deletedDelivery = await Delivery.findByIdAndDelete(req.params.id);
        if (!deletedDelivery) return res.status(404).json({ 
            message: 'Livraison non trouvée' 
        });
        res.status(200).json({ 
            message: 'Livraison supprimée avec succès' 
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Erreur lors de la suppression de la livraison', 
            error: err.message 
        });
    }
};
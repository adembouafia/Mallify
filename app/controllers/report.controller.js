const Report = require('../models/report.model');


//create report
exports.createReport = async (req, res) => {
    try {
        const { clientId, targetType, targetId, title, message } = req.body;

        if (targetType !== 'Platform' && !targetId) {
        return res.status(400).json({
            message: 'Le champ targetId est requis pour ce type de signalement',
        });
        }

        const newReport = new Report({
            clientId,
            targetType,
            targetId: targetType === 'Platform' ? undefined : targetId,
            title,
            message,
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
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Rapport non trouvé' });
        }
        res.status(200).json(report);
    } catch (err) {
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
        const reports = await Report.find({ targetType: type });
        res.status(200).json(reports);
    } catch (err) {
        res.status(500).json({
            message: 'Erreur lors de la récupération des rapports',
            error: err.message,
        });
    }
};



//get all reports by target id
// exports.getReportsByTarget = async (req, res) => {
//     try {
//         const { type, id } = req.params;
    
//         const reports = await Report.find({
//             targetType: type,
//             targetId: id,
//         });
    
//         res.status(200).json(reports);
//     } catch (err) {
//         res.status(500).json({
//             message: 'Erreur lors de la récupération des rapports pour cette cible',
//             error: err.message,
//         });
//     }
// };


//get all reports
exports.getAllReports = async (req, res) => {
    try {
        const reports = await Report.find();
        res.status(200).json(reports);
    } catch (err) {
        res.status(500).json({
            message: 'Erreur lors de la récupération des rapports',
            error: err.message,
        });
    }
};

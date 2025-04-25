const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const report = require('../controllers/report.controller');
    app.post('/report', auth, authorize('client') , report.createReport);
    app.get('/report/:id', auth, report.getReportById);
    app.get('/reports/targetType/:type', auth, report.getReportsByTargetType);
    app.get('/reports', auth, report.getAllReports);
};

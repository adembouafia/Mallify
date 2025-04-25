const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const admin = require("../controllers/admin.controller");

    app.post('/admin/login', admin.login);
    app.post('/admin/forgotPassword', admin.forgotPassword);
    app.post('/admin/reset-password', admin.resetPassword);
    app.post('/admin/add', auth, authorize('superAdmin'), admin.addAdmin);
    app.get('/admin/getAll', auth, authorize('admin'), admin.getAllAdmins);
};



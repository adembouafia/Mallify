const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const vendor = require("../controllers/vendor.controller");
    app.post('/vendor/register', vendor.register);
    app.post('/vendor/login' ,vendor.login);
    app.post('/vendor/forgotPassword', vendor.forgotPassword);
    app.post('/vendor/reset-password', vendor.resetPassword);
    app.get('/vendor/get', auth, authorize('admin', 'superAdmin'), vendor.getAll);
    app.get('/vendor/:id', auth, vendor.getVendorById);
    app.put('/vendor/update/:id', auth, vendor.updateVendor);
};
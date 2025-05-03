const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const client = require("../controllers/client.controller");
    app.post('/client/register', client.register);
    app.post('/client/login', client.login);
    app.put('/client/update/:id',auth , client.update);
    app.post('/client/profile-picture/:id', auth, client.uploadProfilePicture);
    app.post('/client/forgotPassword', client.forgotPassword);
    app.post('/client/reset-password', client.resetPassword);
    app.get('/client/get', auth, authorize('admin', 'superAdmin','vendor','moderator'), client.getAll);
    app.get('/client/:id', auth, client.getById);
};
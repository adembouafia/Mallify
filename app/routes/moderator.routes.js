const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const moderator = require("../controllers/moderator.controller");
    app.post('/moderator/register',auth , authorize('vendor'),moderator.addModerator);
    app.post('/moderator/login', moderator.login);
    app.post('/moderator/forgotPassword', moderator.forgotPassword);
    app.post('/moderator/reset-password', moderator.resetPassword);
    app.get('/moderator/all', auth, authorize('vendor'), moderator.getAll);
};

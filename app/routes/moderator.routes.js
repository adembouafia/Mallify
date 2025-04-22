const auth = require("../middlewares/auth.middleware");
module.exports = (app) =>{
    const moderator = require("../controllers/moderator.controller");

    app.post('/moderator/register', moderator.register);
    app.post('/moderator/login' , moderator.login);
}
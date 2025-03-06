const auth = require("../middlewares/auth.middleware");
module.exports = (app) =>{
    const client = require("../controllers/client.controller");

    app.post('/client/register', client.register);
    app.post('/client/login' , client.login);
}
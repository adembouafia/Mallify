const auth = require("../middlewares/auth.middleware");
module.exports = (app) =>{
    const vendor = require("../controllers/vendor.controller");

    app.post('/vendor/register', vendor.register);
    app.post('/vendor/login' , vendor.login);
    app.get('/vendor/get', auth , vendor.getAll);
}
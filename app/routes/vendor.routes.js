module.exports = (app) =>{
    const vendor = require("../controllers/vendor.controller");

    app.post('/vendor/register', vendor.register);
    app.post('/vendor/login' , vendor.login);
    app.get('/vendor/get', vendor.getAll);
}
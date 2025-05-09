const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const category = require("../controllers/category.controller");
    app.post('/category/create',auth,authorize('admin', 'superAdmin' ,'vendor' , 'moderator'),category.createCategory);
    app.delete('/category/delete/:id',auth,authorize('superAdmin'),category.deleteCategory);
    app.get('/category',category.getAllCategories);
    app.get('/categorieswithsubcategories',category.getCategoriesWithSubCategories);
};
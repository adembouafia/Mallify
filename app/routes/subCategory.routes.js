const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const subCategory = require("../controllers/subCategory.controller");
    app.post('/subcategory/create', auth, authorize('admin', 'superAdmin' , 'vendor' , 'moderator'), subCategory.createSubCategory);
    app.get('/subcategory/category/:categoryId', subCategory.getSubCategoriesByCategory);
};

module.exports = (app) => {
    const subCategory = require("../controllers/subCategory.controller");

    app.post('/subcategory/create', subCategory.createSubCategory);

    app.get('/subcategory/category/:categoryId', subCategory.getSubCategoriesByCategory);
};

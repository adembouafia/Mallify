module.exports = (app) => {
    const category = require("../controllers/category.controller");

    app.post('/category/create', category.createCategory);
    app.delete('/category/delete/:id', category.deleteCategory);
}
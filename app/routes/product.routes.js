module.exports = (app) => {
    const product = require("../controllers/product.controller");

    app.post("/product/create", product.createProduct);
    app.get("/product/get", product.getAllProducts);
    app.get("/product/get/:id", product.getProduct);
    app.put("/product/update/:id", product.updateProduct);
    app.delete("/product/delete/:id", product.deleteProduct);
}
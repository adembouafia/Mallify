const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const product = require("../controllers/product.controller");
    app.post("/product/create", auth, authorize('vendor', 'moderator'), product.createProduct);
    app.get("/product/get", product.getAllProducts);
    app.get("/product/get/:id", product.getProduct);
    app.put("/product/update/:id", auth, authorize('vendor', 'moderator'), product.updateProduct);
    app.delete("/product/delete/:id", auth, authorize('vendor', 'moderator'), product.deleteProduct);
};

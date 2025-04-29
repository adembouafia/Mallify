const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const product = require("../controllers/product.controller");
    app.post("/product/create",auth , product.createProduct);
    app.get("/product/get", product.getAllProducts);
    app.get("/product/get/myProducts", auth, authorize('vendor','moderator'), product.getMyProducts);
    app.get("/product/get/:id", product.getProduct);
    app.put("/product/update/:id", auth, authorize('vendor', 'moderator'), product.updateProduct);
    app.delete("/product/delete/:id", auth, authorize('vendor', 'moderator'), product.deleteProduct);
};

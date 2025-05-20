const auth = require("../middlewares/auth.middleware")
const authorize = require("../middlewares/authorize.middleware")

module.exports = (app) => {
  const product = require("../controllers/product.controller")
  app.post("/product/create", auth, product.createProduct)
  app.get("/product/get", product.getAllProducts)
  app.get("/product/get/myProducts", auth, authorize("vendor", "moderator"), product.getMyProducts)
  app.get("/product/get/:id", product.getProduct)
  app.put("/product/update/:id", auth, authorize("vendor", "moderator", "admin", "superAdmin"), product.updateProduct)
  app.delete("/product/delete/:id",auth,authorize("vendor", "moderator", "admin", "superAdmin"),product.deleteProduct)

  app.put("/product/ban/:id", auth, authorize("admin", "superAdmin"), product.banProduct)
  app.put("/product/unban/:id", auth, authorize("admin", "superAdmin"), product.unbanProduct)
  app.get("/product/banned", auth , authorize("admin", "superAdmin"), product.getBannedProducts)

  app.post("/product/:id/review", auth, product.addReview)
  app.get("/product/:id/reviews", product.getProductReviews)
  app.get("/product/:id/user-review", auth, product.getUserReview)
  app.delete("/product/:productId/review/:reviewId", auth, product.deleteReview)
  app.get("/product/category/:categoryName", product.getProductsByCategory);
  app.get("/product/filter", product.getFilteredProducts)
  app.get("/product/category-counts", product.getCategoryCounts);
  app.get("/product/stats", auth, product.getProductStats);

}

const auth = require("../middlewares/auth.middleware")
const authorize = require("../middlewares/authorize.middleware")

module.exports = (app) => {
    const blog = require("../controllers/blog.controller")

    app.post("/blog/create", auth, authorize("admin", "superAdmin"), blog.createBlog)
    app.get("/blog", auth, blog.getAllBlogs)

    app.get("/blog/category/:category", blog.getBlogsByCategory)
    app.get("/blog/tag/:tag", blog.getBlogsByTag)
    app.get("/blog/search", blog.searchBlogs)
    app.get("/blog/recent", blog.getRecentBlogs)
    app.get("/blog/popular", blog.getPopularBlogs)

    app.get("/blog/:id", blog.getBlogById)

    app.put("/blog/update/:id", auth, authorize("admin", "superAdmin"), blog.updateBlog)
    app.delete("/blog/delete/:id", auth, authorize("admin", "superAdmin"), blog.deleteBlog)

    app.post("/blog/:id/comment", blog.addComment)
    app.delete("/blog/:blogId/comment/:commentId", auth, blog.deleteComment)

    app.get("/categories", blog.getAllCategories)
    app.get("/tags", blog.getAllTags)
}

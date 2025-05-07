const auth = require('../middlewares/auth.middleware');

module.exports = (app) => {
    const blog = require("../controllers/blog.controller");

    app.post('/blog/create', blog.createBlog);
    app.get('/blog/:id', blog.getBlogById);
    app.get('/blog', blog.getAllBlogs);
    app.put('/blog/update/:id', blog.updateBlog);
    app.delete('/blog/delete/:id', blog.deleteBlog);
}
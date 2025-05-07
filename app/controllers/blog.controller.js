const Blog = require("../models/blog.model");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});


const upload = multer({
    storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
}).fields([
    { name: "mainImageBlog", maxCount: 1 },
    { name: "otherImagesBlog", maxCount: 12 },
]);

// Create blog
exports.createBlog = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: "Upload error", error: err.message });

        try {
        const { title, description, content } = req.body;

        const mainImageBlogFile = req.files["mainImageBlog"]?.[0];
        const otherImagesBlogFiles = req.files["otherImagesBlog"] || [];

        if (!mainImageBlogFile) {
            return res.status(400).json({ message: "mainImageBlog is required" });
        }

        const mainImageBlog = mainImageBlogFile.path;
        const otherImagesBlog = otherImagesBlogFiles.map((file) => file.path);

        const newBlog = new Blog({
            mainImageBlog,
            otherImagesBlog,
            title,
            description,
            content,
        });

        await newBlog.save();
        res.status(201).json({ message: "Blog created successfully", blog: newBlog });
        } catch (error) {
        res.status(500).json({ message: "Server error", error });
        }
    });
};

// Get blog by ID
exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: "Blog not found" });
        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Get all blogs
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Update blog
exports.updateBlog = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: "Upload error", error: err.message });

        try {
        const { title, description, content } = req.body;
        const blogId = req.params.id;

        const mainImageBlogFile = req.files["mainImageBlog"]?.[0];
        const otherImagesBlogFiles = req.files["otherImagesBlog"] || [];

        const updateData = {
            title,
            description,
            content,
        };

        if (mainImageBlogFile) {
            updateData.mainImageBlog = mainImageBlogFile.path;
        }

        if (otherImagesBlogFiles.length > 0) {
            updateData.otherImagesBlog = otherImagesBlogFiles.map(file => file.path);
        }

        const updatedBlog = await Blog.findByIdAndUpdate(blogId, updateData, { new: true });

        if (!updatedBlog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.status(200).json({ message: "Blog updated successfully", blog: updatedBlog });
        } catch (error) {
        res.status(500).json({ message: "Server error", error });
        }
    });
};

// Delete blog
exports.deleteBlog = async (req, res) => {
    try {
        const blogId = req.params.id;
        const deletedBlog = await Blog.findByIdAndDelete(blogId);

        if (!deletedBlog) {
        return res.status(404).json({ message: "Blog not found" });
        }


        //pour supprimer les images du blog lors de suppression de blog :)
        try {
            if (deletedBlog.mainImageBlog) fs.unlinkSync(deletedBlog.mainImageBlog);
            deletedBlog.otherImagesBlog.forEach(img => fs.unlinkSync(img));
        } catch (fileError) {
            console.warn("Erreur lors de la suppression des fichiers:", fileError.message);
        }

        res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

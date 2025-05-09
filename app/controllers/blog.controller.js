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
    if (err)
      return res
        .status(400)
        .json({ message: "Upload error", error: err.message });

    try {
      const { title, description, content, category, tags, status } = req.body;

      const mainImageBlogFile = req.files["mainImageBlog"]?.[0];
      const otherImagesBlogFiles = req.files["otherImagesBlog"] || [];

      if (!mainImageBlogFile) {
        return res.status(400).json({ message: "mainImageBlog is required" });
      }

      const mainImageBlog = mainImageBlogFile.path;
      const otherImagesBlog = otherImagesBlogFiles.map((file) => file.path);

      // Traiter les tags s'ils sont fournis
      let tagArray = [];
      if (tags) {
        if (typeof tags === "string") {
          tagArray = tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
        } else if (Array.isArray(tags)) {
          tagArray = tags;
        }
      }

      const newBlog = new Blog({
        mainImageBlog,
        otherImagesBlog,
        title,
        description,
        content,
        category: category || "Non catégorisé",
        tags: tagArray,
        status: status || "published",
        author: req.user ? req.user._id : null,
      });

      await newBlog.save();
      res
        .status(201)
        .json({ message: "Blog created successfully", blog: newBlog });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
};

// Get blog by ID
exports.getBlogById = async (req, res) => {
  try {
    // Utiliser populate si vous avez une référence à l'auteur
    const blog = await Blog.findById(req.params.id)
      .populate("author", "name email") // Ajustez selon votre modèle d'utilisateur
      .exec();

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // Incrémenter le compteur de vues seulement si ce n'est pas pour édition
    if (req.query.context !== 'edit') {
      blog.views = (blog.views || 0) + 1;
      await blog.save();
    }

    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    // Ajouter des options de filtrage et de pagination
    const {
      category,
      tag,
      status,
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;

    const query = {};

    // Filtrer par catégorie si spécifié
    if (category) {
      query.category = category;
    }

    // Filtrer par tag si spécifié
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Filtrer par statut si spécifié
    if (status) {
      query.status = status;
    } else {
      // Si aucun statut n'est spécifié :
      // - Les admins/superAdmins voient tous les statuts par défaut
      // - Les autres utilisateurs ne voient que les blogs publiés
      if (
        !(
          req.user &&
          (req.user.role === "admin" || req.user.role === "superAdmin")
        )
      ) {
        query.status = "published";
      }
      // Si c'est un admin et aucun statut n'est spécifié, query.status reste non défini pour tout récupérer
    }

    // Calculer le nombre total de blogs correspondant à la requête
    const total = await Blog.countDocuments(query);

    // Récupérer les blogs avec pagination et tri
    const blogs = await Blog.find(query)
      .populate("author", "name email") // Ajustez selon votre modèle d'utilisateur
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))
      .exec();

    res.status(200).json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  upload(req, res, async (err) => {
    if (err)
      return res
        .status(400)
        .json({ message: "Upload error", error: err.message });

    try {
      const { title, description, content, category, tags, status } = req.body;
      const blogId = req.params.id;

      // Récupérer le blog existant pour vérifier les permissions
      const existingBlog = await Blog.findById(blogId);

      if (!existingBlog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      // Vérifier les permissions (si l'authentification est implémentée)
      if (req.user && req.user._id && existingBlog.author) {
        const isAuthor =
          req.user._id.toString() === existingBlog.author.toString();
        const isAdmin =
          req.user.role === "admin" || req.user.role === "superAdmin";

        if (!isAuthor && !isAdmin) {
          return res
            .status(403)
            .json({ message: "Not authorized to update this blog" });
        }
      }

      const mainImageBlogFile = req.files["mainImageBlog"]?.[0];
      const otherImagesBlogFiles = req.files["otherImagesBlog"] || [];

      // Traiter les tags s'ils sont fournis
      let tagArray = existingBlog.tags || [];
      if (tags) {
        // Si tags est une chaîne, la diviser en tableau
        if (typeof tags === "string") {
          tagArray = tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
        } else if (Array.isArray(tags)) {
          tagArray = tags;
        }
      }

      const updateData = {
        title: title || existingBlog.title,
        description: description || existingBlog.description,
        content: content || existingBlog.content,
        category: category || existingBlog.category,
        tags: tagArray,
        status: status || existingBlog.status,
      };

      // Mettre à jour l'image principale si fournie
      if (mainImageBlogFile) {
        // Supprimer l'ancienne image si elle existe
        if (
          existingBlog.mainImageBlog &&
          fs.existsSync(existingBlog.mainImageBlog)
        ) {
          fs.unlinkSync(existingBlog.mainImageBlog);
        }
        updateData.mainImageBlog = mainImageBlogFile.path;
      }

      // Mettre à jour les images supplémentaires si fournies
      if (otherImagesBlogFiles.length > 0) {
        // Supprimer les anciennes images si elles existent
        if (
          existingBlog.otherImagesBlog &&
          existingBlog.otherImagesBlog.length > 0
        ) {
          existingBlog.otherImagesBlog.forEach((img) => {
            if (fs.existsSync(img)) {
              fs.unlinkSync(img);
            }
          });
        }
        updateData.otherImagesBlog = otherImagesBlogFiles.map(
          (file) => file.path
        );
      }

      const updatedBlog = await Blog.findByIdAndUpdate(blogId, updateData, {
        new: true,
      });

      res
        .status(200)
        .json({ message: "Blog updated successfully", blog: updatedBlog });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const blogId = req.params.id;

    // Récupérer le blog existant pour vérifier les permissions
    const existingBlog = await Blog.findById(blogId);

    if (!existingBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Vérifier les permissions (si l'authentification est implémentée)
    if (req.user && req.user._id && existingBlog.author) {
      const isAuthor =
        req.user._id.toString() === existingBlog.author.toString();
      const isAdmin =
        req.user.role === "admin" || req.user.role === "superAdmin";

      if (!isAuthor && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this blog" });
      }
    }

    const deletedBlog = await Blog.findByIdAndDelete(blogId);

    // Supprimer les images du blog
    try {
      if (
        deletedBlog.mainImageBlog &&
        fs.existsSync(deletedBlog.mainImageBlog)
      ) {
        fs.unlinkSync(deletedBlog.mainImageBlog);
      }

      if (
        deletedBlog.otherImagesBlog &&
        deletedBlog.otherImagesBlog.length > 0
      ) {
        deletedBlog.otherImagesBlog.forEach((img) => {
          if (fs.existsSync(img)) {
            fs.unlinkSync(img);
          }
        });
      }
    } catch (fileError) {
      console.warn(
        "Erreur lors de la suppression des fichiers:",
        fileError.message
      );
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Ajouter un commentaire à un blog
exports.addComment = async (req, res) => {
  try {
    const { name, email, comment } = req.body;
    const blogId = req.params.id;

    // Valider les données
    if (!name || !email || !comment) {
      return res
        .status(400)
        .json({ message: "Name, email and comment are required" });
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Créer le nouveau commentaire
    const newComment = {
      user: req.user ? req.user._id : null,
      name,
      email,
      comment,
      date: new Date(),
    };

    // Ajouter le commentaire au blog
    if (!blog.comments) {
      blog.comments = [];
    }

    blog.comments.push(newComment);
    await blog.save();

    res
      .status(201)
      .json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Supprimer un commentaire
exports.deleteComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Vérifier si le commentaire existe
    const commentIndex = blog.comments.findIndex(
      (c) => c._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Vérifier les permissions (si l'authentification est implémentée)
    const comment = blog.comments[commentIndex];

    if (req.user && req.user._id) {
      const isCommentAuthor =
        comment.user && comment.user.toString() === req.user._id.toString();
      const isBlogAuthor =
        blog.author && blog.author.toString() === req.user._id.toString();
      const isAdmin =
        req.user.role === "admin" || req.user.role === "superAdmin";

      if (!isCommentAuthor && !isBlogAuthor && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this comment" });
      }
    }

    // Supprimer le commentaire
    blog.comments.splice(commentIndex, 1);
    await blog.save();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Obtenir les blogs par catégorie
exports.getBlogsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = { category, status: "published" };

    const total = await Blog.countDocuments(query);

    const blogs = await Blog.find(query)
      .populate("author", "name email")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))
      .exec();

    res.status(200).json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Obtenir les blogs par tag
exports.getBlogsByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = { tags: { $in: [tag] }, status: "published" };

    const total = await Blog.countDocuments(query);

    const blogs = await Blog.find(query)
      .populate("author", "name email")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))
      .exec();

    res.status(200).json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Rechercher des blogs
exports.searchBlogs = async (req, res) => {
  try {
    const { q } = req.query;
    const { page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const query = {
      $and: [
        { status: "published" },
        {
          $or: [
            { title: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
            { content: { $regex: q, $options: "i" } },
            { tags: { $in: [new RegExp(q, "i")] } },
          ],
        },
      ],
    };

    const total = await Blog.countDocuments(query);

    const blogs = await Blog.find(query)
      .populate("author", "name email")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))
      .exec();

    res.status(200).json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Obtenir les blogs récents
exports.getRecentBlogs = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const blogs = await Blog.find({ status: "published" })
      .sort("-createdAt")
      .limit(Number.parseInt(limit))
      .select("title description mainImageBlog category createdAt")
      .exec();

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Obtenir les blogs populaires (basés sur les vues)
exports.getPopularBlogs = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const blogs = await Blog.find({ status: "published" })
      .sort("-views")
      .limit(Number.parseInt(limit))
      .select("title description mainImageBlog category createdAt views")
      .exec();

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Obtenir toutes les catégories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Blog.distinct("category", { status: "published" });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Obtenir tous les tags
exports.getAllTags = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" }).select("tags");

    // Extraire tous les tags et éliminer les doublons
    const allTags = blogs.reduce((tags, blog) => {
      if (blog.tags && blog.tags.length > 0) {
        return [...tags, ...blog.tags];
      }
      return tags;
    }, []);

    const uniqueTags = [...new Set(allTags)];

    res.status(200).json(uniqueTags);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

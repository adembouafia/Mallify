const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const blogSchema = new mongoose.Schema({
    mainImageBlog: {
        type: String,
        required: true,
    },
    otherImagesBlog: {
        type: [String],
        default: []
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        default: "Non catégorisé"
    },
    tags: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ["published", "draft"],
        default: "published"
    },
    comments: [commentSchema],
    views: {
        type: Number,
        default: 0
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},{
    timestamps: true
});

module.exports = mongoose.model("Blog", blogSchema);
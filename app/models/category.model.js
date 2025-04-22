const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  }
}, {
  timestamps: true // Ajoute createdAt et updatedAt
});

module.exports = mongoose.model('Category', categorySchema);
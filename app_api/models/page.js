const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, enum: ['rooms', 'meals', 'news', 'about'] },
  values: { type: Map, of: String, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('pages', pageSchema);

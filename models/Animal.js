// models/Animal.js
const mongoose = require('mongoose');

const AnimalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['dog','cat','other'], default: 'dog' },
  breed: String,
  age: String,
  size: String,
  description: String,
  photo: String,       // filepath or public URL
  adopted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Animal', AnimalSchema);

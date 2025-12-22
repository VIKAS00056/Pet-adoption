const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);



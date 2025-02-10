const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    primaryKey: true,
    autoIncrement: true,
  }, // ObjectId แทน UUID
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  prefix: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  birth_date: {
    type: Date,
  },
  address: {
    type: String,
  },
  registration_date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  role_id: {
    type: mongoose.Schema.Types.ObjectId, // ObjectId สำหรับ role_id
    ref: "Role",
    required: true,
  },
  referrer_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  total_classes: {
    type: Number,
  },
  remaining_classes: {
    type: Number,
  },
  special_rights: {
    type: String,
  },
  deleted: { type: Boolean, default: false }, // ฟิลด์สำหรับ soft delete
});

module.exports = mongoose.model("User", userSchema);

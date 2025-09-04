const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    primaryKey: true,
    autoIncrement: true,
  }, // ObjectId แทน UUID
  username: {
    type: String,
    required: false,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  nickname: {
    type: String,
  },
  code: {
    type: String,
  },
  phone: {
    type: String,
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
    type: String,
    default: "Member",
  },
  referrer_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  total_classes: {
    type: Number,
  },
  remaining_session: {
    type: Number,
  },
  first_used_date: {
    type: Date,
    default: null,
  },
  sessions_expiry_date: {
    type: Date,
    default: null,
  },
  special_rights: {
    type: String,
  },
  userTerms: {
    type: Boolean,
    default: false, // ฟิลด์สำหรับเก็บข้อมูลการยอมรับเง
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpiry: {
    type: Date,
  },

  deleted: { type: Boolean, default: false }, // ฟิลด์สำหรับ soft delete
});

module.exports = mongoose.model("User", userSchema);

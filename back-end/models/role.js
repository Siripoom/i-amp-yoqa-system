// models/role.js
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  role_name: { type: String, required: true },
  description: { type: String },
});

module.exports = mongoose.model("Role", roleSchema);

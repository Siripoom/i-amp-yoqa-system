const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  key: { type: String, default: "default", unique: true },
  transactional_enabled: { type: Boolean, default: true },
  reminders_enabled: { type: Boolean, default: true },
  reminder_offset_hours: { type: Number, min: 1, max: 168, default: 24 },
  quiet_hours_start: { type: String, default: "22:00" },
  quiet_hours_end: { type: String, default: "07:00" },
}, { timestamps: true });

module.exports = mongoose.model("NotificationSettings", schema);

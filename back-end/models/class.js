const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start_date: { type: Date, required: false },
  end_date: { type: Date, required: false },
  instructor: { type: String, required: false },
  capacity: { type: Number, required: false },
});

module.exports = mongoose.model("Class", classSchema);

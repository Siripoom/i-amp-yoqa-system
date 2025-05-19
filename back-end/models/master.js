const mongoose = require("mongoose");

const masterSchema = new mongoose.Schema(
  {
    mastername: { type: String, required: true },
    image: { type: String, required: false }, // เก็บชื่อไฟล์ที่ใช้ใน GridFS
    video: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Master", masterSchema);

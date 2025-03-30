const mongoose = require("mongoose");

const heroImageSchema = new mongoose.Schema(
  {
    image: { type: String, required: false }, // เก็บชื่อไฟล์ที่ใช้ใน GridFS
  },
  { timestamps: true }
);

module.exports = mongoose.model("HeroImage", heroImageSchema);

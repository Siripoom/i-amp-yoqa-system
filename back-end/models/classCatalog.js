const mongoose = require("mongoose");

const masterSchema = new mongoose.Schema(
  {
    classname: { type: String, required: true },
    image: { type: String, required: false }, // เก็บชื่อไฟล์ที่ใช้ใน GridFS
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClassCatalog", masterSchema);

const mongoose = require("mongoose");

const masterSchema = new mongoose.Schema(
  {
    mastername: { type: String, required: true },
    image: { type: String, required: false }, // เก็บ URL ของรูปภาพ
    videoUrl: { type: String, required: false }, // เก็บลิงก์วิดีโอจาก YouTube
  
  },
  { timestamps: true }
);

module.exports = mongoose.model("Master", masterSchema);

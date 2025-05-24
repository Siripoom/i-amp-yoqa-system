const mongoose = require("mongoose");

const sliderImageSchema = new mongoose.Schema(
  {
    title: { type: String, required: false }, // ชื่อรูปภาพ
    image: { type: String, required: true }, // URL ของรูปภาพ
    description: { type: String, required: false }, // คำอธิบายรูปภาพ
    isActive: { type: Boolean, default: true }, // สถานะการแสดงผล
    order: { type: Number, default: 0 }, // ลำดับการแสดงผล
  },
  { timestamps: true }
);

module.exports = mongoose.model("SliderImage", sliderImageSchema);

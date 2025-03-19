const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sessions: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // หน่วยเป็นวัน หรือชั่วโมง ขึ้นอยู่กับธุรกิจของคุณ
      required: true,
    },
    image: {
      type: String, // เก็บชื่อไฟล์ที่ใช้ใน GridFS
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

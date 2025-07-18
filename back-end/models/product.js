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
    promotion: {
      price: {
        type: Number, // ราคาที่ลดแล้ว
        required: false,
      },
      startDate: {
        type: Date, // วันที่เริ่มโปรโมชั่น
        required: false,
      },
      endDate: {
        type: Date, // วันที่สิ้นสุดโปรโมชั่น
        required: false,
      },
    },
    hotSale: {
      type: Boolean, // ใช้สำหรับระบุว่าสินค้านี้เป็น Hot Sale
      default: false,
    },
    image: {
      type: String, // เก็บชื่อไฟล์ที่ใช้ใน GridFS
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

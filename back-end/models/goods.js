const mongoose = require("mongoose");

const goods = new mongoose.Schema(
  {
    goods: { type: String, required: false },
    code: {
      type: String,
      unique: true,
    },

    detail: { type: String, required: false },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      default: "ชิ้น",
    },
    size: {
      type: String,
      required: false,
      trim: true,
    },
    color: {
      type: String,
      required: false,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
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

module.exports = mongoose.model("Goods", goods);

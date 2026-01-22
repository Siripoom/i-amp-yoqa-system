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
      type: [String], // เปลี่ยนจาก String เป็น Array ของ String
      required: false,
      validate: {
        validator: function (v) {
          return v.length <= 3; // จำกัดไม่เกิน 3 ภาพ
        },
        message: "Maximum 3 images allowed",
      },
    },
    isActive: {
      type: Boolean, // ใช้สำหรับระบุว่าสินค้านี้แสดงให้ลูกค้าเห็นหรือไม่
      default: true,
    },
    isDeleted: {
      type: Boolean, // ใช้สำหรับ soft delete
      default: false,
    },
    deletedAt: {
      type: Date, // วันที่ลบ
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goods", goods);

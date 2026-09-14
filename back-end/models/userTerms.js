const mongoose = require("mongoose");

const userTermsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    otherName: {
      type: String,
      default: "",
    },
    otherPhone: {
      type: String,
      default: "",
    },

    // เก็บข้อมูลการยินยอมแต่ละข้อแยกกัน
    privacyConsents: {
      registration: {
        type: Boolean,
        default: false,
        required: true, // จำเป็น
      },
      monitoring: {
        type: Boolean,
        default: false,
        required: true, // จำเป็น
      },
      planning: {
        type: Boolean,
        default: false,
        required: true, // จำเป็น
      },
      communication: {
        type: Boolean,
        default: false,
        required: true, // จำเป็น
      },
      publicity: {
        type: Boolean,
        default: false,
        required: false, // ไม่บังคับ
      },
    },
    // เก็บการยอมรับข้อกำหนดทั่วไป
    termsAccepted: {
      type: Boolean,
      default: false,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // เพิ่ม createdAt และ updatedAt อัตโนมัติ
  }
);

module.exports = mongoose.model("UserTerms", userTermsSchema);

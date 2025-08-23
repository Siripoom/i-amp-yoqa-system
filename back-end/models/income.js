const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    // ข้อมูลหลัก
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // ประเภทรายรับ
    income_type: {
      type: String,
      enum: ["package", "product", "goods", "session", "manual"],
      required: true,
    },

    // วันที่ที่เกิดรายรับ
    income_date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // อ้างอิงไปยัง order (ถ้ามีการเชื่อมโยง)
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    // อ้างอิงไปยัง reservation (สำหรับ session)
    reservation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },

    // รายละเอียดเพิ่มเติม
    notes: {
      type: String,
      trim: true,
    },

    // สถานะ
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "confirmed",
    },

    // ผู้สร้างข้อมูล
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // การกรอง/จัดกลุ่ม
    category: {
      type: String,
      default: "general",
    },

    // เก็บข้อมูลการชำระเงิน
    payment_method: {
      type: String,
      enum: ["cash", "transfer", "qr_code", "credit_card", "other"],
      default: "transfer",
    },

    // หมายเลขอ้างอิง (สำหรับการโอนเงิน)
    reference_number: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
incomeSchema.index({ income_date: 1 });
incomeSchema.index({ income_type: 1 });
incomeSchema.index({ status: 1 });
incomeSchema.index({ created_by: 1 });
incomeSchema.index({ order_id: 1 });
incomeSchema.index({ reservation_id: 1 });

// Virtual fields
incomeSchema.virtual("formatted_amount").get(function () {
  return this.amount.toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
  });
});

// Methods
incomeSchema.methods.isValid = function () {
  return this.status === "confirmed" && this.amount > 0;
};

module.exports = mongoose.model("Income", incomeSchema);

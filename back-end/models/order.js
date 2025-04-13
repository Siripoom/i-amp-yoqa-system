const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    image: {
      type: String, // เก็บ URL ของรูปภาพ
      required: false,
    },
    status: {
      type: String,
      enum: ["รออนุมัติ", "อนุมัติ", "ยกเลิก"],
      default: "รออนุมัติ",
    },
    order_date: {
      type: Date,
      default: Date.now,
    },
    approval_date: {
      type: Date,
      default: null,
    },
    first_used_date: {
      type: Date,
      default: null,
    },
    invoice_number: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    unit_price: {
      type: Number,
      required: false,
    },
    total_price: {
      type: Number,
      required: false,
    },
    total_sessions: {
      type: Number,
      required: false,
    },
    total_duration: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

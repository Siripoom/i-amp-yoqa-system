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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

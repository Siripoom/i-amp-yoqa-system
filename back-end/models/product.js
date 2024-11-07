const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    stock: { type: Number, required: false, default: 0 },
    type: {
      type: String,
      enum: ["general", "course"],
      required: true,
    },
    sessions: {
      type: Number,
      required: function () {
        return this.type === "course";
      },
      default: 0,
    },
    imageUrl: { type: String }, // เพิ่มฟิลด์สำหรับเก็บ path ของรูปภาพ
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

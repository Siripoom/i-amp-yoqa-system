const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sessions: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

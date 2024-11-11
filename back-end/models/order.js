const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assumes there's a User model for buyer
      required: true,
    },
    items: [
      {
        product_type: {
          type: String,
          enum: ["general", "course"], // Dynamically references either Product or Course
          required: true,
        },
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "items.product_type", // Dynamically references either Product or Course
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    address: {
      type: String,
      required: function () {
        // Requires an address if there's a general product
        return this.items.some((item) => item.product_type === "general");
      },
    },
    order_date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "completed", "canceled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

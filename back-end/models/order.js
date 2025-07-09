const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ใช้ discriminator pattern เพื่อรองรับทั้ง product และ goods
    order_type: {
      type: String,
      enum: ["product", "goods"],
      required: true,
    },

    // สำหรับ product orders
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: function () {
        return this.order_type === "product";
      },
    },

    // สำหรับ goods orders
    goods_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goods",
      required: function () {
        return this.order_type === "goods";
      },
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

    // สำหรับ goods orders - ข้อมูลเพิ่มเติม
    unit: {
      type: String,
      required: function () {
        return this.order_type === "goods";
      },
      default: "ชิ้น",
    },
    size: {
      type: String,
      required: false,
    },
    color: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: function () {
        return this.order_type === "goods";
      },
    },
    phone_number: {
      type: String,
      required: function () {
        return this.order_type === "goods";
      },
    },

    // สำหรับ product orders - ข้อมูลเดิม
    total_sessions: {
      type: Number,
      required: function () {
        return this.order_type === "product";
      },
    },
    total_duration: {
      type: Number,
      required: function () {
        return this.order_type === "product";
      },
    },
  },
  { timestamps: true }
);

// Index สำหรับ performance
orderSchema.index({ user_id: 1, order_type: 1 });
orderSchema.index({ order_date: -1 });
orderSchema.index({ status: 1 });

// Virtual สำหรับดึงข้อมูล item ที่สั่ง (product หรือ goods)
orderSchema.virtual("item", {
  refPath: function () {
    return this.order_type === "product" ? "product_id" : "goods_id";
  },
  localField: function () {
    return this.order_type === "product" ? "product_id" : "goods_id";
  },
  foreignField: "_id",
  justOne: true,
});

// Method สำหรับคำนวณราคารวม
orderSchema.methods.calculateTotalPrice = function () {
  if (this.unit_price && this.quantity) {
    this.total_price = this.unit_price * this.quantity;
  }
  return this.total_price;
};

// Pre-save middleware สำหรับ validation
orderSchema.pre("save", function (next) {
  // ตรวจสอบว่ามี product_id หรือ goods_id เพียงอันเดียว
  if (this.order_type === "product" && this.goods_id) {
    this.goods_id = undefined;
  }
  if (this.order_type === "goods" && this.product_id) {
    this.product_id = undefined;
  }

  // คำนวณราคารวมอัตโนมัติ
  this.calculateTotalPrice();

  next();
});

// Static method สำหรับ query builder
orderSchema.statics.findByType = function (orderType) {
  return this.find({ order_type: orderType });
};

orderSchema.statics.findProductOrders = function () {
  return this.find({ order_type: "product" }).populate("product_id");
};

orderSchema.statics.findGoodsOrders = function () {
  return this.find({ order_type: "goods" }).populate("goods_id");
};

module.exports = mongoose.model("Order", orderSchema);

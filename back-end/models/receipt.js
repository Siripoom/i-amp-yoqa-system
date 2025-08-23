const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({
  receiptNumber: { type: String, unique: true, required: true }, // เลขรันนิ่งใบเสร็จ
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  }, // อ้างอิง order
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  customerAddress: { type: String },
  companyInfo: {
    name: String,
    address: String,
    phone: String,
  },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
    },
  ],
  totalAmount: { type: Number, required: true },
  template: { type: String }, // กำหนด template
  qrCode: { type: String }, // เก็บ QR Code (base64 หรือ url)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Receipt", receiptSchema);

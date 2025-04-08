const mongoose = require("mongoose");

const paymentQRCodeSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, "กรุณาอัปโหลดรูปภาพ QR code"],
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// อัปเดตเวลาเมื่อมีการแก้ไขข้อมูล
paymentQRCodeSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const PaymentQRCode = mongoose.model("PaymentQRCode", paymentQRCodeSchema);

module.exports = PaymentQRCode;

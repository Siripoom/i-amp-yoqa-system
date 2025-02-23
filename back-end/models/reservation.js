const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
  class_id: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reservation_date: { type: Date, default: Date.now }, // วันที่จอง
  status: {
    type: String,
    enum: ["Reserved", "Cancelled"],
    default: "Reserved",
  },
});

module.exports = mongoose.model("reservation", reservationSchema);

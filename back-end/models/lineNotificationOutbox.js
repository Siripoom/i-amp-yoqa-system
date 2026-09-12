const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    event_key: { type: String, required: true, unique: true, index: true },
    line_user_id: { type: String, required: true, index: true },
    type: { type: String, enum: ["reservation_confirmed", "reservation_cancelled"], required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["pending", "accepted", "failed"], default: "pending", index: true },
    attempts: { type: Number, default: 0 },
    next_attempt_at: { type: Date, default: Date.now, index: true },
    accepted_at: Date,
    last_error: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("LineNotificationOutbox", schema);

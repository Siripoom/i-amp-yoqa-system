const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    course_name: { type: String, required: true },
    details: { type: String },
    user_id: {
      type: mongoose.Schema.Types.ObjectId, // เปลี่ยนจาก UUID เป็น ObjectId
      ref: "User",
      required: true,
    },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);

const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    course_name: { type: String, required: true },
    details: { type: String },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    deleted: { type: Boolean, default: false },
    imageUrl: { type: String }, // ฟิลด์ใหม่สำหรับเก็บ path ของรูปภาพ
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);

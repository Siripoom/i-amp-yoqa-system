const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    course_name: { type: String, required: true },
    details: { type: String },
    difficulty: { type: Number },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);

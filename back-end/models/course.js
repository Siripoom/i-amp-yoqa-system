const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    course_name: { type: String, required: true },
    details: { type: String },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deleted: { type: Boolean, default: false },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema); // Ensure this name is "Course"

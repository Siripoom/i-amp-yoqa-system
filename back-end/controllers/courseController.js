const Course = require("../models/course");

// สร้างคอร์สใหม่
exports.createCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json({ status: "success", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ดึงข้อมูลคอร์สทั้งหมด (ยกเว้นที่ถูกลบ)
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ deleted: false }).populate("user_id");
    res.status(200).json({ status: "success", courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ดึงข้อมูลคอร์สตาม ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("user_id");
    if (!course || course.deleted) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({ status: "success", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// อัปเดตคอร์ส
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!course || course.deleted) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({ status: "success", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ลบคอร์สแบบ Soft Delete
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { deleted: true },
      { new: true }
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({
      status: "success",
      message: "Course soft deleted successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

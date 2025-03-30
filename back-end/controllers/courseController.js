const Course = require("../models/course");
const upload = require("../utils/uploadConfig"); // นำเข้า Multer config

// สร้างคอร์สใหม่พร้อมรูปภาพ
exports.createCourse = [
  upload.single("image"), // ใช้ multer สำหรับอัปโหลดไฟล์
  async (req, res) => {
    try {
      const courseData = {
        course_name: req.body.course_name,
        details: req.body.details,
        user_id: req.body.user_id,
        difficulty: req.body.difficulty,
      };

      const course = new Course(courseData);
      await course.save();
      res.status(201).json({ status: "success", course });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];

// อัปเดตคอร์สพร้อมแก้ไขรูปภาพ
exports.updateCourse = [
  upload.single("image"), // ใช้ multer สำหรับอัปโหลดไฟล์
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course || course.deleted) {
        return res.status(404).json({ message: "Course not found" });
      }

      // อัปเดตข้อมูลคอร์ส
      course.course_name = req.body.course_name || course.course_name;
      course.details = req.body.details || course.details;
      course.user_id = req.body.user_id || course.user_id;

      // อัปเดต path ของรูปภาพถ้ามีการอัปโหลดใหม่
      if (req.file) {
        course.imageUrl = req.file.path;
      }

      await course.save();
      res.status(200).json({ status: "success", course });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];

// ดึงข้อมูลคอร์สทั้งหมด (ยกเว้นที่ถูกลบ)
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ deleted: false }).populate("user_id");
    res
      .status(200)
      .json({ status: "success", CourseCount: courses.length, courses });
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

exports.restoreCourse = async (req, res) => {
  try {
    console.log("ok");

    console.log("Course ID to restore:", req.params.id); // Debug: ตรวจสอบว่า ID ที่ถูกส่งมาตรงหรือไม่

    // ค้นหาคอร์สตาม id และทำการ restore (ตั้งค่า deleted เป็น false)
    const course = await Course.findById(req.params.id);

    // ตรวจสอบว่าคอร์สมีอยู่หรือไม่
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // ตรวจสอบสถานะ deleted ของคอร์ส
    if (!course.deleted) {
      return res.status(400).json({ message: "Course is not deleted" });
    }

    // ทำการ restore คอร์ส
    course.deleted = false;
    await course.save();

    res.status(200).json({
      status: "success",
      message: "Course restored successfully",
      course: course,
    });
  } catch (error) {
    console.error("Error in restoreCourse:", error); // Debug: ดู error ที่เกิดขึ้นใน log
    res.status(500).json({ message: error.message });
  }
};

const express = require("express");
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  restoreCourse,
} = require("../controllers/courseController");

// Route สำหรับสร้างคอร์ส
router.post("/", createCourse);

// Route สำหรับดึงข้อมูลคอร์สทั้งหมด
router.get("/", getCourses);

// Route สำหรับดึงข้อมูลคอร์สตาม ID
router.get("/:id", getCourseById);

// Route สำหรับอัปเดตคอร์ส
router.put("/:id", updateCourse);

// Route สำหรับลบคอร์สแบบ Soft Delete
router.delete("/:id", deleteCourse);

// Route สำหรับ restore คอร์ส
router.put("/restore/:id", restoreCourse); // เพิ่มเส้นทางนี้เพื่อ restore คอร์ส

module.exports = router;

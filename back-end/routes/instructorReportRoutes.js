const express = require("express");
const router = express.Router();
const instructorReportController = require("../controllers/instructorReportController");

// Route สำหรับดึงรายงานผู้สอนทั้งหมด
router.get("/", instructorReportController.getInstructorReport);

// Route สำหรับดึงรายงานผู้สอนรายบุคคล
router.get(
  "/:instructorName",
  instructorReportController.getInstructorDetailReport
);

// Route สำหรับดลบรายงานผู้สอนตามชื่อ
router.delete(
  "/:instructorName",
  instructorReportController.deleteInstructorReport
);

module.exports = router;

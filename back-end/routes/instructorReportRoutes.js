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

module.exports = router;

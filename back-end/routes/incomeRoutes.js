const express = require("express");
const router = express.Router();
const {
  getTotalIncomeByPeriod,
  getIncomeByType,
  getIncomeByPeriod,
  createManualIncome,
  getAllIncome,
  updateIncome,
  deleteIncome,
  getIncomeById,
  exportIncomeToCSV,
} = require("../controllers/incomeController");

const { authenticate } = require("../middlewares/auth");

// F003: แสดงยอดรายรับรวมตามช่วงเวลาที่กำหนด
router.get("/total", getTotalIncomeByPeriod);

// F004: จัดกลุ่มรายรับตามประเภท (แพ็คเกจ/สินค้า)
router.get("/by-type", getIncomeByType);

// F005: แสดงรายรับรายวัน รายเดือน และรายปี
router.get("/by-period", getIncomeByPeriod);

// Export to CSV (put this before /:id to avoid conflicts)
router.get("/export/csv", exportIncomeToCSV);

// CRUD operations
router.post("/manual", authenticate, createManualIncome);
router.get("/", getAllIncome);
router.get("/:id", getIncomeById);
router.put("/:id", authenticate, updateIncome);
router.delete("/:id", authenticate, deleteIncome);

module.exports = router;

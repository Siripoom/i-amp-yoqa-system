const express = require("express");
const router = express.Router();
const {
  upload,
  createExpense,
  getExpensesByCategory,
  getAllExpenses,
  getTotalExpenseByPeriod,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getExpenseById,
  downloadReceipt,
} = require("../controllers/expenseController");

const { authenticate } = require("../middlewares/auth");
router.use(authenticate);
// F006: เพิ่ม แก้ไข และลบข้อมูลรายจ่าย
// F008: อัปโหลดใบเสร็จรายจ่าย
router.post("/", upload.single("receipt"), createExpense);

// F007: จัดหมวดหมู่รายจ่าย
router.get("/by-category", getExpensesByCategory);

// F009: ค้นหาและกรองข้อมูลรายจ่าย
router.get("/", getAllExpenses);

// F010: แสดงยอดรายจ่ายรวมตามช่วงเวลา
router.get("/total", getTotalExpenseByPeriod);

// CRUD operations
router.get("/:id", getExpenseById);
router.put("/:id", upload.single("receipt"), updateExpense);
router.delete("/:id", deleteExpense);

// Approval operations
router.post("/:id/approve", approveExpense);
router.post("/:id/reject", rejectExpense);

// Receipt download
router.get("/:id/receipt", downloadReceipt);

module.exports = router;

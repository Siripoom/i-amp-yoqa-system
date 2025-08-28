const express = require("express");
const router = express.Router();
const {
  generateProfitLossReport,
  generateCashFlowReport,
  getMonthlySummary,
  getFinancialComparison,
  exportFinancialReportToExcel,
  exportFinancialReportToCSV,
} = require("../controllers/financialReportController");

const { authenticate } = require("../middlewares/auth");

// F011: สร้างรายงานกำไร-ขาดทุน (P&L Statement)
router.get("/profit-loss", generateProfitLossReport);

// F012: สร้างรายงานกระแสเงินสด (Cash Flow)
router.get("/cash-flow", generateCashFlowReport);

// F013: สรุปยอดรายรับ-รายจ่ายรายเดือน
router.get("/monthly-summary", getMonthlySummary);

// F014: เปรียบเทียบข้อมูลการเงินระหว่างเดือน
router.get("/comparison", getFinancialComparison);

// F015: ส่งออกรายงานเป็นไฟล์ Excel
router.get("/export/excel", exportFinancialReportToExcel);

// F016: ส่งออกรายงานเป็นไฟล์ CSV
router.get("/export/csv", exportFinancialReportToCSV);

module.exports = router;

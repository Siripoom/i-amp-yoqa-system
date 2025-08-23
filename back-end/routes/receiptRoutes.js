const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");

// สร้างใบเสร็จ
router.post("/", receiptController.createReceipt);
// สร้างใบเสร็จแบบ manual
router.post("/manual", receiptController.createManualReceipt);
// ค้นหาใบเสร็จด้วยเลขที่ใบเสร็จ
router.get("/number/:number", receiptController.getReceiptByNumber);
// ค้นหาใบเสร็จด้วยชื่อลูกค้า
router.get("/customer", receiptController.getReceiptsByCustomer);
// ค้นหาใบเสร็จด้วยช่วงวันที่
router.get("/date", receiptController.getReceiptsByDateRange);
// ดาวน์โหลดใบเสร็จเป็น PDF
router.get("/:id/pdf", receiptController.downloadReceiptPDF);
// พิมพ์ใบเสร็จ
router.get("/:id/print", receiptController.printReceipt);

module.exports = router;

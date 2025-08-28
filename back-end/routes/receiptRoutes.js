const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");


// ดึงใบเสร็จทั้งหมด
router.get("/", receiptController.getAllReceipts);
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
// ดาวน์โหลดใบเสร็จเป็น PDF จาก DOCX template
router.get("/:id/pdf", receiptController.downloadReceiptPDF);
// ดาวน์โหลดใบเสร็จเป็น DOCX จาก template
router.get("/:id/docx", receiptController.downloadReceiptDOCX);
// พิมพ์ใบเสร็จ
router.get("/:id/print", receiptController.printReceipt);
// ดึงใบเสร็จตาม user ID
router.get("/user/:userId", receiptController.getReceiptsByUserId);
// ดึงใบเสร็จตาม order ID
router.get("/order/:orderId", receiptController.getReceiptByOrderId);

module.exports = router;

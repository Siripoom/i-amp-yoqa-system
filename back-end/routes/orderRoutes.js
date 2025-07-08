const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// สร้างคำสั่งซื้อใหม่ พร้อมอัปโหลดรูปภาพ (รองรับทั้ง product และ goods)
router.post(
  "/",
  orderController.upload.single("image"),
  orderController.createOrder
);

// ดึงข้อมูลคำสั่งซื้อทั้งหมด
router.get("/", orderController.getAllOrders);

// ดึงข้อมูลคำสั่งซื้อตาม order_type (product หรือ goods)
router.get("/type/:order_type", orderController.getOrdersByType);

// ดึงสถิติการสั่งซื้อ
router.get("/stats", orderController.getOrderStats);

// ดึงข้อมูลคำสั่งซื้อโดย ID
router.get("/:id", orderController.getOrderById);

// อัปเดตคำสั่งซื้อ
router.put(
  "/:id",
  orderController.upload.single("image"),
  orderController.updateOrder
);

// อัปเดตสถานะคำสั่งซื้อ
router.put("/:id/status", orderController.updateOrderStatus);

// ดึงรายการ Order ทั้งหมดของ User ID ที่กำหนด
router.get("/user/:user_id", orderController.getOrdersByUserId);

// ลบคำสั่งซื้อ
router.delete("/:id", orderController.deleteOrder);

module.exports = router;

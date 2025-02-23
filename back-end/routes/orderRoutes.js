const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// สร้างคำสั่งซื้อใหม่ พร้อมอัปโหลดรูปภาพ
router.post(
  "/",
  orderController.upload.single("image"),
  orderController.createOrder
);

// ดึงข้อมูลคำสั่งซื้อทั้งหมด
router.get("/", orderController.getAllOrders);

// ดึงข้อมูลคำสั่งซื้อโดย ID
router.get("/:id", orderController.getOrderById);

// ลบคำสั่งซื้อ
router.delete("/:id", orderController.deleteOrder);

router.get("/user/:user_id", orderController.getOrdersByUserId);

router.put("/:id/status", orderController.updateOrderStatus);
module.exports = router;

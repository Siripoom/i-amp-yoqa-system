const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");

// Route สำหรับสร้างคำสั่งซื้อใหม่
router.post("/", createOrder);

// Route สำหรับดึงข้อมูลคำสั่งซื้อทั้งหมด
router.get("/", getOrders);

// Route สำหรับดึงข้อมูลคำสั่งซื้อตาม ID
router.get("/:id", getOrderById);

// Route สำหรับอัปเดตคำสั่งซื้อ
router.put("/:id", updateOrder);

// Route สำหรับลบคำสั่งซื้อ
router.delete("/:id", deleteOrder);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// Route สำหรับสร้างสินค้าใหม่
router.post("/", createProduct);

// Route สำหรับดึงข้อมูลสินค้าทั้งหมด
router.get("/", getProducts);

// Route สำหรับดึงข้อมูลสินค้าตาม ID
router.get("/:id", getProductById);

// Route สำหรับอัปเดตสินค้า
router.put("/:id", updateProduct);

// Route สำหรับลบสินค้า
router.delete("/:id", deleteProduct);

module.exports = router;

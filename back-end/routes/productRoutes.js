const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductImage,
} = require("../controllers/productController");
const { upload } = require("../utils/upload");

// อัปโหลดไฟล์ภาพตอนสร้างสินค้า
router.post("/", upload.single("image"), createProduct);

// Route สำหรับดึงข้อมูลสินค้าทั้งหมด
router.get("/", getProducts);

// Route สำหรับดึงข้อมูลสินค้าตาม ID
router.get("/:id", getProductById);

// Route สำหรับดึงรูปภาพสินค้า
router.get("/image/:filename", getProductImage);

// Route สำหรับอัปเดตสินค้า
router.put("/:id", updateProduct);

// Route สำหรับลบสินค้า
router.delete("/:id", deleteProduct);

module.exports = router;

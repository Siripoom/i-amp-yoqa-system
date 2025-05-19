const express = require("express");
const router = express.Router();
const {
  createMaster,
  getMasters,
  getMasterById,
  updateMaster,
  deleteMaster,
} = require("../controllers/masterController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route สำหรับสร้างคอร์ส - now supports image upload
router.post("/", upload.single("image"), createMaster);

// Route สำหรับดึงข้อมูลคอร์สทั้งหมด
router.get("/", getMasters);

// Route สำหรับดึงข้อมูลคอร์สตาม ID
router.get("/:id", getMasterById);

// Route สำหรับอัปเดตคอร์ส - now supports image upload
router.put("/:id", upload.single("image"), updateMaster);

// Route สำหรับลบคอร์สแบบ Soft Delete
router.delete("/:id", deleteMaster);

module.exports = router;

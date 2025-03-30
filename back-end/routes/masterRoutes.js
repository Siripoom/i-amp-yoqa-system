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
const upload = multer({ storage: multer.memoryStorage() });
// Route สำหรับสร้างคอร์ส
router.post("/", upload.single("image"), createMaster);

// Route สำหรับดึงข้อมูลคอร์สทั้งหมด
router.get("/", getMasters);

// Route สำหรับดึงข้อมูลคอร์สตาม ID
router.get("/:id", getMasterById);

// Route สำหรับอัปเดตคอร์ส
router.put("/:id", updateMaster);

// Route สำหรับลบคอร์สแบบ Soft Delete
router.delete("/:id", deleteMaster);

module.exports = router;

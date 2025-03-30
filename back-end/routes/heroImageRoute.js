const express = require("express");
const router = express.Router();
const {
  createHeroImage,
  getHeroImage,
  updateHeroImage,
  deleteHeroImage,
} = require("../controllers/heroImageController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
// Route สำหรับสร้างคอร์ส
router.post("/", upload.single("image"), createHeroImage);

// Route สำหรับดึงข้อมูลคอร์สทั้งหมด
router.get("/", getHeroImage);

// Route สำหรับอัปเดตคอร์ส
router.put("/:id", upload.single("image"), updateHeroImage);

// Route สำหรับลบคอร์สแบบ Soft Delete
router.delete("/:id", deleteHeroImage);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  createSliderImage,
  getSliderImages,
  getAllSliderImages,
  getSliderImageById,
  updateSliderImage,
  deleteSliderImage,
} = require("../controllers/sliderImageController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// Routes สำหรับ Slider Images
router.post("/", upload.single("image"), createSliderImage);
router.get("/", getSliderImages); // เฉพาะ active images
router.get("/all", getAllSliderImages); // ทั้งหมดรวม inactive
router.get("/:id", getSliderImageById);
router.put("/:id", upload.single("image"), updateSliderImage);
router.delete("/:id", deleteSliderImage);

module.exports = router;

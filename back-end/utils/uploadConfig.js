const multer = require("multer");
const path = require("path");

// กำหนดที่เก็บไฟล์และตั้งชื่อไฟล์ใหม่
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // ตั้งชื่อไฟล์ใหม่ด้วย timestamp
  },
});

// ฟิลเตอร์ไฟล์ที่รับเฉพาะรูปภาพ
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG and PNG are allowed!"), false);
  }
};

// ตั้งค่า Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // ขนาดไฟล์ไม่เกิน 5MB
});

module.exports = upload;

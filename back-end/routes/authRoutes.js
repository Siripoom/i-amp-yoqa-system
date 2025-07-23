const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  loginLine,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/authController");
const { check } = require("express-validator");
const authController = require("../controllers/authController");

router.post("/line", loginLine);
// Route สำหรับเข้าสู่ระบบ
router.post("/login", login);

// Route ทดสอบการตรวจสอบ Token
router.get("/me", getMe);

// Route สำหรับขอรีเซ็ตรหัสผ่าน
router.post("/request-password-reset", requestPasswordReset);

// Route สำหรับรีเซ็ตรหัสผ่าน
router.post("/reset-password", resetPassword);

module.exports = router;

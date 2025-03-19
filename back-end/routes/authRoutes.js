const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { check } = require("express-validator");
const authController = require("../controllers/authController");

router.get("/line", authController.lineLogin);
router.get("/line/callback", authController.lineCallback);
// Route สำหรับเข้าสู่ระบบ
router.post("/login", login);

// Route ทดสอบการตรวจสอบ Token
router.get("/me", getMe);

module.exports = router;

const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { check } = require("express-validator");

// Route สำหรับเข้าสู่ระบบ
router.post("/login", login);

// Route ทดสอบการตรวจสอบ Token
router.get("/me", getMe);

module.exports = router;

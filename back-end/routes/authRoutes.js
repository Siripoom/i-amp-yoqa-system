const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyToken,
} = require("../controllers/authController");
const { check } = require("express-validator");

// Route สำหรับเข้าสู่ระบบ
router.post("/login", login);

// Route ทดสอบการตรวจสอบ Token
router.get("/protected", verifyToken, (req, res) => {
  res.status(200).json({ message: "Access granted", user: req.user });
});

module.exports = router;

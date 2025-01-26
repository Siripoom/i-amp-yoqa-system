const jwt = require("jsonwebtoken");
require("dotenv").config();
const secretKey = process.env.JWT_SECRET;

// Middleware สำหรับตรวจสอบ JWT Token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // เก็บข้อมูล user จาก token ไว้ใน req.user

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware สำหรับตรวจสอบ role (Admin เท่านั้น)
const authorizeAdmin = (req, res, next) => {
  // console.log("teq token", req.token);
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

// Middleware สำหรับตรวจสอบ role (Admin และ User ได้)
const authorizeUserOrAdmin = (req, res, next) => {
  if (!["admin", "user"].includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied." });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin, authorizeUserOrAdmin };

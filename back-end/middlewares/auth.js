const jwt = require("jsonwebtoken");
require("dotenv").config();
const secretKey = process.env.JWT_SECRET;

// Middleware สำหรับตรวจสอบ JWT Token
const authenticate = (req, res, next) => {
  console.log("🔑 Debug authenticate middleware:");
  console.log("  - Authorization header:", req.headers.authorization);

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // เก็บข้อมูล user จาก token ไว้ใน req.user

    console.log("✅ Token verified successfully:");
    console.log("  - Decoded user ID:", decoded.userId);
    console.log("  - Decoded role:", decoded.role);
    console.log("  - Decoded user name:", decoded.user);

    next();
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware สำหรับตรวจสอบ role (Admin เท่านั้น)
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

// Middleware สำหรับตรวจสอบ role (Admin และ User ได้)
const authorizeUserOrAdmin = (req, res, next) => {
  console.log("🔐 Debug authorizeUserOrAdmin:");
  console.log("  - User role from token:", req.user.role);
  console.log("  - User ID from token:", req.user.userId);

  // อนุญาตให้ role ต่างๆ เข้าถึงได้
  const allowedRoles = ["Admin", "SuperAdmin", "Accounting", "Member", "user"];

  if (!allowedRoles.includes(req.user.role)) {
    console.log("❌ Access denied - role not allowed:", req.user.role);
    return res.status(403).json({ error: "Access denied." });
  }

  console.log("✅ Access granted - role allowed:", req.user.role);
  next();
};

module.exports = { authenticate, authorizeAdmin, authorizeUserOrAdmin };

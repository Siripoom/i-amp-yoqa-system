const express = require("express");
const authController = require("../controllers/authController");

const createAuthRouter = ({ lineLogin = authController.loginLine } = {}) => {
  const router = express.Router();

  router.post("/line", lineLogin);
  // Route สำหรับเข้าสู่ระบบ
  router.post("/login", authController.login);

  // Route ทดสอบการตรวจสอบ Token
  router.get("/me", authController.getMe);

  // Route สำหรับขอรีเซ็ตรหัสผ่าน
  router.post("/request-password-reset", authController.requestPasswordReset);

  // Route สำหรับรีเซ็ตรหัสผ่าน
  router.post("/reset-password", authController.resetPassword);

  return router;
};

module.exports = createAuthRouter();
module.exports.createAuthRouter = createAuthRouter;

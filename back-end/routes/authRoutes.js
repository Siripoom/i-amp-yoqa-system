const express = require("express");
const authController = require("../controllers/authController");

const createAuthRouter = ({ controller = authController } = {}) => {
  const router = express.Router();

  router.post("/line", controller.loginLine);
  // Route สำหรับเข้าสู่ระบบ
  router.post("/login", controller.login);

  // Route ทดสอบการตรวจสอบ Token
  router.get("/me", controller.getMe);

  // Route สำหรับขอรีเซ็ตรหัสผ่าน
  router.post("/request-password-reset", controller.requestPasswordReset);

  // Route สำหรับรีเซ็ตรหัสผ่าน
  router.post("/reset-password", controller.resetPassword);

  return router;
};

module.exports = createAuthRouter();
module.exports.createAuthRouter = createAuthRouter;

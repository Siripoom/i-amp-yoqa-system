// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  restoreUser,
  getMe,
  deleteUserPermanently,
} = require("../controllers/userController");

const { authenticate } = require("../middlewares/auth");

router.post("/users", createUser);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUserPermanently);
router.put("/users/restore/:id", restoreUser); // เส้นทางสำหรับการกู้คืน User
// เส้นทางสำหรับดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
router.get("/me", authenticate, getMe);
module.exports = router;

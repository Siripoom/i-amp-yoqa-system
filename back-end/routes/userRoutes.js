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
  updateMe,
} = require("../controllers/userController");

const { authenticate } = require("../middlewares/auth");

router.post("/users", createUser);
router.get("/users", authenticate, getUsers);
router.get("/users/:id", authenticate, getUserById);
router.put("/users/:id", authenticate, updateUser);
router.delete("/users/:id", authenticate, deleteUserPermanently);
router.put("/users/restore/:id", authenticate, restoreUser); // เส้นทางสำหรับการกู้คืน User
// เส้นทางสำหรับดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateMe);
module.exports = router;

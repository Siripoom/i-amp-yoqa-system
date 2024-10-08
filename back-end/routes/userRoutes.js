// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

router.post("api/users", createUser);
router.get("api/users", getUsers);
router.get("api/users/:id", getUserById);
router.put("api/users/:id", updateUser);
router.delete("api/users/:id", deleteUser);

module.exports = router;

// routes/roleRoutes.js
const express = require("express");
const router = express.Router();
const {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

router.post("/roles", createRole);
router.get("/roles", getRoles);
router.put("/roles/:id", updateRole);
router.delete("/roles/:id", deleteRole);

module.exports = router;

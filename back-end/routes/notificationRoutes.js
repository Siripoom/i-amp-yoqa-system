const express = require("express");
const { authenticate } = require("../middlewares/auth");
const controller = require("../controllers/notificationController");

const router = express.Router();
router.get("/settings", authenticate, controller.getSettings);
router.patch("/settings", authenticate, controller.updateSettings);
router.get("/outbox/summary", authenticate, controller.getOutboxSummary);
module.exports = router;

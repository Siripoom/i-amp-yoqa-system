const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");

// POST: จองคลาส
router.post("/reserve", reservationController.createReservation);

// GET: ดูรายการคลาสที่จองไว้ของ Member
router.get("/user/:user_id", reservationController.getUserReservations);

// DELETE: ยกเลิกการจองคลาส
router.delete(
  "/cancel/:reservation_id",
  reservationController.cancelReservation
);

module.exports = router;

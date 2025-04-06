const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const { authenticate } = require("../middlewares/auth");

// POST: จองคลาส
router.post("/reserve", reservationController.createReservation);

// GET: ดูรายการคลาสที่จองไว้ของ Member
router.get("/user/:user_id", reservationController.getUserReservations);

// DELETE: ยกเลิกการจองคลาส
router.delete(
  "/cancel/:reservation_id",
  authenticate,
  reservationController.cancelReservation
);

//get all
router.get("/reserve", reservationController.getAllReservations);
module.exports = router;

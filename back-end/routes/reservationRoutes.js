const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const { authenticate } = require("../middlewares/auth");

// POST: จองคลาส
router.post("/reserve", authenticate, reservationController.createReservation);

// POST: จองคลาสในนาม Member (สำหรับ Admin)
router.post(
  "/admin/reserve",
  authenticate,
  reservationController.adminCreateReservation
);

// GET: ดูรายการคลาสที่จองไว้ของ Member
router.get("/user/:user_id", authenticate, reservationController.getUserReservations);

// DELETE: ยกเลิกการจองคลาส
router.delete(
  "/cancel/:reservation_id",
  authenticate,
  reservationController.cancelReservation
);

// DELETE: ยกเลิกการจองคลาส (สำหรับผู้ดูแลระบบ)
router.delete(
  "/admin/cancel/:reservation_id",
  authenticate,
  reservationController.cancelReservationById
);

//get all
router.get("/reserve", authenticate, reservationController.getAllReservations);
module.exports = router;

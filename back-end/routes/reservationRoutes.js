const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const { authenticate } = require("../middlewares/auth");

// POST: จองคลาส
router.post("/reserve", reservationController.createReservation);

// POST: จองคลาสในนาม Member (สำหรับ Admin)
router.post("/admin/reserve", reservationController.adminCreateReservation);

// GET: ดูรายการคลาสที่จองไว้ของ Member
router.get("/user/:user_id", reservationController.getUserReservations);

// DELETE: ยกเลิกการจองคลาส
router.delete(
  "/cancel/:reservation_id",
  authenticate,
  reservationController.cancelReservation
);

// DELETE: ยกเลิกการจองคลาส (สำหรับผู้ดูแลระบบ)
router.delete(
  "/admin/cancel/:reservation_id",
  reservationController.cancelReservationById
);

//get all
router.get("/reserve", reservationController.getAllReservations);
module.exports = router;

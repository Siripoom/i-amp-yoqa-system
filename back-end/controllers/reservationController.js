const Reservation = require("../models/reservation");
const Class = require("../models/class");
const User = require("../models/user");
const jwtDecode = require("jwt-decode");
const Order = require("../models/order");
// จองคลาส
// back-end/controllers/reservationController.js
exports.createReservation = async (req, res) => {
  try {
    const { class_id, user_id } = req.body;

    // Check if class exists
    const yogaClass = await Class.findById(class_id);
    if (!yogaClass) return res.status(404).json({ message: "Class not found" });

    // Get user
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user has sessions
    if (user.remaining_session === 0) {
      return res.status(400).json({
        message: "Cannot reserve class, please buy a promotion",
      });
    }

    // Check expiration date
    const today = new Date();
    if (user.sessions_expiry_date && user.sessions_expiry_date < today) {
      return res.status(400).json({
        message: "Your sessions have expired. Please purchase a new promotion.",
      });
    }

    // If this is the first time using sessions
    if (!user.first_used_date) {
      // Set first used date
      user.first_used_date = today;

      // Find the most recent approved order for this user
      const latestOrder = await Order.findOne({
        user_id: user_id,
        status: "อนุมัติ",
      })
        .sort({ approval_date: -1 })
        .populate("product_id");

      // If we have an order with a duration, calculate new expiry based on product duration
      if (
        latestOrder &&
        latestOrder.product_id &&
        latestOrder.product_id.duration
      ) {
        const newExpiryDate = new Date();
        newExpiryDate.setDate(
          newExpiryDate.getDate() + latestOrder.total_duration
        );
        user.sessions_expiry_date = newExpiryDate;
      }

      // Update the order's first used date
      if (latestOrder) {
        latestOrder.first_used_date = today;
        await latestOrder.save();
      }
    }

    // Decrement user's session count & save user
    user.remaining_session -= 1;
    await user.save();

    // Update class participants
    yogaClass.participants.push(user.first_name);
    yogaClass.amount += 1;
    await yogaClass.save();

    // Create the reservation
    const newReservation = new Reservation({ class_id, user_id });
    await newReservation.save();

    res.status(201).json({
      message: "Reservation created successfully",
      reservation: newReservation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ดูรายการคลาสที่จองไว้
exports.getUserReservations = async (req, res) => {
  try {
    const { user_id } = req.params;
    const reservations = await Reservation.find({
      user_id,
      status: "Reserved",
    }).populate("class_id", "title start_date end_date instructor");

    res.status(200).json({ reservations });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ยกเลิกการจองคลาส
exports.cancelReservation = async (req, res) => {
  try {
    const { reservation_id } = req.params;
    const token = req.user; // ได้มาจาก middleware ที่ decode JWT แล้ว

    // 🔍 ดึงข้อมูลการจอง พร้อมข้อมูล user
    const reservation = await Reservation.findById(reservation_id).populate(
      "user_id"
    );
    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });

    // 🔍 ดึงข้อมูลคลาส
    const yogaClass = await Class.findById(reservation.class_id);
    if (!yogaClass) return res.status(404).json({ message: "Class not found" });

    // ✅ ป้องกัน amount ติดลบ
    yogaClass.amount = Math.max(0, (yogaClass.amount || 0) - 1);

    // ✅ ลบชื่อผู้ใช้ที่ยกเลิกออกจาก participants
    const fullName = reservation.user_id.first_name;

    yogaClass.participants = yogaClass.participants.filter(
      (participant) => participant !== fullName
    );

    await yogaClass.save();

    // ✅ เพิ่ม session ให้ user
    const user = await User.findById(token.userId);
    if (user) {
      user.remaining_session += 1;
      await user.save();
    }

    // ✅ เปลี่ยนสถานะการจอง
    reservation.status = "Cancelled";
    await reservation.save();

    res.status(200).json({ message: "Reservation cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get all
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("class_id", "title start_time end_time instructor")
      .populate("user_id", "first_name")
      .sort({ createdAt: -1 }); // Sort by createdAt in descending order
    res.status(200).json({ reservations });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add this new function to your reservationController.js file

// ยกเลิกการจองโดยใช้ ID โดยตรง (สำหรับการดูแลระบบ)
exports.cancelReservationById = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    // 🔍 ดึงข้อมูลการจอง พร้อมข้อมูล user และ class
    const reservation = await Reservation.findById(reservation_id)
      .populate("user_id")
      .populate("class_id");

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // 🔍 ตรวจสอบว่าคลาสยังมีอยู่หรือไม่
    const yogaClass = await Class.findById(reservation.class_id._id);
    if (!yogaClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // ✅ ลดจำนวนผู้เข้าร่วมในคลาส
    // ป้องกันการเกิด NaN โดยใช้การตรวจสอบค่า
    let currentAmount = yogaClass.amount || 0;
    yogaClass.amount = Math.max(0, currentAmount - 1);

    // ✅ ลบชื่อผู้ใช้ที่ยกเลิกออกจาก participants
    const userName = reservation.user_id.first_name;

    // ป้องกันกรณี participants ไม่ใช่ array
    if (!Array.isArray(yogaClass.participants)) {
      yogaClass.participants = [];
    } else {
      yogaClass.participants = yogaClass.participants.filter(
        (participant) => participant !== userName
      );
    }

    // บันทึกการเปลี่ยนแปลงของคลาส
    await yogaClass.save();

    // ✅ เพิ่ม session ให้ user
    const user = await User.findById(reservation.user_id._id);
    if (user) {
      // เพิ่มจำนวนคลาสที่ยังเหลืออยู่
      const currentRemaining = user.remaining_session || 0;
      user.remaining_session = currentRemaining + 1;
      await user.save();
    }

    // ✅ เปลี่ยนสถานะการจอง
    reservation.status = "Cancelled";
    await reservation.save();

    res.status(200).json({
      message: "Reservation cancelled successfully",
      data: {
        reservation: reservation,
        class: yogaClass,
        user: user,
      },
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

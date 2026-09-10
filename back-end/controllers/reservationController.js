const Reservation = require("../models/reservation");
const Class = require("../models/class");
const User = require("../models/user");
const jwtDecode = require("jwt-decode");
const Order = require("../models/order");
const {
  getMissingMemberProfileFields,
  isGenderAllowed,
} = require("../utils/memberProfile");
const { activatePackageOnFirstUse } = require("../utils/packageExpiry");

const validateBookingProfile = (user, yogaClass, res) => {
  const missingFields = getMissingMemberProfileFields(user);
  if (missingFields.length > 0) {
    res.status(422).json({
      code: "PROFILE_INCOMPLETE",
      message: "Please complete your member profile before booking",
      missing_fields: missingFields,
    });
    return false;
  }

  if (!isGenderAllowed(user.gender, yogaClass.allowed_gender || "all")) {
    res.status(403).json({
      code: "GENDER_NOT_ALLOWED",
      message: "This class is not available for the member's gender",
    });
    return false;
  }
  return true;
};

// จองคลาส
// back-end/controllers/reservationController.js
exports.createReservation = async (req, res) => {
  try {
    const { class_id, user_id } = req.body;
    if (String(req.user.userId) !== String(user_id)) {
      return res.status(403).json({ message: "Cannot book for another member" });
    }

    // Check if class exists
    const yogaClass = await Class.findById(class_id);
    if (!yogaClass) return res.status(404).json({ message: "Class not found" });

    // Get user
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!validateBookingProfile(user, yogaClass, res)) return;

    // Check if user has sessions
    if (!user.remaining_session || user.remaining_session <= 0) {
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

    activatePackageOnFirstUse(user, today);

    // Decrement user's session count & save user
    user.remaining_session -= 1;
    console.log(`📉 Session decremented. Remaining: ${user.remaining_session}`);
    await user.save();

    // Update class participants
    const displayName = user.nickname
      ? `${user.nickname} ${user.first_name}`
      : user.first_name;
    yogaClass.participants.push(displayName);
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
    const canReadAny = ["Admin", "SuperAdmin", "Accounting"].includes(
      req.user.role
    );
    if (!canReadAny && String(req.user.userId) !== String(user_id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const reservations = await Reservation.find({
      user_id,
      status: "Reserved",
    })
      .sort({ reservation_date: -1 })
      .populate("class_id", "title start_time end_time instructor");

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
    if (String(reservation.user_id._id) !== String(token.userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 🔍 ดึงข้อมูลคลาส
    const yogaClass = await Class.findById(reservation.class_id);
    if (!yogaClass) return res.status(404).json({ message: "Class not found" });

    // ✅ ป้องกัน amount ติดลบ
    yogaClass.amount = Math.max(0, (yogaClass.amount || 0) - 1);

    // ✅ ลบชื่อผู้ใช้ที่ยกเลิกออกจาก participants
    const displayName = reservation.user_id.nickname
      ? `${reservation.user_id.nickname} ${reservation.user_id.first_name}`
      : reservation.user_id.first_name;

    yogaClass.participants = yogaClass.participants.filter(
      (participant) => participant !== displayName
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
    if (!["Admin", "SuperAdmin", "Accounting"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const reservations = await Reservation.find()
      .populate("class_id", "title start_time end_time instructor")
      .populate("user_id", "first_name nickname")
      .sort({ createdAt: -1 }); // Sort by createdAt in descending order
    res.status(200).json({ reservations });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// จองคลาสในนาม Member (สำหรับ Admin)
exports.adminCreateReservation = async (req, res) => {
  try {
    if (!["Admin", "SuperAdmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { class_id, user_id } = req.body;

    // Check if class exists
    const yogaClass = await Class.findById(class_id);
    if (!yogaClass) return res.status(404).json({ message: "Class not found" });

    // Get user
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!validateBookingProfile(user, yogaClass, res)) return;

    // Check if user has sessions
    if (!user.remaining_session || user.remaining_session <= 0) {
      return res.status(400).json({
        message: "Cannot reserve class, user has no remaining sessions",
      });
    }

    // Check expiration date
    const today = new Date();
    if (user.sessions_expiry_date && user.sessions_expiry_date < today) {
      return res.status(400).json({
        message: "User's sessions have expired. Please purchase a new promotion.",
      });
    }

    // Check if user already has a reservation for this class
    const existingReservation = await Reservation.findOne({
      class_id,
      user_id,
      status: "Reserved",
    });

    if (existingReservation) {
      return res.status(400).json({
        message: "User already has a reservation for this class",
      });
    }

    activatePackageOnFirstUse(user, today);

    // Decrement user's session count & save user
    user.remaining_session -= 1;
    console.log(`📉 Session decremented. Remaining: ${user.remaining_session}`);
    await user.save();

    // Update class participants
    const displayName = user.nickname
      ? `${user.nickname} ${user.first_name}`
      : user.first_name;
    yogaClass.participants.push(displayName);
    yogaClass.amount += 1;
    await yogaClass.save();

    // Create the reservation
    const newReservation = new Reservation({ class_id, user_id });
    await newReservation.save();

    res.status(201).json({
      message: "Reservation created successfully by admin",
      reservation: newReservation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add this new function to your reservationController.js file

// ยกเลิกการจองโดยใช้ ID โดยตรง (สำหรับการดูแลระบบ)
exports.cancelReservationById = async (req, res) => {
  try {
    if (!["Admin", "SuperAdmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
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
    const displayName = reservation.user_id.nickname
      ? `${reservation.user_id.nickname} ${reservation.user_id.first_name}`
      : reservation.user_id.first_name;

    // ป้องกันกรณี participants ไม่ใช่ array
    if (!Array.isArray(yogaClass.participants)) {
      yogaClass.participants = [];
    } else {
      yogaClass.participants = yogaClass.participants.filter(
        (participant) => participant !== displayName
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

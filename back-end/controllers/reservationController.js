const Reservation = require("../models/reservation");
const Class = require("../models/class");
const User = require("../models/user");
const jwtDecode = require("jwt-decode");
// จองคลาส
exports.createReservation = async (req, res) => {
  try {
    const { class_id, user_id } = req.body;

    // ตรวจสอบว่ามีคลาสนี้อยู่หรือไม่
    const yogaClass = await Class.findById(class_id);
    if (!yogaClass) return res.status(404).json({ message: "Class not found" });
    // update จำนวนผู้เรียน และผูเข้าร่วมคลาส
    const user = await User.findById(user_id);
    // ตรวจสอบว่าผู้ใช้มี session != 0 หรือไม่
    if (user.remaining_session === 0) {
      // "ไม่สามารถจองได้เนื่องจากไม่มี session กรุณาซ้อ promotion"
      return res.status(400).json({
        message: "Cannot reserve class, please buy a promotion",
      });
    }
    // ลดจำนวน session ของผู้ใช้ลง 1
    user.remaining_session -= 1;
    await user.save();
    yogaClass.participants.push(user.first_name + " " + user.last_name);
    yogaClass.amount += 1;
    await yogaClass.save();
    // ตรวจสอบความจุของคลาส
    const reservationsCount = await Reservation.countDocuments({
      class_id,
      status: "Reserved",
    });
    if (reservationsCount >= yogaClass.capacity) {
      return res.status(400).json({ message: "Class is full" });
    }

    // สร้างการจอง
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
    yogaClass.amount = Math.max(0, yogaClass.amount - 1);

    // ✅ ลบชื่อผู้ใช้ที่ยกเลิกออกจาก participants
    const fullName =
      reservation.user_id.first_name + " " + reservation.user_id.last_name;

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
      .populate("class_id", "title start_date end_date instructor")
      .populate("user_id", "fist_name last_name");
    res.status(200).json({ reservations });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instructor: { type: String, required: false }, // อาจารย์ผู้สอน
  description: { type: String, required: false }, // รายละเอียดของคลาส
  room_number: { type: String, required: false }, // หมายเลขห้อง
  passcode: { type: String, required: false }, // รหัสผ่านเข้าห้อง
  zoom_link: { type: String, required: false }, // ลิงก์ Zoom
  start_time: { type: Date, required: true }, // เวลาเริ่มคลาส
  end_time: { type: Date, required: true }, // เวลาสิ้นสุดคลาส
  difficulty: { type: Number, required: false }, // ระดับความยาก
  amount: { type: Number, required: false }, // จำนวนผู้เรียน
  // ผู้ที่เข้าร่วมคลาส
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Class", classSchema);

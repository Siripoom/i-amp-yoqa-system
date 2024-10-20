// controllers/userController.js
const User = require("../models/user");
const Role = require("../models/role");
const bcrypt = require("bcrypt"); // นำเข้า bcrypt
const jwt = require("jsonwebtoken");
// สร้าง User ใหม่
exports.createUser = async (req, res) => {
  try {
    // ค้นหา role_id จาก role_name ที่ส่งมาใน body
    const role = await Role.findOne({ role_name: req.body.role_name });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    console.log(req.body.password);

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // สร้าง User ใหม่
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      prefix: req.body.prefix,
      phone: req.body.phone,
      birth_date: req.body.birth_date,
      address: req.body.address,
      registration_date: req.body.registration_date || Date.now(),
      role_id: role._id,
      referrer_id: req.body.referrer_id || null,
      total_classes: req.body.total_classes,
      remaining_classes: req.body.remaining_classes,
      special_rights: req.body.special_rights,
      deleted: false,
    });

    await user.save();

    // สร้าง JWT Token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // ส่ง response กลับไปพร้อมกับ Token
    res.status(201).json({
      status: "success",
      token: token,
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// อ่านข้อมูล User ทั้งหมด
exports.getUsers = async (req, res) => {
  try {
    // ค้นหา users ที่ไม่ได้ถูกลบ (deleted: false)
    const users = await User.find({ deleted: false }).populate("role_id");
    res.status(200).json({
      status: "success",
      userCount: users.length,
      users: users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// อ่านข้อมูล User ตาม _id
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const customer = req.query.customer === "true"; // ตรวจสอบค่า customer จาก query params

    // ถ้า customer เป็น false หรือไม่ถูกส่งมา, แสดงข้อมูลของ user ตาม _id
    if (!customer) {
      const user = await User.findById(userId).populate("role_id");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        status: "success",
        user: user,
      });
    }

    // ถ้า customer เป็น true, แสดงข้อมูลของผู้ใช้ที่มี referrer_id ตรงกับ _id ของ user นี้
    const usersWithSameReferrer = await User.find({
      referrer_id: userId,
      deleted: false,
    }).populate("role_id");
    if (usersWithSameReferrer.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found with this referrer_id" });
    }

    return res.status(200).json({
      status: "success",
      users: usersWithSameReferrer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// อัปเดต User
exports.updateUser = async (req, res) => {
  try {
    // ตรวจสอบว่า role_name ที่ส่งมาใน body นั้นมีอยู่หรือไม่
    const role = await Role.findOne({ role_name: req.body.role_name });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // ตรวจสอบว่ามีการส่ง password มาหรือไม่
    let updatedData = { ...req.body, role_id: role._id };

    // ถ้ามีการส่ง password ใหม่ ให้ทำการเข้ารหัส
    if (req.body.password) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      updatedData.password = hashedPassword; // อัปเดต password ที่เข้ารหัสแล้ว
    }

    // ตรวจสอบก่อนว่า user ถูก soft delete หรือไม่
    const user = await User.findOne({ _id: req.params.id, deleted: false }); // ค้นหาเฉพาะ user ที่ยังไม่ถูกลบ
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or has been deleted" });
    }

    // ทำการอัปเดตข้อมูล user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );

    // ส่ง response กลับไป
    res.status(200).json({
      status: "success",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ลบ User
exports.deleteUser = async (req, res) => {
  try {
    // ค้นหาและทำการ soft delete โดยการตั้งค่า deleted เป็น true
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { deleted: true },
      { new: true } // คืนค่า user ที่อัปเดตกลับมา
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      message: "User soft deleted successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.restoreUser = async (req, res) => {
  try {
    // ค้นหาและอัปเดตสถานะ deleted เป็น false เพื่อทำการกู้คืน
    const user = await User.findByIdAndUpdate(
      { _id: req.params.id }, // ค้นหา User ตาม _id
      { $set: { deleted: false } }, // อัปเดตฟิลด์ deleted เป็น false
      { new: true }
    );
    console.log(user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ส่ง response กลับไป
    res.status(200).json({
      status: "success",
      message: "User restored successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


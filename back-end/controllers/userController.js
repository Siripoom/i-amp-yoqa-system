// controllers/userController.js
const User = require("../models/user");
const Role = require("../models/role");
const bcrypt = require("bcrypt"); // นำเข้า bcrypt
const jwt = require("jsonwebtoken");
const {
  getMissingMemberProfileFields,
  normalizeMedicalProfile,
} = require("../utils/memberProfile");

const ADMIN_ROLES = ["Admin", "SuperAdmin"];
const USER_DIRECTORY_ROLES = [...ADMIN_ROLES, "Accounting", "Instructor"];

const serializeUser = (user, includeMedical = false) => {
  const data = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete data.password;
  delete data.resetPasswordToken;
  delete data.resetPasswordExpiry;
  if (!includeMedical) {
    delete data.has_medical_condition;
    delete data.medical_condition_details;
  }
  return data;
};

const sendProfileValidationError = (res, userData) => {
  const missingFields = getMissingMemberProfileFields(userData);
  if (missingFields.length === 0) return false;
  res.status(422).json({
    code: "PROFILE_INCOMPLETE",
    message: "Member profile is incomplete",
    missing_fields: missingFields,
  });
  return true;
};
// สร้าง User ใหม่
exports.createUser = async (req, res) => {
  try {
    const roleId = req.body.role_name || req.body.role_id || "Member";
    const normalizedProfile = normalizeMedicalProfile(req.body);
    if (
      sendProfileValidationError(res, {
        ...normalizedProfile,
        role_id: roleId,
      })
    ) {
      return;
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    //check if email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // สร้าง User ใหม่
    const user = new User({
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      nickname: req.body.nickname,
      code: req.body.code,
      phone: req.body.phone,
      birth_date: req.body.birth_date,
      gender: normalizedProfile.gender,
      address: normalizedProfile.address,
      has_medical_condition: normalizedProfile.has_medical_condition,
      medical_condition_details: normalizedProfile.medical_condition_details,
      registration_date: req.body.registration_date || Date.now(),
      role_id: roleId,
      referrer_id: req.body.referrer_id || null,
      total_classes: req.body.total_classes,
      remaining_session: req.body.remaining_session,
      special_rights: req.body.special_rights,
      deleted: false,
    });

    await user.save();

    // สร้าง JWT Token
    const token = jwt.sign(
      {
        userId: user._id,
        role: roleId,
        first_name: user.first_name,
        nickname: user.nickname,
      }, // ระบุค่า default role หากไม่มี role_name
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // ส่ง response กลับไปพร้อมกับ Token
    res.status(201).json({
      status: "success",
      token: token,
      user: serializeUser(user, true),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// อ่านข้อมูล User ทั้งหมด
exports.getUsers = async (req, res) => {
  try {
    if (!USER_DIRECTORY_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    // ค้นหา users ที่ไม่ได้ถูกลบ (deleted: false)
    const users = await User.find({ deleted: false })
      .sort({ _id: -1 }) //Sort by _id descending
      .populate("role_id");
    res.status(200).json({
      status: "success",
      userCount: users.length,
      users: users.map((user) =>
        serializeUser(user, ADMIN_ROLES.includes(req.user.role))
      ),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// อ่านข้อมูล User ตาม _id
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const canReadAny = USER_DIRECTORY_ROLES.includes(req.user.role);
    const isSelf = String(req.user.userId) === String(userId);
    if (!canReadAny && !isSelf) {
      return res.status(403).json({ message: "Access denied" });
    }
    const customer = req.query.customer === "true"; // ตรวจสอบค่า customer จาก query params

    // ถ้า customer เป็น false หรือไม่ถูกส่งมา, แสดงข้อมูลของ user ตาม _id
    if (!customer) {
      const user = await User.findById(userId).populate("role_id");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        status: "success",
        user: serializeUser(user, isSelf || ADMIN_ROLES.includes(req.user.role)),
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
      users: usersWithSameReferrer.map((user) =>
        serializeUser(user, ADMIN_ROLES.includes(req.user.role))
      ),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// อัปเดต User
exports.updateUser = async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    // ตรวจสอบว่ามีการส่ง password มาหรือไม่
    let updatedData = normalizeMedicalProfile(req.body);
    if (req.body.role_name || req.body.role_id) {
      updatedData.role_id = req.body.role_name || req.body.role_id;
    } else {
      delete updatedData.role_id;
    }
    delete updatedData.role_name;

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

    const prospectiveUser = {
      ...user.toObject(),
      ...updatedData,
      role_id: updatedData.role_id || user.role_id,
    };
    if (sendProfileValidationError(res, prospectiveUser)) return;

    // ทำการอัปเดตข้อมูล user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    // ส่ง response กลับไป
    res.status(200).json({
      status: "success",
      user: serializeUser(updatedUser, true),
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

// delete user permanently
exports.deleteUserPermanently = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      message: "User deleted permanently",
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
    // console.log(user);

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

// Get user profile
exports.getMe = async (req, res) => {
  try {
    // ดึงข้อมูลผู้ใช้จาก req.user (ที่ได้จาก token)
    const user = await User.findById(req.user.userId).select(
      "-password -resetPasswordToken -resetPasswordExpiry"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    console.log("Get Me Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update the logged-in user's personal profile without exposing admin fields.
exports.updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    const allowedFields = [
      "first_name",
      "last_name",
      "nickname",
      "phone",
      "birth_date",
      "gender",
      "address",
      "has_medical_condition",
      "medical_condition_details",
    ];
    const profileData = normalizeMedicalProfile(
      Object.fromEntries(
        allowedFields
          .filter((field) => req.body[field] !== undefined)
          .map((field) => [field, req.body[field]])
      )
    );
    const prospectiveUser = { ...user.toObject(), ...profileData };
    if (sendProfileValidationError(res, prospectiveUser)) return;

    Object.assign(user, profileData);
    await user.save();
    res.status(200).json({
      status: "success",
      user: serializeUser(user, true),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

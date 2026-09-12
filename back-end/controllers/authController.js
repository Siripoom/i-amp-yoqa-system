const User = require("../models/user");
const bcrypt = require("bcrypt");
const Role = require("../models/role");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const passport = require("passport");
const crypto = require("crypto");
const { verifyLineIdToken } = require("../services/lineIdentity");
const safeUser = (user) => {
  const data = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete data.password;
  delete data.resetPasswordToken;
  delete data.resetPasswordExpiry;
  return data;
};
// ฟังก์ชันการเข้าสู่ระบบ (Login)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password - using await for bcrypt.compare
    const isPasswordValid = await bcrypt.compare(password, user.password);
    // Log for debugging
    // console.log("Password validation result:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role_id,
        user: user.first_name + user.last_name,
        first_name: user.first_name,
        nickname: user.nickname,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({ message: "Login successful", token, data: safeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ฟังก์ชันการตรวจสอบ Token
exports.getMe = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      "-password -resetPasswordToken -resetPasswordExpiry"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const signApplicationTokenWithJwt = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

const createLineLoginHandler = ({
  MemberModel = User,
  verifyLineIdToken: verifyIdentity = verifyLineIdToken,
  signApplicationToken = signApplicationTokenWithJwt,
} = {}) => async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (typeof idToken !== "string" || !idToken.trim()) {
      return res.status(400).json({
        code: "LINE_ID_TOKEN_REQUIRED",
        message: "LINE ID token is required",
      });
    }

    const identity = await verifyIdentity(idToken);
    let user = await MemberModel.findOne({ line_user_id: identity.subject });

    if (!user) {
      user = await MemberModel.findOne({
        username: identity.subject,
        line_user_id: { $exists: false },
      });
    }

    if (user) {
      if (!user.line_user_id) {
        user.line_user_id = identity.subject;
        await user.save();
      }
    } else {
      user = new MemberModel({
        line_user_id: identity.subject,
        first_name: identity.displayName || "LINE Member",
        role_id: "Member",
        userTerms: false,
      });
      await user.save();
    }

    const token = signApplicationToken({
      userId: user._id,
      role: user.role_id,
      user: `${user.first_name || ""}${user.last_name || ""}`,
      first_name: user.first_name,
      nickname: user.nickname,
    });
    res.status(200).json({ message: "Login successful", token, data: safeUser(user) });
  } catch (error) {
    if (error && Number.isInteger(error.status) && error.code) {
      return res.status(error.status).json({
        code: error.code,
        message: error.message,
      });
    }
    if (error && error.code === 11000) {
      return res.status(409).json({
        code: "LINE_IDENTITY_CONFLICT",
        message: "LINE identity is already connected to another member",
      });
    }
    res.status(500).json({ message: "Unable to complete LINE login" });
  }
};

exports.createLineLoginHandler = createLineLoginHandler;
exports.loginLine = createLineLoginHandler();

// ฟังก์ชันขอรีเซ็ตรหัสผ่าน (Request Password Reset)
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // ตรวจสอบว่ามี email หรือไม่
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // ค้นหาผู้ใช้จาก email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist" });
    }

    // สร้าง reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // บันทึก reset token และ expiry ลงในฐานข้อมูล
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // ในโปรเจคจริง ควรส่ง email ที่มี reset link
    // สำหรับตอนนี้จะ return token เพื่อการทดสอบ
    res.status(200).json({
      message: "Password reset token generated successfully",
      resetToken: resetToken, // ในการใช้งานจริงไม่ควร return token ตรงนี้
      email: email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ฟังก์ชันรีเซ็ตรหัสผ่าน (Reset Password)
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // ตรวจสอบว่ามี resetToken และ newPassword หรือไม่
    if (!resetToken || !newPassword) {
      return res
        .status(400)
        .json({ message: "Reset token and new password are required" });
    }

    // ตรวจสอบความยาวรหัสผ่าน
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // ค้นหาผู้ใช้จาก reset token และตรวจสอบว่า token ยังไม่หมดอายุ
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // เข้ารหัสรหัสผ่านใหม่
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // อัพเดทรหัสผ่านและลบ reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

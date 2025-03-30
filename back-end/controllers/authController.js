const User = require("../models/user");
const bcrypt = require("bcrypt");
const Role = require("../models/role");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const passport = require("passport");
// ฟังก์ชันการเข้าสู่ระบบ (Login)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ตรวจสอบว่ามีผู้ใช้หรือไม่
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      { userId: user._id, role: user.role_name },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({ message: "Login successful", token, data: user });
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
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login with Line
exports.loginLine = async (req, res) => {
  try {
    const { userId, displayName } = req.body;
    var data = {
      username: userId,
      first_name: displayName,
      role_id: "Member",
    };
    var user = await User.findOneAndUpdate({ username: userId }, { new: true });
    if (user) {
      console.log("User found:", user);
    } else {
      user = new User(data);
      await user.save();
    }

    var playload = {
      user,
    };

    const token = jwt.sign(
      { userId: user._id, role: user.role_id },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({ message: "Login successful", token, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

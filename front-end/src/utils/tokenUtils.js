// ไฟล์: front-end/src/utils/tokenUtils.js
import { jwtDecode } from "jwt-decode";
import { message } from "antd";

/**
 * ตรวจสอบและดึงข้อมูลจาก token
 * @returns {Object|null} - ข้อมูล user หรือ null ถ้า token ไม่ถูกต้อง
 */
export const validateAndGetUserFromToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return null;
    }

    const decoded = jwtDecode(token);

    // ตรวจสอบว่า token หมดอายุหรือไม่
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      // Token หมดอายุ - ลบออกจาก localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("user_id");
      localStorage.removeItem("role");
      message.error("Session expired. Please login again.");
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Invalid token:", error);
    // Token ไม่ถูกต้อง - ลบออกจาก localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    return null;
  }
};

/**
 * ดึงชื่อเต็มของผู้ใช้จากหลายแหล่ง
 * @returns {string} - ชื่อเต็มของผู้ใช้
 */
export const getUserFullName = () => {
  const decoded = validateAndGetUserFromToken();
  if (!decoded) return "";

  // ลองดึงชื่อจาก token ก่อน - ใช้ nickname + first_name แทน
  if (decoded.nickname && decoded.first_name) {
    return `${decoded.nickname} ${decoded.first_name}`.trim();
  } else if (decoded.first_name) {
    return decoded.first_name.trim();
  }

  if (decoded.user && typeof decoded.user === "string") {
    return decoded.user;
  }

  // ถ้าไม่มีใน token ให้ดึงจาก localStorage
  const username = localStorage.getItem("username");
  return username || "";
};

/**
 * ตรวจสอบว่าชื่อผู้ใช้ตรงกับรายชื่อใน participants หรือไม่
 * @param {Array} participants - รายชื่อผู้เข้าร่วม
 * @param {string} userFullName - ชื่อเต็มของผู้ใช้
 * @returns {boolean}
 */
export const isUserInParticipants = (participants, userFullName) => {
  if (!Array.isArray(participants) || !userFullName) return false;

  const normalizedUserName = userFullName.toLowerCase().trim();

  return participants.some((participant) => {
    const normalizedParticipant = participant.toLowerCase().trim();

    // ตรวจสอบการตรงกันแบบเต็ม
    if (normalizedParticipant === normalizedUserName) return true;

    // ตรวจสอบการตรงกันแบบบางส่วน (กรณีชื่อสั้นหรือยาวต่างกัน)
    return (
      normalizedParticipant.includes(normalizedUserName) ||
      normalizedUserName.includes(normalizedParticipant)
    );
  });
};

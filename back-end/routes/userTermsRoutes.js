const express = require("express");
const router = express.Router();
const {
  createUserTerms,
  getUserTerms,
  updateUserTerms,
  deleteUserTerms,
  getAllUserTerms,
} = require("../controllers/userTermsController");
const { authenticate } = require("../middlewares/auth");

// เส้นทางสำหรับสร้าง User Terms (ต้องมี auth)
router.post("/user-terms", authenticate, createUserTerms);
// เส้นทางสำหรับดึงข้อมูล User Terms ตาม userId
router.get("/user-terms/:userId", getUserTerms);
// เส้นทางสำหรับอัปเดต User Terms ตาม userId
router.put("/user-terms/:userId", updateUserTerms);
// เส้นทางสำหรับลบ User Terms ตาม userId
router.delete("/user-terms/:userId", deleteUserTerms);
// เส้นทางสำหรับดึงข้อมูล User Terms ทั้งหมด
router.get("/user-terms", getAllUserTerms);
module.exports = router;

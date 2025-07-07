const userTerms = require("../models/userTerms");

exports.createUserTerms = async (req, res) => {
  try {
    const {
      userId,
      accepted,
      agreement1,
      agreement2,
      agreement3,
      agreement4,
      agreement5,
    } = req.body;

    // ตรวจสอบว่ามี User อยู่หรือไม่
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // สร้าง UserTerms ใหม่
    const userTermsData = new userTerms({
      userId,
      accepted,
      agreement1,
      agreement2,
      agreement3,
      agreement4,
      agreement5,
      acceptedAt: new Date(),
    });

    // บันทึกลงฐานข้อมูล
    await userTermsData.save();

    res.status(201).json({
      status: "success",
      message: "User terms created successfully",
      data: userTermsData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getUserTerms = async (req, res) => {
  try {
    const userId = req.params.userId;

    // ตรวจสอบว่ามี UserTerms สำหรับ userId นี้หรือไม่
    const userTermsData = await userTerms.findOne({ userId });

    if (!userTermsData) {
      return res.status(404).json({ message: "User terms not found" });
    }

    res.status(200).json({
      status: "success",
      data: userTermsData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateUserTerms = async (req, res) => {
  try {
    const userId = req.params.userId;
    const {
      accepted,
      agreement1,
      agreement2,
      agreement3,
      agreement4,
      agreement5,
    } = req.body;

    // ตรวจสอบว่ามี UserTerms สำหรับ userId นี้หรือไม่
    const userTermsData = await userTerms.findOne({ userId });

    if (!userTermsData) {
      return res.status(404).json({ message: "User terms not found" });
    }

    // อัปเดตข้อมูล UserTerms
    userTermsData.accepted = accepted;
    userTermsData.agreement1 = agreement1;
    userTermsData.agreement2 = agreement2;
    userTermsData.agreement3 = agreement3;
    userTermsData.agreement4 = agreement4;
    userTermsData.agreement5 = agreement5;
    userTermsData.acceptedAt = new Date();

    // บันทึกการเปลี่ยนแปลง
    await userTermsData.save();

    res.status(200).json({
      status: "success",
      message: "User terms updated successfully",
      data: userTermsData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteUserTerms = async (req, res) => {
  try {
    const userId = req.params.userId;

    // ลบ UserTerms สำหรับ userId นี้
    const userTermsData = await userTerms.findOneAndDelete({ userId });

    if (!userTermsData) {
      return res.status(404).json({ message: "User terms not found" });
    }

    res.status(200).json({
      status: "success",
      message: "User terms deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllUserTerms = async (req, res) => {
  try {
    const userTermsData = await userTerms.find();

    if (!userTermsData || userTermsData.length === 0) {
      return res.status(404).json({ message: "No user terms found" });
    }

    res.status(200).json({
      status: "success",
      data: userTermsData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

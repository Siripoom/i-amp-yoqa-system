const UserTerms = require("../models/userTerms");
const User = require("../models/user");

exports.createUserTerms = async (req, res) => {
  try {
    const { fullName } = req.body;

    // Get user ID from middleware (req.user is set by authenticate middleware)
    const userId = req.user.userId;

    const userTermsData = new UserTerms({
      fullName,
      accepted: true, // set to true when created
      acceptedAt: new Date(),
    });

    // Save to database
    await userTermsData.save();

    // Update user's userTerms field to true
    await User.findByIdAndUpdate(userId, { userTerms: true });

    res.status(201).json({
      status: "success",
      message: "User terms created successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getUserTerms = async (req, res) => {
  try {
    const userId = req.params.userId;

    // ตรวจสอบว่ามี UserTerms สำหรับ userId นี้หรือไม่
    const userTermsData = await UserTerms.findOne({ userId }).sort({
      acceptedAt: 1,
    });

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
    const userTermsId = req.params.userId; // This can be either userId or document _id
    const { fullName, accepted } = req.body;

    // Try to find by _id first, then by userId
    let userTermsData = await UserTerms.findById(userTermsId);

    if (!userTermsData) {
      userTermsData = await UserTerms.findOne({ userId: userTermsId });
    }

    if (!userTermsData) {
      return res.status(404).json({ message: "User terms not found" });
    }

    // อัปเดตข้อมูล UserTerms
    if (fullName !== undefined) userTermsData.fullName = fullName;
    if (accepted !== undefined) {
      userTermsData.accepted = accepted;
      if (accepted) {
        userTermsData.acceptedAt = new Date();
      }
    }

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
    const userTermsId = req.params.userId; // This can be either userId or document _id

    // Try to delete by _id first, then by userId
    let userTermsData = await UserTerms.findByIdAndDelete(userTermsId);

    if (!userTermsData) {
      userTermsData = await UserTerms.findOneAndDelete({ userId: userTermsId });
    }

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
    const userTermsData = await UserTerms.find().sort({ 
      acceptedAt: -1, 
      createdAt: -1 
    });

    res.status(200).json({
      status: "success",
      data: userTermsData,
      count: userTermsData.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

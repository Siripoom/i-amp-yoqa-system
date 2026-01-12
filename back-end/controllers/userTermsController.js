const UserTerms = require("../models/userTerms");
const User = require("../models/user");

exports.createUserTerms = async (req, res) => {
  try {
    const { fullName, privacyConsents, termsAccepted } = req.body;

    // Get user ID from middleware (req.user is set by authenticate middleware)
    const userId = req.user.userId;

    // ตรวจสอบว่าได้รับข้อมูลการยินยอมครบหรือไม่
    if (!privacyConsents || typeof privacyConsents !== "object") {
      return res.status(400).json({
        status: "error",
        message: "Privacy consents are required",
      });
    }

    // ตรวจสอบว่าข้อยินยอมที่จำเป็นครบหรือไม่
    const requiredConsents = [
      "registration",
      "monitoring",
      "planning",
      "communication",
    ];
    const missingConsents = requiredConsents.filter(
      (consent) => !privacyConsents[consent]
    );

    if (missingConsents.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Missing required consents: ${missingConsents.join(", ")}`,
      });
    }

    if (!termsAccepted) {
      return res.status(400).json({
        status: "error",
        message: "Terms must be accepted",
      });
    }

    const userTermsData = new UserTerms({
      fullName,
      otherName: req.body.otherName,
      otherPhone: req.body.otherPhone,
      privacyConsents: {
        registration: privacyConsents.registration || false,
        monitoring: privacyConsents.monitoring || false,
        planning: privacyConsents.planning || false,
        communication: privacyConsents.communication || false,
        publicity: privacyConsents.publicity || false,
      },
      termsAccepted: termsAccepted || false,
      acceptedAt: new Date(),
    });

    // Save to database
    await userTermsData.save();

    // Update user's userTerms field to true
    await User.findByIdAndUpdate(userId, { userTerms: true });

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
    const { fullName, privacyConsents, termsAccepted } = req.body;

    // Try to find by _id first, then by userId
    let userTermsData = await UserTerms.findById(userTermsId);

    if (!userTermsData) {
      userTermsData = await UserTerms.findOne({ userId: userTermsId });
    }

    if (!userTermsData) {
      return res.status(404).json({ message: "User terms not found" });
    }

    // อัปเดตข้อมูล UserTerms
    if (fullName !== undefined) {
      userTermsData.fullName = fullName;
    }

    if (privacyConsents !== undefined) {
      // อัปเดต privacy consents
      userTermsData.privacyConsents = {
        registration:
          privacyConsents.registration !== undefined
            ? privacyConsents.registration
            : userTermsData.privacyConsents.registration,
        monitoring:
          privacyConsents.monitoring !== undefined
            ? privacyConsents.monitoring
            : userTermsData.privacyConsents.monitoring,
        planning:
          privacyConsents.planning !== undefined
            ? privacyConsents.planning
            : userTermsData.privacyConsents.planning,
        communication:
          privacyConsents.communication !== undefined
            ? privacyConsents.communication
            : userTermsData.privacyConsents.communication,
        publicity:
          privacyConsents.publicity !== undefined
            ? privacyConsents.publicity
            : userTermsData.privacyConsents.publicity,
      };
    }

    if (termsAccepted !== undefined) {
      userTermsData.termsAccepted = termsAccepted;
      if (termsAccepted) {
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
      createdAt: -1,
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

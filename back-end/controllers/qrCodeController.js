const { StorageChanges, respondStorageError } = require("../services/storageChanges");
const PaymentQRCode = require("../models/paymentQrCode");
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// สร้าง QR code ใหม่
exports.createPaymentQRCode = async (req, res) => {
  const files = new StorageChanges();
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "กรุณาอัปโหลดรูปภาพ QR code",
      });
    }

    const imageUrl = await files.upload(req.file, "payment_qrcodes");

    // สร้างข้อมูล QR code ใหม่
    const newPaymentQRCode = await PaymentQRCode.create({
      image: imageUrl,
    });
    files.commit();

    res.status(201).json({
      status: "success",
      message: "สร้าง QR code สำเร็จ",
      data: newPaymentQRCode,
    });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error creating payment QR code:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  } finally {
    await files.finish();
  }
};

// ดึงข้อมูล QR code ทั้งหมด
exports.getAllPaymentQRCodes = async (req, res) => {
  try {
    const qrCodes = await PaymentQRCode.find().sort({ created_at: -1 });

    res.status(200).json({
      status: "success",
      count: qrCodes.length,
      data: qrCodes,
    });
  } catch (error) {
    console.error("Error fetching payment QR codes:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// ดึงข้อมูล QR code ที่ active อยู่

// ดึงข้อมูล QR code ตาม ID
exports.getPaymentQRCodeById = async (req, res) => {
  try {
    const qrCode = await PaymentQRCode.findById(req.params.id);

    if (!qrCode) {
      return res.status(404).json({
        status: "error",
        message: "ไม่พบ QR code ตาม ID ที่ระบุ",
      });
    }

    res.status(200).json({
      status: "success",
      data: qrCode,
    });
  } catch (error) {
    console.error("Error fetching payment QR code:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// อัปเดตข้อมูล QR code
exports.updatePaymentQRCode = async (req, res) => {
  const files = new StorageChanges();
  try {
    const { name, bank_name, account_name, account_number, is_active } =
      req.body;

    // ค้นหา QR code ที่ต้องการอัปเดต
    const qrCode = await PaymentQRCode.findById(req.params.id);

    if (!qrCode) {
      return res.status(404).json({
        status: "error",
        message: "ไม่พบ QR code ตาม ID ที่ระบุ",
      });
    }

    let imageUrl = qrCode.image;

    // ถ้ามีการอัปโหลดรูปภาพใหม่
    if (req.file) {
      imageUrl = await files.upload(req.file, "payment_qrcodes", imageUrl);
    }

    // ถ้าตั้งค่าเป็น active, ให้ตั้งค่า QR codes อื่นเป็น inactive
    if (is_active) {
      await PaymentQRCode.updateMany(
        { _id: { $ne: req.params.id } },
        { is_active: false }
      );
    }

    // อัปเดตข้อมูล
    const updatedQRCode = await PaymentQRCode.findByIdAndUpdate(
      req.params.id,
      {
        image: imageUrl,
        updated_at: Date.now(),
      },
      { new: true }
    );
    if (!updatedQRCode) return res.status(404).json({ status: "error", message: "QR code not found" });
    files.commit();

    res.status(200).json({
      status: "success",
      message: "อัปเดต QR code สำเร็จ",
      data: updatedQRCode,
    });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error updating payment QR code:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  } finally {
    await files.finish();
  }
};

// ลบ QR code
exports.deletePaymentQRCode = async (req, res) => {
  const files = new StorageChanges();
  try {
    const qrCode = await PaymentQRCode.findById(req.params.id);

    if (!qrCode) {
      return res.status(404).json({
        status: "error",
        message: "ไม่พบ QR code ตาม ID ที่ระบุ",
      });
    }

    files.removeAfterCommit(qrCode.image);

    // ลบข้อมูลจาก database
    await PaymentQRCode.findByIdAndDelete(req.params.id);
    files.commit();

    res.status(200).json({
      status: "success",
      message: "ลบ QR code สำเร็จ",
    });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error deleting payment QR code:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  } finally {
    await files.finish();
  }
};

const PaymentQRCode = require("../models/paymentQrCode");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const supabase = require("../config/supabaseConfig");
// เชื่อมต่อกับ Supabase
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables
const multer = require("multer");
// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// สร้าง QR code ใหม่
exports.createPaymentQRCode = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "กรุณาอัปโหลดรูปภาพ QR code",
      });
    }

    // อัปโหลดรูปภาพไปยัง Supabase Storage
    const file = req.file;
    const ext = path.extname(file.originalname);
    const fileName = `qrcode_${Date.now()}${ext}`;
    const folderPath = "payment_qrcodes";

    const { data, error } = await supabase.storage
      .from("store")
      .upload(`${folderPath}/${fileName}`, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }

    // สร้าง URL สำหรับรูปภาพ
    const imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;

    // สร้างข้อมูล QR code ใหม่
    const newPaymentQRCode = await PaymentQRCode.create({
      image: imageUrl,
    });

    res.status(201).json({
      status: "success",
      message: "สร้าง QR code สำเร็จ",
      data: newPaymentQRCode,
    });
  } catch (error) {
    console.error("Error creating payment QR code:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
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
      // ลบรูปภาพเก่าจาก Supabase
      if (imageUrl) {
        try {
          const oldFileName = imageUrl.split("/").pop().split("?")[0];

          if (oldFileName) {
            await supabase.storage
              .from("store")
              .remove([`payment_qrcodes/${oldFileName}`]);
          }
        } catch (error) {
          console.error("Error deleting old image:", error);
        }
      }

      // อัปโหลดรูปภาพใหม่
      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `qrcode_${Date.now()}${ext}`;

      const { data, error } = await supabase.storage
        .from("store")
        .upload(`payment_qrcodes/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({
          status: "error",
          message: error.message,
        });
      }

      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
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

    res.status(200).json({
      status: "success",
      message: "อัปเดต QR code สำเร็จ",
      data: updatedQRCode,
    });
  } catch (error) {
    console.error("Error updating payment QR code:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// ลบ QR code
exports.deletePaymentQRCode = async (req, res) => {
  try {
    const qrCode = await PaymentQRCode.findById(req.params.id);

    if (!qrCode) {
      return res.status(404).json({
        status: "error",
        message: "ไม่พบ QR code ตาม ID ที่ระบุ",
      });
    }

    // ลบรูปภาพจาก Supabase
    if (qrCode.image) {
      try {
        const fileName = qrCode.image.split("/").pop().split("?")[0];

        if (fileName) {
          await supabase.storage
            .from("store")
            .remove([`payment_qrcodes/${fileName}`]);
        }
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }

    // ลบข้อมูลจาก database
    await PaymentQRCode.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "ลบ QR code สำเร็จ",
    });
  } catch (error) {
    console.error("Error deleting payment QR code:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

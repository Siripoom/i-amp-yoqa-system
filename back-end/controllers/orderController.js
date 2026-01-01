const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");
const Goods = require("../models/goods"); // เพิ่ม import Goods model
const Receipt = require("../models/receipt"); // เพิ่ม import Receipt model
const Income = require("../models/income"); // เพิ่ม import Income model
const QRCode = require("qrcode"); // เพิ่มสำหรับ QR Code
const { createIncomeFromOrder } = require("./incomeController");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabaseConfig");
const dotenv = require("dotenv");
dotenv.config();

// สร้างเลขรันนิ่งใบเสร็จ (ตัวอย่าง: R20250821-0001)
async function generateReceiptNumber() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await Receipt.countDocuments({
    createdAt: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lte: new Date(today.setHours(23, 59, 59, 999)),
    },
  });
  return `R${dateStr}-${String(count + 1).padStart(4, "0")}`;
}

// สร้างใบเสร็จอัตโนมัติจากการสั่งซื้อ
async function createReceiptFromOrder(order, user, item) {
  try {
    const receiptNumber = await generateReceiptNumber();

    // สร้าง QR Code สำหรับตรวจสอบใบเสร็จ
    const qrCodeData = `Receipt:${receiptNumber}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    const receiptData = {
      receiptNumber,
      orderId: order._id,
      customerName: `${user.first_name} ${user.last_name}`,
      customerPhone: user.phone || order.phone_number,
      customerAddress: user.address || order.address,
      companyInfo: {
        name: "I AMP YOQA",
        address:
          "88/139 The Tara Village Soi.8, Phrayasuren 35 Road, Bang Chan, Khet Khlong Sam Wa, Bangkok 10510",
        phone: "0991636169",
      },
      items: [
        {
          name:
            item.sessions && item.duration
              ? `${item.sessions} Sessions ${item.duration} Days`
              : item.goods || "สินค้า",
          quantity: order.quantity || 1,
          price: order.unit_price || order.total_price || 0,
        },
      ],
      totalAmount: order.total_price || 0,
      template: "default",
      qrCode: qrCode,
    };

    const receipt = new Receipt(receiptData);
    await receipt.save();

    return receipt;
  } catch (error) {
    throw new Error(`Failed to create receipt: ${error.message}`);
  }
}

// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// สร้างคำสั่งซื้อใหม่พร้อมอัปโหลดรูปภาพไปยัง Supabase
exports.createOrder = async (req, res) => {
  try {
    const {
      user_id,
      product_id,
      goods_id,
      order_type,
      quantity,
      size,
      color,
      address,
      phone_number,
    } = req.body;
    console.log("Received order data:", req.body);
    // Validate required fields
    if (!user_id || !order_type) {
      return res.status(400).json({
        message: "User ID and order_type are required.",
      });
    }

    // Validate order_type และ reference ID
    if (order_type === "product" && !product_id) {
      return res.status(400).json({
        message: "Product ID is required for product orders.",
      });
    }

    if (order_type === "goods" && !goods_id) {
      return res.status(400).json({
        message: "Goods ID is required for goods orders.",
      });
    }

    if (!["product", "goods"].includes(order_type)) {
      return res.status(400).json({
        message: "order_type must be either 'product' or 'goods'.",
      });
    }

    // Parse quantity (default to 1 if not provided)
    const orderQuantity = parseInt(quantity) || 1;
    if (orderQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be at least 1." });
    }

    let imageUrl = null;

    // ถ้ามีการอัปโหลดไฟล์ ให้อัปโหลดไปยัง Supabase Storage
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `${Date.now()}${ext}`;
      const folderPath = "orders";

      // อัปโหลดไฟล์ไปยัง Supabase Storage
      const { data, error } = await supabase.storage
        .from("store")
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
      // console.log("Image uploaded to Supabase:", imageUrl);
    }

    // checkout user exists address and phone number but not exist or new data in user model save new address and phone number to user instead
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (address || !user.address) {
      user.address = address;
    }
    if (phone_number || !user.phone) {
      user.phone = phone_number;
    }
    await user.save();

    let item = null;
    let orderData = {
      user_id,
      order_type,
      image: imageUrl,
      status: "รออนุมัติ",
      quantity: orderQuantity,
    };

    // ดึงข้อมูลและตั้งค่าตาม order_type
    if (order_type === "product") {
      item = await Product.findById(product_id);
      console.log("Product item:", item);

      if (!item) {
        return res.status(404).json({ message: "Product not found." });
      }

      orderData.product_id = product_id;
      orderData.total_sessions = item.sessions * orderQuantity;
      orderData.total_duration = item.duration * orderQuantity;

      // คำนวณราคา (ใช้ promotion price ถ้ามีและยังไม่หมดอายุ)
      let unitPrice = item.price;
      if (
        item.promotion &&
        item.promotion.price &&
        item.promotion.startDate &&
        item.promotion.endDate
      ) {
        const now = new Date();
        if (now >= item.promotion.startDate && now <= item.promotion.endDate) {
          unitPrice = item.promotion.price;
          console.log("Using promotion price:", unitPrice);
        }
      }

      orderData.unit_price = unitPrice;
      orderData.total_price = unitPrice * orderQuantity;
    } else if (order_type === "goods") {
      item = await Goods.findById(goods_id);
      if (!item) {
        return res.status(404).json({ message: "Goods not found." });
      }

      // ตรวจสอบสต็อก
      if (item.stock < orderQuantity) {
        return res.status(400).json({
          message: `Insufficient stock. Available: ${item.stock}, Requested: ${orderQuantity}`,
        });
      }

      orderData.goods_id = goods_id;
      orderData.unit = item.unit;
      orderData.size = size || item.size;
      orderData.color = color || item.color;
      orderData.address = user.address;
      orderData.phone_number = user.phone;

      // คำนวณราคา (ใช้ promotion price ถ้ามีและยังไม่หมดอายุ)
      let unitPrice = item.price;
      if (
        item.promotion &&
        item.promotion.price &&
        item.promotion.startDate &&
        item.promotion.endDate
      ) {
        const now = new Date();
        if (now >= item.promotion.startDate && now <= item.promotion.endDate) {
          unitPrice = item.promotion.price;
        }
      }

      orderData.unit_price = unitPrice;
      orderData.total_price = unitPrice * orderQuantity;
    }

    const order = new Order(orderData);
    await order.save();

    // F001 & F002: สร้างรายรับอัตโนมัติจากการสั่งซื้อ
    try {
      await createIncomeFromOrder({
        _id: order._id,
        total_amount: order.total_price,
        order_type: order.order_type,
        user_id: order.user_id,
        createdAt: order.createdAt,
        payment_method: "transfer", // ค่าเริ่มต้น
        payment_reference: null,
        status: "pending", // เริ่มต้นเป็น pending จะเปลี่ยนเป็น confirmed เมื่อได้รับการอนุมัติ
      });
      console.log("Income record created automatically for order:", order._id);
    } catch (incomeError) {
      console.error("Failed to create income record:", incomeError.message);
      // ไม่ให้ error นี้หยุดการทำงานของการสั่งซื้อ
    }

    // สร้างใบเสร็จอัตโนมัติ
    try {
      await createReceiptFromOrder(order, user, item);
      console.log("Receipt created automatically for order:", order._id);
    } catch (receiptError) {
      console.error("Failed to create receipt:", receiptError.message);
      // ไม่ให้ error นี้หยุดการทำงานของการสั่งซื้อ
    }

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: error.message });
  }
};

// อัปเดตคำสั่งซื้อพร้อมอัปโหลดรูปภาพไปยัง Supabase
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    let imageUrl = order.image;

    // ลบรูปภาพเดิม (ถ้ามี)
    if (imageUrl && typeof imageUrl === "string") {
      try {
        const fileName = imageUrl.split("/").pop().split("?")[0];
        if (fileName) {
          const { error } = await supabase.storage
            .from("store")
            .remove([`orders/${fileName}`]);
          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            return res.status(500).json({
              message: "Error deleting file from storage",
            });
          }
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
        return res.status(500).json({
          message: "Error processing the image URL",
        });
      }
    }

    // อัปโหลดรูปภาพใหม่
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `${Date.now()}${ext}`;
      const folderPath = "orders";

      const { data, error } = await supabase.storage
        .from("store")
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    }

    // อัปเดตข้อมูลคำสั่งซื้อ
    if (req.body.user_id) order.user_id = req.body.user_id;
    if (req.body.product_id && order.order_type === "product") {
      order.product_id = req.body.product_id;
    }
    if (req.body.goods_id && order.order_type === "goods") {
      order.goods_id = req.body.goods_id;
    }
    if (req.body.status) order.status = req.body.status;
    if (req.body.size) order.size = req.body.size;
    if (req.body.color) order.color = req.body.color;
    order.image = imageUrl;

    await order.save();

    res.status(200).json({ status: "success", data: order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: error.message });
  }
};

// ดึงข้อมูลคำสั่งซื้อทั้งหมด
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user_id")
      .populate("product_id")
      .populate("goods_id")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      length: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: error.message });
  }
};

// ดึงข้อมูลคำสั่งซื้อโดย ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user_id")
      .populate("product_id")
      .populate("goods_id");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ status: "success", data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: error.message });
  }
};

// ลบคำสั่งซื้อพร้อมลบรูปภาพออกจาก Supabase
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ลบรูปภาพ (ถ้ามี)
    if (order.image && typeof order.image === "string") {
      try {
        const imageUrl = order.image;
        const fileName = imageUrl.split("/").pop().split("?")[0];
        if (fileName) {
          const { error } = await supabase.storage
            .from("store")
            .remove([`orders/${fileName}`]);
          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            return res.status(500).json({
              message: "Error deleting file from storage",
            });
          }
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
        return res.status(500).json({
          message: "Error processing the image URL",
        });
      }
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: error.message });
  }
};

// ดึงรายการ Order ทั้งหมดของ User ID ที่กำหนด
exports.getOrdersByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const requestingUserId = req.user.userId; // จาก JWT token
    const requestingUserRole = req.user.role; // จาก JWT token

    console.log("🔍 Debug getOrdersByUserId:");
    console.log("  - Requested user_id:", user_id);
    console.log("  - Requesting user ID:", requestingUserId);
    console.log("  - Requesting user role:", requestingUserRole);

    // ตรวจสอบสิทธิ์: user สามารถดู orders ของตัวเอง หรือ admin สามารถดู orders ของทุกคน
    if (
      requestingUserId !== user_id &&
      requestingUserRole !== "admin" &&
      requestingUserRole !== "SuperAdmin" &&
      requestingUserRole !== "Accounting"
    ) {
      console.log("❌ Access denied - user cannot view orders");
      return res.status(403).json({
        message: "Access denied. You can only view your own orders.",
      });
    }

    console.log("✅ Access granted - searching for orders...");
    const orders = await Order.find({ user_id })
      .populate("user_id")
      .populate("product_id")
      .populate("goods_id")
      .sort({ createdAt: -1 });

    console.log("📊 Found orders:", orders.length);

    // ส่งข้อมูลกลับแม้ว่าจะไม่มี orders ก็ตาม
    res.status(200).json({
      status: "success",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders by user ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// ดึงรายการ Order ตาม order_type
exports.getOrdersByType = async (req, res) => {
  try {
    const { order_type } = req.params;

    if (!["product", "goods"].includes(order_type)) {
      return res.status(400).json({
        message: "Invalid order_type. Must be 'product' or 'goods'.",
      });
    }

    const orders = await Order.find({ order_type })
      .populate("user_id")
      .populate(order_type === "product" ? "product_id" : "goods_id")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders by type:", error);
    res.status(500).json({ message: error.message });
  }
};

// อัปเดตสถานะคำสั่งซื้อ
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, invoice } = req.body;

    // Validate status
    if (!["รออนุมัติ", "อนุมัติ", "ยกเลิก"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Get existing order
    const existingOrder = await Order.findById(id)
      .populate("product_id")
      .populate("goods_id")
      .populate("user_id");
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = existingOrder.status;

    // ===== คืนค่าเดิมก่อน (ถ้า order เดิมเคยได้รับการอนุมัติแล้ว) =====
    if (previousStatus === "อนุมัติ") {
      const user = existingOrder.user_id;

      if (existingOrder.order_type === "product" && existingOrder.product_id) {
        // สำหรับ product: รีเซ็ต sessions กลับเป็น 0 และลบวันหมดอายุ
        if (existingOrder.product_id.sessions && existingOrder.total_sessions) {
          await User.findByIdAndUpdate(user._id, {
            $set: {
              remaining_session: 0,
              sessions_expiry_date: null,
              first_used_date: null,
            },
          });
          console.log(
            `Reverted product order - reset sessions to 0 for user ${user._id}`
          );
        }
      } else if (
        existingOrder.order_type === "goods" &&
        existingOrder.goods_id
      ) {
        // คืนสต็อกที่เคยลดไป
        await Goods.findByIdAndUpdate(existingOrder.goods_id._id, {
          $inc: { stock: existingOrder.quantity },
        });
        console.log(
          `Reverted ${existingOrder.quantity} stock to goods ${existingOrder.goods_id._id}`
        );
      }
    }

    // Update order with new status and approval date if being approved
    const updateData = { status, invoice_number: invoice };
    if (status === "อนุมัติ") {
      updateData.approval_date = new Date();
    }

    // Update the order
    const order = await Order.findByIdAndUpdate(id, updateData, { new: true })
      .populate("user_id")
      .populate("product_id")
      .populate("goods_id");

    // ===== ใช้ค่าใหม่ (ถ้าสถานะใหม่เป็น "อนุมัติ") =====
    if (status === "อนุมัติ") {
      const user = order.user_id;

      // อัพเดทสถานะรายรับเป็น confirmed เมื่อ order ได้รับการอนุมัติ
      try {
        await Income.findOneAndUpdate(
          { order_id: order._id },
          {
            status: "confirmed",
            income_date: new Date(),
            payment_method: "approved",
          }
        );
        console.log("Income status updated to confirmed for order:", order._id);
      } catch (incomeError) {
        console.error("Failed to update income status:", incomeError.message);
      }

      if (order.order_type === "product" && order.product_id) {
        // สำหรับ product orders - บวกสะสม sessions และตั้งวันหมดอายุเป็น 90 วันเสมอ
        const product = order.product_id;
        if (product.sessions) {
          // ตั้งวันหมดอายุเป็น 90 วันเสมอเมื่ออนุมัติ order
          let newExpiryDate = new Date();
          newExpiryDate.setDate(newExpiryDate.getDate() + 90);

          // บวกสะสม remaining_session, อัพเดทวันหมดอายุเป็น 90 วัน และบันทึก duration ของคอร์ส
          await User.findByIdAndUpdate(user._id, {
            $inc: { remaining_session: order.total_sessions }, // บวกสะสมจำนวน sessions
            $set: {
              sessions_expiry_date: newExpiryDate, // อัพเดทวันหมดอายุเป็น 90 วันเสมอ
              product_duration: product.duration, // บันทึก duration ของคอร์สล่าสุด
            },
          });
          console.log(
            `Added ${order.total_sessions} sessions for user ${user._id} with 90-day expiry (${newExpiryDate}). Product duration saved: ${product.duration} days.`
          );
        }
      } else if (order.order_type === "goods" && order.goods_id) {
        // สำหรับ goods orders - ลดสต็อก
        const goods = order.goods_id;
        await Goods.findByIdAndUpdate(goods._id, {
          $inc: { stock: -order.quantity },
        });
        console.log(`Reduced ${order.quantity} stock from goods ${goods._id}`);
      }
    }

    // ===== หากยกเลิก order ให้อัพเดทสถานะรายรับ =====
    if (status === "ยกเลิก") {
      try {
        await Income.findOneAndUpdate(
          { order_id: order._id },
          {
            status: "cancelled",
            notes: "Order cancelled by admin",
          }
        );
        console.log("Income status updated to cancelled for order:", order._id);
      } catch (incomeError) {
        console.error(
          "Failed to update income status to cancelled:",
          incomeError.message
        );
      }
    }

    res.status(200).json({
      status: "success",
      message: "Order status updated",
      data: order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: error.message });
  }
};

// ดึงสถิติการสั่งซื้อ
exports.getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$order_type",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total_price" },
          averageAmount: { $avg: "$total_price" },
        },
      },
    ]);

    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        typeStats: stats,
        statusStats: statusStats,
      },
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports.upload = upload;

const { count } = require("console");
const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");
const multer = require("multer");
const path = require("path");

// ตั้งค่าการอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // บันทึกไฟล์ไว้ที่โฟลเดอร์ uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // ตั้งชื่อไฟล์ให้ไม่ซ้ำ
  },
});

const upload = multer({ storage: storage });

// สร้างคำสั่งซื้อใหม่พร้อมอัปโหลดรูปภาพ
exports.createOrder = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res
        .status(400)
        .json({ message: "User ID and Product ID are required." });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const order = new Order({ user_id, product_id, image: imagePath });

    await order.save();

    //find product
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const user = await User.findByIdAndUpdate(
      user_id,
      { remaining_session: product.sessions },
      { new: true } // ส่งค่าใหม่กลับไป
    );
    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};

// ดึงข้อมูลคำสั่งซื้อทั้งหมด
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user_id product_id");
    res
      .status(200)
      .json({ status: "success", count: orders.length, orders: orders });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

// ดึงข้อมูลคำสั่งซื้อโดย ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user_id product_id"
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ status: "success", order: order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching order", error: error.message });
  }
};

// ลบคำสั่งซื้อ
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting order", error: error.message });
  }
};

// ดึงรายการ Order ทั้งหมดของ User ID ที่กำหนด
exports.getOrdersByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const orders = await Order.find({ user_id }).populate("user_id product_id");

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    res.status(200).json({
      message: "Orders fetched successfully",
      count: orders.length,
      orders: orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching orders by user ID",
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // ค่า status ที่ต้องการอัปเดต

    // ตรวจสอบว่าค่าสถานะถูกต้อง
    if (!["รออนุมัติ", "อนุมัติ"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true } // ส่งค่าใหม่กลับไป
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};

module.exports.upload = upload;

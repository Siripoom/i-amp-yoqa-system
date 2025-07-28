const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");
const Goods = require("../models/goods"); // เพิ่ม import Goods model
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabaseConfig");
const dotenv = require("dotenv");
dotenv.config();

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
    const orders = await Order.find({ user_id })
      .populate("user_id")
      .populate("product_id")
      .populate("goods_id")
      .sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

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
      .populate("goods_id");
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = existingOrder.status;

    // Update order with new status and approval date if being approved
    const updateData = { status, invoice_number: invoice };
    if (previousStatus === "รออนุมัติ" && status === "อนุมัติ") {
      updateData.approval_date = new Date();
    }

    // Update the order
    const order = await Order.findByIdAndUpdate(id, updateData, { new: true })
      .populate("user_id")
      .populate("product_id")
      .populate("goods_id");

    // Handle status change from pending to approved
    if (previousStatus === "รออนุมัติ" && status === "อนุมัติ") {
      const user = order.user_id;

      if (order.order_type === "product" && order.product_id) {
        // สำหรับ product orders - เพิ่ม sessions ให้ user
        const product = order.product_id;
        if (product.sessions) {
          const initialExpiryDate = new Date();
          initialExpiryDate.setDate(initialExpiryDate.getDate() + 90);

          await User.findByIdAndUpdate(user._id, {
            $inc: { remaining_session: order.total_sessions },
            $set: {
              sessions_expiry_date:
                user.sessions_expiry_date &&
                user.sessions_expiry_date > new Date()
                  ? user.sessions_expiry_date
                  : initialExpiryDate,
            },
          });
        }
      } else if (order.order_type === "goods" && order.goods_id) {
        // สำหรับ goods orders - ลดสต็อก
        const goods = order.goods_id;
        await Goods.findByIdAndUpdate(goods._id, {
          $inc: { stock: -order.quantity },
        });
      }
    }

    // หากยกเลิก order ของ goods ให้คืนสต็อก
    if (
      previousStatus === "อนุมัติ" &&
      status === "ยกเลิก" &&
      order.order_type === "goods" &&
      order.goods_id
    ) {
      await Goods.findByIdAndUpdate(order.goods_id._id, {
        $inc: { stock: order.quantity },
      });
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

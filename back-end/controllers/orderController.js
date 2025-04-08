const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabaseConfig"); // Import the Supabase client
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// สร้างคำสั่งซื้อใหม่พร้อมอัปโหลดรูปภาพไปยัง Supabase
exports.createOrder = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res
        .status(400)
        .json({ message: "User ID and Product ID are required." });
    }

    let imageUrl = null;

    // ถ้ามีการอัปโหลดไฟล์ ให้อัปโหลดไปยัง Supabase Storage
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname); // ดึงนามสกุลไฟล์
      const fileName = `${Date.now()}${ext}`; // ชื่อไฟล์ที่ไม่ซ้ำกัน
      const folderPath = "orders"; // โฟลเดอร์ที่จะเก็บไฟล์

      // อัปโหลดไฟล์ไปยัง Supabase Storage
      const { data, error } = await supabase.storage
        .from("store") // เปลี่ยนเป็นชื่อ bucket ของคุณใน Supabase
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      // สร้าง URL สาธารณะสำหรับรูปภาพที่อัปโหลด
      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    }

    // สร้างข้อมูลคำสั่งซื้อ
    const order = new Order({
      user_id,
      product_id,
      image: imageUrl,
      status: "รออนุมัติ", // ตั้งค่าเริ่มต้นเป็น "รออนุมัติ"
    });

    await order.save();

    // ค้นหา product
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // ค้นหา user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // อัปเดต remaining_session ของ user หลังการสั่งซื้อ
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { remaining_session: product.sessions + user.remaining_session },
      { new: true }
    );

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

    let imageUrl = order.image; // ใช้ URL รูปภาพเดิมเป็นค่าเริ่มต้น

    // ถ้ามี URL รูปภาพเดิม ให้ลบไฟล์เดิมออกจาก Supabase
    if (imageUrl && typeof imageUrl === "string") {
      try {
        const Url = imageUrl;

        // ดึงชื่อไฟล์จาก URL (หลังเครื่องหมาย / ตัวสุดท้าย)
        const fileName = Url.split("/").pop().split("?")[0]; // ดึงส่วนสุดท้ายของ URL และตัดพารามิเตอร์ query ออก

        if (fileName) {
          // ลบไฟล์เดิมออกจาก Supabase Storage
          const { error } = await supabase.storage
            .from("store") // เปลี่ยนเป็นชื่อ bucket ของคุณใน Supabase
            .remove([`orders/${fileName}`]);

          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            return res
              .status(500)
              .json({ message: "Error deleting file from storage" });
          }
        } else {
          console.error("Image URL structure is incorrect:", imageUrl);
          return res
            .status(400)
            .json({ message: "Invalid image URL structure" });
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
        return res
          .status(500)
          .json({ message: "Error processing the image URL" });
      }
    } else {
      console.warn("No image URL found for the order, skipping deletion");
    }

    // ถ้ามีการอัปโหลดไฟล์ใหม่ ให้อัปโหลดไปยัง Supabase Storage
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname); // ดึงนามสกุลไฟล์
      const fileName = `${Date.now()}${ext}`; // ชื่อไฟล์ที่ไม่ซ้ำกัน
      const folderPath = "orders"; // โฟลเดอร์ที่จะเก็บไฟล์

      // อัปโหลดไฟล์ไปยัง Supabase Storage
      const { data, error } = await supabase.storage
        .from("store") // เปลี่ยนเป็นชื่อ bucket ของคุณใน Supabase
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      // สร้าง URL สาธารณะสำหรับรูปภาพที่อัปโหลด
      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    }

    // อัปเดตข้อมูลคำสั่งซื้อ
    if (req.body.user_id) order.user_id = req.body.user_id;
    if (req.body.product_id) order.product_id = req.body.product_id;
    if (req.body.status) order.status = req.body.status;
    order.image = imageUrl;

    // บันทึกคำสั่งซื้อที่อัปเดตแล้วลงในฐานข้อมูล
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
    const orders = await Order.find().populate("user_id product_id");
    res.status(200).json({
      status: "success",
      count: orders.length,
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
    const order = await Order.findById(req.params.id).populate(
      "user_id product_id"
    );
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

    // ตรวจสอบว่ามี URL รูปภาพหรือไม่ก่อนที่จะพยายามลบไฟล์
    if (order.image && typeof order.image === "string") {
      try {
        const imageUrl = order.image;

        // ดึงชื่อไฟล์จาก URL (หลังเครื่องหมาย / ตัวสุดท้าย)
        const fileName = imageUrl.split("/").pop().split("?")[0]; // ดึงส่วนสุดท้ายของ URL และตัดพารามิเตอร์ query ออก

        if (fileName) {
          // ลบไฟล์ออกจาก Supabase Storage
          const { error } = await supabase.storage
            .from("store") // เปลี่ยนเป็นชื่อ bucket ของคุณใน Supabase
            .remove([`orders/${fileName}`]);

          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            return res
              .status(500)
              .json({ message: "Error deleting file from storage" });
          }
        } else {
          console.error("Image URL structure is incorrect:", imageUrl);
          return res
            .status(400)
            .json({ message: "Invalid image URL structure" });
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
        return res
          .status(500)
          .json({ message: "Error processing the image URL" });
      }
    } else {
      console.warn("No image URL found for the order, skipping deletion");
    }

    // ลบคำสั่งซื้อออกจากฐานข้อมูล
    await Order.findByIdAndDelete(req.params.id);

    res
      .status(200)
      .json({ status: "success", message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: error.message });
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
      status: "success",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders by user ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// อัปเดตสถานะคำสั่งซื้อ
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ตรวจสอบว่าค่าสถานะถูกต้อง
    if (!["รออนุมัติ", "อนุมัติ"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
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

module.exports.upload = upload;

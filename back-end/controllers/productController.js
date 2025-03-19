const Product = require("../models/product");

// สร้างสินค้าใหม่
// สร้างสินค้าใหม่ + อัปโหลดรูปภาพ
exports.createProduct = async (req, res) => {
  try {
    console.log("🔹 Received Data:", req.body); // ตรวจสอบค่าที่รับมา
    console.log("🔹 Uploaded File:", req.file); // ตรวจสอบว่าไฟล์ถูกอัปโหลดสำเร็จ
    const productData = {
      sessions: req.body.sessions,
      price: req.body.price,
      duration: req.body.duration,
      image: req.file ? req.file.filename : null, // เก็บชื่อไฟล์
    };
    const product = new Product(productData);
    await product.save();
    res.status(201).json({ status: "success", data: product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ดึงรูปภาพจาก GridFS
exports.getProductImage = async (req, res) => {
  try {
    gfs.find({ filename: req.params.filename }).toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({ message: "File not found" });
      }
      gfs.openDownloadStreamByName(req.params.filename).pipe(res);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// อัปเดตสินค้า
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ดึงข้อมูลสินค้าทั้งหมด
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      status: "success",
      productCount: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ดึงข้อมูลสินค้าตาม ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ลบสินค้า
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res
      .status(200)
      .json({ status: "success", message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Product = require("../models/product");
const upload = require("../utils/uploadConfig");
// สร้างสินค้าใหม่
exports.createProduct = [
  upload.single("image"), // ใช้ middleware ของ multer สำหรับอัปโหลดไฟล์ภาพ
  async (req, res) => {
    try {
      const productData = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        stock: req.body.stock,
        type: req.body.type,
        sessions: req.body.type === "course" ? req.body.sessions : undefined,
        imageUrl: req.file ? req.file.path : undefined, // เก็บ path ของรูปภาพที่อัปโหลด
      };

      const product = new Product(productData);
      await product.save();
      res.status(201).json({ status: "success", product });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];

// อัปเดตสินค้า
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ status: "success", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ดึงข้อมูลสินค้าทั้งหมด
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res
      .status(200)
      .json({ status: "success", productCount: products.length, products });
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
    res.status(200).json({ status: "success", product });
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

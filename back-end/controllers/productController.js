const Product = require("../models/product");

// สร้างสินค้าใหม่
exports.createProduct = [
  async (req, res) => {
    try {
      const productData = {
        sessions: req.body.sessions,
        price: req.body.price,
      };
      const product = new Product(productData);
      await product.save();
      res.status(201).json({ status: "success", data: product });
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

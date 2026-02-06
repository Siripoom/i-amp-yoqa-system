const Product = require("../models/product");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabaseConfig");
const dotenv = require("dotenv");
dotenv.config();

// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to validate promotion data
const validatePromotion = (promotion) => {
  if (!promotion) return true;

  // If promotion object exists, validate its fields
  if (promotion.price && promotion.price <= 0) {
    throw new Error("Promotion price must be greater than 0");
  }

  if (promotion.startDate && promotion.endDate) {
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);

    if (start >= end) {
      throw new Error("Promotion start date must be before end date");
    }
  }

  return true;
};

// Helper function to check if promotion is active
const isPromotionActive = (promotion) => {
  if (!promotion || !promotion.startDate || !promotion.endDate) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);

  return now >= startDate && now <= endDate;
};

// Helper function to parse promotion data from FormData
const parsePromotionData = (promotionString) => {
  if (
    !promotionString ||
    promotionString === "null" ||
    promotionString === "undefined"
  ) {
    return null;
  }

  try {
    const promotionData = JSON.parse(promotionString);

    // Validate that parsed data is an object
    if (typeof promotionData !== "object" || promotionData === null) {
      return null;
    }

    // Clean up the promotion data
    const cleanPromotion = {};

    if (promotionData.price && !isNaN(Number(promotionData.price))) {
      cleanPromotion.price = Number(promotionData.price);
    }

    if (promotionData.startDate) {
      cleanPromotion.startDate = new Date(promotionData.startDate);
    }

    if (promotionData.endDate) {
      cleanPromotion.endDate = new Date(promotionData.endDate);
    }

    // Return null if no valid promotion data
    if (Object.keys(cleanPromotion).length === 0) {
      return null;
    }

    return cleanPromotion;
  } catch (error) {
    console.error("Error parsing promotion data:", error);
    return null;
  }
};

// Product creation (with Supabase file upload)
exports.createProduct = async (req, res) => {
  try {
    let imageUrl = req.body.image;

    // If a file is uploaded, upload it to Supabase Storage
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `${Date.now()}${ext}`;
      const folderPath = "products";

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

    // Parse promotion data from FormData
    let promotionData = null;
    if (req.body.promotion) {
      promotionData = parsePromotionData(req.body.promotion);

      // Validate promotion data if provided
      if (promotionData) {
        validatePromotion(promotionData);
      }
    }

    // console.log("Parsed promotion data:", promotionData); // Debug log

    // Prepare product data
    const productData = {
      sessions: Number(req.body.sessions),
      price: Number(req.body.price),
      duration: Number(req.body.duration),
      image: imageUrl,
      hotSale: req.body.hotSale === "true" || req.body.hotSale === true,
    };

    // Add promotion data if provided
    if (promotionData) {
      productData.promotion = promotionData;
    }

    // console.log("Final product data:", productData); // Debug log

    // Save product to the database
    const product = new Product(productData);
    await product.save();

    res.status(201).json({ status: "success", data: product });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message });
  }
};

// Product update (with Supabase file upload)
exports.updateProduct = async (req, res) => {
  try {
    console.log("Update request body:", req.body); // Debug log

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let imageUrl = product.image;

    // Delete old image if exists and new image is uploaded
    if (req.file && imageUrl && typeof imageUrl === "string") {
      try {
        const fileName = imageUrl.split("/").pop().split("?")[0];

        if (fileName) {
          const { error } = await supabase.storage
            .from("store")
            .remove([`products/${fileName}`]);

          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            return res
              .status(500)
              .json({ message: "Error deleting file from storage" });
          }
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
        return res
          .status(500)
          .json({ message: "Error processing the image URL" });
      }
    }

    // If a new file is uploaded, upload it to Supabase Storage
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `${Date.now()}${ext}`;
      const folderPath = "products";

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

    // Parse promotion data from FormData
    let promotionData = null;
    let shouldUpdatePromotion = false;

    if (req.body.promotion !== undefined) {
      shouldUpdatePromotion = true;

      if (
        req.body.promotion === "null" ||
        req.body.promotion === null ||
        req.body.promotion === ""
      ) {
        promotionData = null; // Remove promotion
      } else {
        promotionData = parsePromotionData(req.body.promotion);

        // Validate promotion data if provided
        if (promotionData) {
          validatePromotion(promotionData);
        }
      }
    }

    console.log("Parsed promotion data for update:", promotionData); // Debug log

    // Update product data
    if (req.body.sessions !== undefined) {
      product.sessions = Number(req.body.sessions);
    }
    if (req.body.price !== undefined) {
      product.price = Number(req.body.price);
    }
    if (req.body.duration !== undefined) {
      product.duration = Number(req.body.duration);
    }

    product.image = imageUrl;

    if (req.body.hotSale !== undefined) {
      product.hotSale =
        req.body.hotSale === "true" || req.body.hotSale === true;
    }

    // Update promotion data if it was included in the request
    if (shouldUpdatePromotion) {
      if (promotionData === null) {
        // Remove promotion
        product.promotion = undefined;
      } else {
        product.promotion = promotionData;
      }
    }

    console.log("Final updated product data:", product.toObject()); // Debug log

    // Save updated product to the database
    await product.save();

    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all products with filtering and sorting options
exports.getProducts = async (req, res) => {
  try {
    const {
      sortBy = "price",
      sortOrder = "asc",
      hotSale,
      onPromotion,
      minPrice,
      maxPrice,
      includeDeleted,
      includeInactive,
    } = req.query;

    // Build filter object
    let filter = {};

    // By default, exclude deleted products (soft delete)
    if (includeDeleted !== "true") {
      filter.isDeleted = { $ne: true };
    }

    // By default, exclude inactive products for customer view
    if (includeInactive !== "true") {
      filter.isActive = { $ne: false };
    }

    if (hotSale !== undefined) {
      filter.hotSale = hotSale === "true";
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    let products = await Product.find(filter).sort(sortObj);

    // Filter by active promotion if requested
    if (onPromotion === "true") {
      products = products.filter((product) =>
        isPromotionActive(product.promotion),
      );
    }

    // Add computed fields for frontend
    products = products.map((product) => {
      const productObj = product.toObject();

      // Add promotion status
      productObj.isPromotionActive = isPromotionActive(product.promotion);

      // Add effective price (considering active promotion)
      if (productObj.isPromotionActive && product.promotion.price) {
        productObj.effectivePrice = product.promotion.price;
      } else {
        productObj.effectivePrice = product.price;
      }

      // Add discount percentage
      if (productObj.isPromotionActive && product.promotion.price) {
        const discountPercentage = Math.round(
          ((product.price - product.promotion.price) / product.price) * 100,
        );
        productObj.discountPercentage = discountPercentage;
      } else {
        productObj.discountPercentage = 0;
      }

      return productObj;
    });

    res.status(200).json({
      status: "success",
      productCount: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.getAllProducts = async (req, res) => {
  try {
    const {
      sortBy = "price",
      sortOrder = "asc",
      hotSale,
      onPromotion,
      minPrice,
      maxPrice,
      includeDeleted,
    } = req.query;

    // Build filter object
    let filter = {};

    // By default, exclude deleted products (soft delete)
    if (includeDeleted !== "true") {
      filter.isDeleted = { $ne: true };
    }

    if (hotSale !== undefined) {
      filter.hotSale = hotSale === "true";
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    let products = await Product.find(filter).sort(sortObj);

    // Filter by active promotion if requested
    if (onPromotion === "true") {
      products = products.filter((product) =>
        isPromotionActive(product.promotion),
      );
    }

    // Add computed fields for frontend
    products = products.map((product) => {
      const productObj = product.toObject();

      // Add promotion status
      productObj.isPromotionActive = isPromotionActive(product.promotion);

      // Add effective price (considering active promotion)
      if (productObj.isPromotionActive && product.promotion.price) {
        productObj.effectivePrice = product.promotion.price;
      } else {
        productObj.effectivePrice = product.price;
      }

      // Add discount percentage
      if (productObj.isPromotionActive && product.promotion.price) {
        const discountPercentage = Math.round(
          ((product.price - product.promotion.price) / product.price) * 100,
        );
        productObj.discountPercentage = discountPercentage;
      } else {
        productObj.discountPercentage = 0;
      }

      return productObj;
    });

    res.status(200).json({
      status: "success",
      productCount: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get hot sale products
exports.getHotSaleProducts = async (req, res) => {
  try {
    const products = await Product.find({ hotSale: true }).sort({ price: 1 });

    res.status(200).json({
      status: "success",
      productCount: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching hot sale products:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get products on promotion
exports.getPromotionProducts = async (req, res) => {
  try {
    const products = await Product.find({
      "promotion.startDate": { $lte: new Date() },
      "promotion.endDate": { $gte: new Date() },
    }).sort({ price: 1 });

    res.status(200).json({
      status: "success",
      productCount: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching promotion products:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const productObj = product.toObject();

    // Add promotion status
    productObj.isPromotionActive = isPromotionActive(product.promotion);

    // Add effective price
    if (productObj.isPromotionActive && product.promotion.price) {
      productObj.effectivePrice = product.promotion.price;
    } else {
      productObj.effectivePrice = product.price;
    }

    // Add discount percentage
    if (productObj.isPromotionActive && product.promotion.price) {
      const discountPercentage = Math.round(
        ((product.price - product.promotion.price) / product.price) * 100,
      );
      productObj.discountPercentage = discountPercentage;
    } else {
      productObj.discountPercentage = 0;
    }

    res.status(200).json({ status: "success", data: productObj });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// Soft delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if already deleted
    if (product.isDeleted) {
      return res.status(400).json({ message: "Product is already deleted" });
    }

    // Soft delete - mark as deleted instead of removing from database
    product.isDeleted = true;
    product.isActive = false; // Also deactivate when deleted
    product.deletedAt = new Date();
    await product.save();

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: error.message });
  }
};

// Permanently delete product (hard delete)
exports.permanentDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete image from Supabase if exists
    if (product.image && typeof product.image === "string") {
      try {
        const fileName = product.image.split("/").pop().split("?")[0];

        if (fileName) {
          const { error } = await supabase.storage
            .from("store")
            .remove([`products/${fileName}`]);

          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            // Continue with deletion even if image deletion fails
          }
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
      }
    }

    // Permanently delete the product from the database
    await Product.findByIdAndDelete(req.params.id);

    res
      .status(200)
      .json({ status: "success", message: "Product permanently deleted" });
  } catch (error) {
    console.error("Error permanently deleting product:", error);
    res.status(500).json({ message: error.message });
  }
};

// Restore soft deleted product
exports.restoreProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.isDeleted) {
      return res.status(400).json({ message: "Product is not deleted" });
    }

    // Restore the product
    product.isDeleted = false;
    product.deletedAt = null;
    // Note: isActive remains false, admin needs to manually activate if needed
    await product.save();

    res.status(200).json({
      status: "success",
      message: "Product restored successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error restoring product:", error);
    res.status(500).json({ message: error.message });
  }
};

// Toggle hot sale status
exports.toggleHotSale = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.hotSale = !product.hotSale;
    await product.save();

    res.status(200).json({
      status: "success",
      message: `Product ${
        product.hotSale ? "added to" : "removed from"
      } hot sale`,
      data: product,
    });
  } catch (error) {
    console.error("Error toggling hot sale:", error);
    res.status(500).json({ message: error.message });
  }
};

// Toggle active status (show/hide from customer view)
exports.toggleActive = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Cannot activate a deleted product
    if (product.isDeleted && !product.isActive) {
      return res.status(400).json({
        message: "Cannot activate a deleted product. Please restore it first.",
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      status: "success",
      message: `Product ${
        product.isActive ? "activated" : "deactivated"
      } successfully`,
      data: product,
    });
  } catch (error) {
    console.error("Error toggling active status:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  upload,
  createProduct: exports.createProduct,
  updateProduct: exports.updateProduct,
  getProducts: exports.getProducts,
  getAllProducts: exports.getAllProducts,
  getHotSaleProducts: exports.getHotSaleProducts,
  getPromotionProducts: exports.getPromotionProducts,
  getProductById: exports.getProductById,
  deleteProduct: exports.deleteProduct,
  permanentDeleteProduct: exports.permanentDeleteProduct,
  restoreProduct: exports.restoreProduct,
  toggleHotSale: exports.toggleHotSale,
  toggleActive: exports.toggleActive,
};

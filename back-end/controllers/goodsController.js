const Goods = require("../models/goods");
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

// Helper function to delete file from Supabase
const deleteFileFromSupabase = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    // Extract file path from URL
    const urlParts = imageUrl.split("/storage/v1/object/public/store/");
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from("store").remove([filePath]);

    if (error) {
      console.error("Error deleting file:", error);
    }
  } catch (error) {
    console.error("Error in deleteFileFromSupabase:", error);
  }
};

// Helper function to upload multiple files
const uploadMultipleFilesToSupabase = async (files) => {
  const uploadPromises = files.map(async (file) => {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}${ext}`;
    const folderPath = "goods";

    const { data, error } = await supabase.storage
      .from("store")
      .upload(`${folderPath}/${fileName}`, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }

    return `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
  });

  return Promise.all(uploadPromises);
};

// Helper function to delete multiple files
const deleteMultipleFilesFromSupabase = async (imageUrls) => {
  if (!imageUrls || imageUrls.length === 0) return;

  const deletePromises = imageUrls.map(async (imageUrl) => {
    await deleteFileFromSupabase(imageUrl);
  });

  return Promise.all(deletePromises);
};

// Product creation (with Supabase file upload)
exports.createGoods = async (req, res) => {
  try {
    let imageUrls = [];
    console.log("Creating goods:", req.body.goods);

    // Handle multiple file uploads
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        return res.status(400).json({ message: "Maximum 3 images allowed" });
      }
      imageUrls = await uploadMultipleFilesToSupabase(req.files);
    }

    // Validate required fields
    if (!req.body.goods || req.body.goods.trim() === "") {
      return res.status(400).json({ message: "Goods name is required" });
    }

    if (!req.body.code || req.body.code.trim() === "") {
      return res.status(400).json({ message: "Goods code is required" });
    }

    // Validate and convert numeric values
    const stock =
      req.body.stock !== undefined &&
      req.body.stock !== null &&
      req.body.stock !== ""
        ? Number(req.body.stock)
        : 0;

    const price =
      req.body.price !== undefined &&
      req.body.price !== null &&
      req.body.price !== ""
        ? Number(req.body.price)
        : 0;

    // Check if conversion resulted in NaN
    if (isNaN(stock)) {
      return res.status(400).json({ message: "Stock must be a valid number" });
    }

    if (isNaN(price) || price <= 0) {
      return res
        .status(400)
        .json({ message: "Price must be a valid number greater than 0" });
    }

    const goodsData = {
      goods: req.body.goods.trim(),
      code: req.body.code.trim(),
      detail: req.body.detail || "",
      stock: stock,
      unit: req.body.unit || "ชิ้น",
      size: req.body.size || "",
      color: req.body.color || "",
      price: price,
      image: imageUrls,
      hotSale: req.body.hotSale === "true" || req.body.hotSale === true,
    };

    let promotionData = null;
    if (req.body.promotion && req.body.promotion !== "null") {
      promotionData = parsePromotionData(req.body.promotion);

      // Validate promotion data if provided
      if (promotionData) {
        validatePromotion(promotionData);
      }
    }
    if (promotionData) {
      goodsData.promotion = promotionData;
    }

    const goods = new Goods(goodsData);
    await goods.save();

    console.log("Goods created successfully:", goods._id);
    res.status(201).json({ status: "success", data: goods });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all goods with pagination and filtering
exports.getAllGoods = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (req.query.goods) {
      filter.goods = { $regex: req.query.goods, $options: "i" };
    }

    if (req.query.code) {
      filter.code = { $regex: req.query.code, $options: "i" };
    }

    if (req.query.hotSale !== undefined) {
      filter.hotSale = req.query.hotSale === "true";
    }

    if (req.query.minPrice) {
      filter.price = { ...filter.price, $gte: Number(req.query.minPrice) };
    }

    if (req.query.maxPrice) {
      filter.price = { ...filter.price, $lte: Number(req.query.maxPrice) };
    }

    if (req.query.inStock !== undefined) {
      if (req.query.inStock === "true") {
        filter.stock = { $gt: 0 };
      } else {
        filter.stock = { $lte: 0 };
      }
    }

    // Build sort object
    const sort = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      sort.createdAt = -1; // Default sort by newest
    }

    const goods = await Goods.find(filter).sort(sort).skip(skip).limit(limit);

    const total = await Goods.countDocuments(filter);

    res.json({
      status: "success",
      data: goods,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching goods:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get goods by ID
exports.getGoodsById = async (req, res) => {
  try {
    const goods = await Goods.findById(req.params.id);

    if (!goods) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ status: "success", data: goods });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update goods
exports.updateGoods = async (req, res) => {
  try {
    const existingGoods = await Goods.findById(req.params.id);

    if (!existingGoods) {
      return res.status(404).json({ message: "Product not found" });
    }

    let imageUrls = existingGoods.image || [];

    // Handle multiple file uploads
    if (req.files && req.files.length > 0) {
      if (req.files.length > 3) {
        return res.status(400).json({ message: "Maximum 3 images allowed" });
      }

      // Delete old images
      if (existingGoods.image && existingGoods.image.length > 0) {
        await deleteMultipleFilesFromSupabase(existingGoods.image);
      }

      imageUrls = await uploadMultipleFilesToSupabase(req.files);
    }

    // Validate and convert numeric values
    const stock =
      req.body.stock !== undefined &&
      req.body.stock !== null &&
      req.body.stock !== ""
        ? Number(req.body.stock)
        : existingGoods.stock;

    const price =
      req.body.price !== undefined &&
      req.body.price !== null &&
      req.body.price !== ""
        ? Number(req.body.price)
        : existingGoods.price;

    // Check if conversion resulted in NaN
    if (isNaN(stock)) {
      return res.status(400).json({ message: "Stock must be a valid number" });
    }

    if (isNaN(price)) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }

    const updateData = {
      goods: req.body.goods || existingGoods.goods,
      code: req.body.code || existingGoods.code,
      detail:
        req.body.detail !== undefined ? req.body.detail : existingGoods.detail,
      stock: stock,
      unit: req.body.unit || existingGoods.unit,
      size: req.body.size !== undefined ? req.body.size : existingGoods.size,
      color:
        req.body.color !== undefined ? req.body.color : existingGoods.color,
      price: price,
      image: imageUrls,
      hotSale:
        req.body.hotSale !== undefined
          ? req.body.hotSale === "true" || req.body.hotSale === true
          : existingGoods.hotSale,
    };

    // Handle promotion update
    if (req.body.promotion !== undefined) {
      if (
        req.body.promotion === "null" ||
        req.body.promotion === null ||
        req.body.removePromotion === "true"
      ) {
        // Explicitly remove promotion when turned off
        updateData.promotion = null;
        updateData.$unset = { promotion: 1 }; // Remove the field completely from MongoDB
      } else {
        const promotionData = parsePromotionData(req.body.promotion);
        if (promotionData) {
          validatePromotion(promotionData);
          updateData.promotion = promotionData;
        }
      }
    }

    // Handle update with special case for promotion removal
    let updatedGoods;
    if (updateData.$unset) {
      // Use $unset to completely remove promotion field
      updatedGoods = await Goods.findByIdAndUpdate(
        req.params.id,
        {
          $set: { ...updateData, promotion: undefined },
          $unset: updateData.$unset,
        },
        { new: true, runValidators: true }
      );
    } else {
      updatedGoods = await Goods.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });
    }

    res.json({ status: "success", data: updatedGoods });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete goods
exports.deleteGoods = async (req, res) => {
  try {
    const goods = await Goods.findById(req.params.id);

    if (!goods) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete multiple images from Supabase
    if (goods.image && goods.image.length > 0) {
      await deleteMultipleFilesFromSupabase(goods.image);
    }

    await Goods.findByIdAndDelete(req.params.id);

    res.json({ status: "success", message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get goods with active promotions
exports.getPromotionalGoods = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const now = new Date();

    const goods = await Goods.find({
      "promotion.startDate": { $lte: now },
      "promotion.endDate": { $gte: now },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Goods.countDocuments({
      "promotion.startDate": { $lte: now },
      "promotion.endDate": { $gte: now },
    });

    res.json({
      status: "success",
      data: goods,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching promotional goods:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get hot sale goods
exports.getHotSaleGoods = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const goods = await Goods.find({ hotSale: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Goods.countDocuments({ hotSale: true });

    res.json({
      status: "success",
      data: goods,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching hot sale goods:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ message: "Invalid stock value" });
    }

    const goods = await Goods.findByIdAndUpdate(
      req.params.id,
      { stock: Number(stock) },
      { new: true, runValidators: true }
    );

    if (!goods) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ status: "success", data: goods });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ message: error.message });
  }
};

// Search goods
exports.searchGoods = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchFilter = {
      $or: [
        { goods: { $regex: query, $options: "i" } },
        { code: { $regex: query, $options: "i" } },
        { detail: { $regex: query, $options: "i" } },
        { color: { $regex: query, $options: "i" } },
        { size: { $regex: query, $options: "i" } },
      ],
    };

    const goods = await Goods.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Goods.countDocuments(searchFilter);

    res.json({
      status: "success",
      data: goods,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error searching goods:", error);
    res.status(500).json({ message: error.message });
  }
};

// Export multer upload middleware
exports.upload = upload;

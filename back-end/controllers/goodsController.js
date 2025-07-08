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

// Helper function to upload file to Supabase
const uploadFileToSupabase = async (file) => {
  const ext = path.extname(file.originalname);
  const fileName = `${Date.now()}${ext}`;
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

// Product creation (with Supabase file upload)
exports.createGoods = async (req, res) => {
  try {
    let imageUrl = req.body.image;

    // If a file is uploaded, upload it to Supabase Storage
    if (req.file) {
      imageUrl = await uploadFileToSupabase(req.file);
    }

    const goodsData = {
      goods: req.body.goods,
      code: req.body.code,
      detail: req.body.detail,
      stock: Number(req.body.stock),
      unit: req.body.unit,
      size: req.body.size,
      color: req.body.color,
      price: Number(req.body.price),
      image: imageUrl,
      hotSale: req.body.hotSale === "true",
    };

    let promotionData = null;
    if (req.body.promotion) {
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

    let imageUrl = existingGoods.image;

    // If a new file is uploaded, upload it to Supabase Storage
    if (req.file) {
      // Delete old image if exists
      if (existingGoods.image) {
        await deleteFileFromSupabase(existingGoods.image);
      }

      imageUrl = await uploadFileToSupabase(req.file);
    }

    const updateData = {
      goods: req.body.goods || existingGoods.goods,
      code: req.body.code || existingGoods.code,
      detail: req.body.detail || existingGoods.detail,
      stock:
        req.body.stock !== undefined
          ? Number(req.body.stock)
          : existingGoods.stock,
      unit: req.body.unit || existingGoods.unit,
      size: req.body.size || existingGoods.size,
      color: req.body.color || existingGoods.color,
      price:
        req.body.price !== undefined
          ? Number(req.body.price)
          : existingGoods.price,
      image: imageUrl,
      hotSale:
        req.body.hotSale !== undefined
          ? req.body.hotSale === "true"
          : existingGoods.hotSale,
    };

    // Handle promotion update
    if (req.body.promotion !== undefined) {
      if (req.body.promotion === "null" || req.body.promotion === null) {
        updateData.promotion = undefined;
      } else {
        const promotionData = parsePromotionData(req.body.promotion);
        if (promotionData) {
          validatePromotion(promotionData);
          updateData.promotion = promotionData;
        }
      }
    }

    const updatedGoods = await Goods.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

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

    // Delete image from Supabase if exists
    if (goods.image) {
      await deleteFileFromSupabase(goods.image);
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

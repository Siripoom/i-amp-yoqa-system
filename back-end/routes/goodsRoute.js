const express = require("express");
const router = express.Router();
const goodsController = require("../controllers/goodsController");

// Import upload middleware from controller
const { upload } = goodsController;

// Create new goods (with file upload)
router.post("/", upload.single("image"), goodsController.createGoods);

// Get all goods with pagination and filtering
// Query params: page, limit, goods, code, hotSale, minPrice, maxPrice, inStock, sortBy, sortOrder
router.get("/", goodsController.getAllGoods);

// Get goods by ID
router.get("/:id", goodsController.getGoodsById);

// Update goods (with file upload)
router.put("/:id", upload.single("image"), goodsController.updateGoods);

// Delete goods
router.delete("/:id", goodsController.deleteGoods);

// Get promotional goods (active promotions only)
router.get("/promotions/active", goodsController.getPromotionalGoods);

// Get hot sale goods
router.get("/hot-sale/all", goodsController.getHotSaleGoods);

// Update stock only
router.patch("/:id/stock", goodsController.updateStock);

// Search goods
router.get("/search/query", goodsController.searchGoods);

module.exports = router;

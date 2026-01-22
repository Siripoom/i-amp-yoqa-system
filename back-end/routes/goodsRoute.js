const express = require("express");
const router = express.Router();
const goodsController = require("../controllers/goodsController");

// Import upload middleware from controller
const { upload } = goodsController;

// Create new goods (with file upload)
router.post("/", upload.array("images", 3), goodsController.createGoods);

// Get all goods with pagination and filtering
// Query params: page, limit, goods, code, hotSale, minPrice, maxPrice, inStock, sortBy, sortOrder
router.get("/", goodsController.getAllGoods);

// Get goods by ID
router.get("/:id", goodsController.getGoodsById);

// Update goods (with file upload)
router.put("/:id", upload.array("images", 3), goodsController.updateGoods);

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

// Toggle active status (show/hide from customer view)
router.patch("/:id/toggle-active", goodsController.toggleActive);

// Restore soft deleted goods
router.patch("/:id/restore", goodsController.restoreGoods);

// Permanently delete goods
router.delete("/:id/permanent", goodsController.permanentDeleteGoods);

module.exports = router;

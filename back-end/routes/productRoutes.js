const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  permanentDeleteProduct,
  restoreProduct,
  getHotSaleProducts,
  getPromotionProducts,
  toggleHotSale,
  toggleActive,
} = require("../controllers/productController");
const multer = require("multer");

// Configure multer to store the file in memory
const upload = multer({ storage: multer.memoryStorage() });

// Route for creating a product with an uploaded image
router.post("/", upload.single("image"), createProduct); // 'image' is the form field key for the uploaded file

// Route for retrieving all products
router.get("/", getProducts);

// Route for retrieving a product by its ID
router.get("/:id", getProductById);

// Route for updating a product
router.put("/:id", upload.single("image"), updateProduct);

// Route for deleting a product
router.delete("/:id", deleteProduct);

router.get("/hot-sale", getHotSaleProducts);
router.get("/promotion", getPromotionProducts);
router.patch("/:id/toggle-hot-sale", toggleHotSale);
router.patch("/:id/toggle-active", toggleActive);
router.patch("/:id/restore", restoreProduct);
router.delete("/:id/permanent", permanentDeleteProduct);

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const paymentQRCodeController = require("../controllers/qrCodeController");

const upload = multer({ storage: multer.memoryStorage() });
router
  .route("/")
  .get(paymentQRCodeController.getAllPaymentQRCodes)
  .post(upload.single("image"), paymentQRCodeController.createPaymentQRCode);

router
  .route("/:id")
  .get(paymentQRCodeController.getPaymentQRCodeById)
  .patch(upload.single("image"), paymentQRCodeController.updatePaymentQRCode)
  .delete(paymentQRCodeController.deletePaymentQRCode);

module.exports = router;

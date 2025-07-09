// server.js
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const productRoutes = require("./routes/productRoutes");
const classRoutes = require("./routes/classRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const orderRoutes = require("./routes/orderRoutes");
const masterRoutes = require("./routes/masterRoutes");
const heroImageRoutes = require("./routes/heroImageRoute");
const bodyParser = require("body-parser");
const qrCodeRoutes = require("./routes/paymentQRCodeRoutes.js");
const instructorReportRoutes = require("./routes/instructorReportRoutes");
const sliderImageRoutes = require("./routes/sliderImageRoutes");
const userTermsRoutes = require("./routes/userTermsRoutes");
const goodsRoutes = require("./routes/goodsRoute");

require("dotenv").config();
const path = require("path");
const app = express();

app.use(
  session({ secret: "your_secret", resave: false, saveUninitialized: true })
);

app.use(cors());

// Bodyparser middleware
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// เชื่อมต่อกับ MongoDB
connectDB();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// ใช้งาน routes
app.use("/api", userRoutes);
app.use("/api", roleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/heroImages", heroImageRoutes);
app.use("/api/masters", masterRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", classRoutes);
app.use("/api", reservationRoutes);
app.use("/api/qrCodes", qrCodeRoutes);
app.use("/api/instructorReports", instructorReportRoutes);
app.use("/api/sliderImages", sliderImageRoutes);
app.use("/api", userTermsRoutes);
app.use("/api/goods", goodsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

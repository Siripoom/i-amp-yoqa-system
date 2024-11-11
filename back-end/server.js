// server.js
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const bodyParser = require("body-parser");
require("dotenv").config();
const mongoose = require("mongoose");
require("./models/course"); // Ensure all models are imported
require("./models/product"); // Ensure all models are imported

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  console.log("Registered Models:", mongoose.modelNames()); // Should list Course and Product
});
const app = express();

// Bodyparser middleware
app.use(bodyParser.json());

// เชื่อมต่อกับ MongoDB
connectDB();

// ใช้งาน routes
app.use("/api", userRoutes);
app.use("/api", roleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

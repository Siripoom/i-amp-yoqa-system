// server.js
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const productRoutes = require("./routes/productRoutes");
const bodyParser = require("body-parser");
require("dotenv").config();

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

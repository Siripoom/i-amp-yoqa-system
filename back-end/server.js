// server.js
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

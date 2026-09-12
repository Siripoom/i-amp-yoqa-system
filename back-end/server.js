// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
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
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const financialReportRoutes = require("./routes/financialReportRoutes");

const receiptRoutes = require("./routes/receiptRoutes");

require("dotenv").config();
const path = require("path");
const app = express();

const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  "https://i-ked-yoqa-system.vercel.app",
  "http://localhost:5173",
  ...configuredOrigins,
]);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(
  session({ secret: "your_secret", resave: false, saveUninitialized: true })
);

// Bodyparser middleware
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
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
app.use("/api/income", incomeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/financial-reports", financialReportRoutes);

app.use("/api/receipts", receiptRoutes);

app.get("/health", (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "degraded",
    database: databaseReady ? "connected" : "disconnected",
  });
});

const startServer = async () => {
  await connectDB();
  const port = Number(process.env.PORT) || 5000;
  return app.listen(port, "0.0.0.0", () =>
    console.log(`Server running on port ${port}`)
  );
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  });
}

module.exports = { app, corsOptions, startServer };

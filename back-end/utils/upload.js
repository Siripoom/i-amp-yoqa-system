const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// เชื่อมต่อ MongoDB
const conn = mongoose.connection;
conn.once("open", () => {
  console.log("✅ GridFS connected");
});

// ตั้งค่า Storage สำหรับ Multer GridFS
const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: async (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({ storage });

module.exports = { upload };

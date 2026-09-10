const { StorageChanges, respondStorageError } = require("../services/storageChanges");
const Master = require("../models/master");
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// แปลง YouTube URL เป็น embed URL
const getYoutubeEmbedUrl = (url) => {
  if (!url) return null;

  // ถ้าเป็น URL รูปแบบปกติ ให้แปลงเป็น embed URL
  let videoId = null;

  // รูปแบบ https://www.youtube.com/watch?v=VIDEO_ID
  const regularMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (regularMatch) {
    videoId = regularMatch[1];
  }

  // รูปแบบ https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) {
    videoId = shortMatch[1];
  }

  // รูปแบบ https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (embedMatch) {
    videoId = embedMatch[1];
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // ถ้าไม่สามารถแปลงได้ ให้คืนค่า URL เดิม
  return url;
};

exports.createMaster = async (req, res) => {
  const files = new StorageChanges();
  try {
    let imageUrl = req.body.image; // Default to the image URL from the request body
    let videoUrl = req.body.videoUrl; // YouTube URL

    // แปลง YouTube URL เป็น embed URL
    if (videoUrl) {
      videoUrl = getYoutubeEmbedUrl(videoUrl);
    }

    // Prepare master data
    const masterData = {
      mastername: req.body.mastername,
      image: imageUrl, // Store the public URL of the image
      videoUrl: videoUrl, // Store the YouTube embed URL
      bio: req.body.bio,
      description: req.body.description,
      specialization: req.body.specialization,
    };

    // Save master to the database
    const master = new Master(masterData);
    await master.validate();
    if (req.file) {
      master.image = await files.upload(req.file, "masters");
    }
    await master.save();
    files.commit();

    res.status(201).json({ status: "success", data: master });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error creating master:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await files.finish();
  }
};

exports.updateMaster = async (req, res) => {
  const files = new StorageChanges();
  try {
    const master = await Master.findById(req.params.id);
    if (!master) {
      return res.status(404).json({ message: "Master not found" });
    }

    let imageUrl = master.image; // Default to the existing image URL
    let videoUrl = req.body.videoUrl || master.videoUrl; // YouTube URL

    // Handle image deletion and update

    // แปลง YouTube URL เป็น embed URL
    if (videoUrl) {
      videoUrl = getYoutubeEmbedUrl(videoUrl);
    }

    // Update master data
    master.mastername = req.body.mastername || master.mastername;
    master.image = imageUrl;
    master.videoUrl = videoUrl;
    master.description = req.body.description || master.description;
    master.bio = req.body.bio || master.bio;
    master.specialization = req.body.specialization || master.specialization;

    // Save updated master to the database
    await master.validate();
    if (req.file) {
      master.image = await files.upload(req.file, "masters", master.image);
    }
    await master.save();
    files.commit();

    res.status(200).json({ status: "success", data: master });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error updating master:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await files.finish();
  }
};

// Get all masters
exports.getMasters = async (req, res) => {
  try {
    const masters = await Master.find();
    res.status(200).json({
      status: "success",
      masterCount: masters.length,
      data: masters,
    });
  } catch (error) {
    console.error("Error fetching masters:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get a master by ID
exports.getMasterById = async (req, res) => {
  try {
    const master = await Master.findById(req.params.id);
    if (!master) {
      return res.status(404).json({ message: "Master not found" });
    }
    res.status(200).json({ status: "success", data: master });
  } catch (error) {
    console.error("Error fetching master by ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete master
exports.deleteMaster = async (req, res) => {
  const files = new StorageChanges();
  try {
    const master = await Master.findById(req.params.id);
    if (!master) {
      return res.status(404).json({ message: "Master not found" });
    }

    // Delete image if exists
    files.removeAfterCommit(master.image);

    // Delete the master from the database
    await Master.findByIdAndDelete(req.params.id);
    files.commit();

    res
      .status(200)
      .json({ status: "success", message: "Master deleted successfully" });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error deleting master:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await files.finish();
  }
};

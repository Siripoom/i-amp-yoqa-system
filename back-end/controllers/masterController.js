const Master = require("../models/master");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabaseConfig"); // Import the Supabase client
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

// master creation (with Supabase file upload for image and YouTube URL for video)
exports.createMaster = async (req, res) => {
  try {
    let imageUrl = req.body.image; // Default to the image URL from the request body
    let videoUrl = req.body.videoUrl; // YouTube URL

    // If a file is uploaded, upload it to Supabase Storage
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname); // Get the file extension
      const fileName = `image_${Date.now()}${ext}`; // Unique file name
      const folderPath = "masters"; // The folder where files will be stored

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("store") // Replace with your Supabase bucket name
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      // Construct the public URL for the uploaded image
      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    }

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
      specialization: req.body.specialization,
    };

    // Save master to the database
    const master = new Master(masterData);
    await master.save();

    res.status(201).json({ status: "success", data: master });
  } catch (error) {
    console.error("Error creating master:", error);
    res.status(500).json({ message: error.message });
  }
};

// master update (with Supabase file upload for image and YouTube URL for video)
exports.updateMaster = async (req, res) => {
  try {
    const master = await Master.findById(req.params.id);
    if (!master) {
      return res.status(404).json({ message: "Master not found" });
    }

    let imageUrl = master.image; // Default to the existing image URL
    let videoUrl = req.body.videoUrl || master.videoUrl; // YouTube URL

    // Handle image deletion and update
    if (req.file) {
      // Delete existing image if present
      if (imageUrl && typeof imageUrl === "string") {
        try {
          const fileName = imageUrl.split("/").pop().split("?")[0];
          if (fileName) {
            const { error } = await supabase.storage
              .from("store")
              .remove([`masters/${fileName}`]);

            if (error) {
              console.error(
                "Error deleting image from Supabase:",
                error.message
              );
            }
          }
        } catch (error) {
          console.error("Error processing the image URL:", error.message);
        }
      }

      // Upload new image
      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `image_${Date.now()}${ext}`;
      const folderPath = "masters";

      const { data, error } = await supabase.storage
        .from("store")
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    }

    // แปลง YouTube URL เป็น embed URL
    if (videoUrl) {
      videoUrl = getYoutubeEmbedUrl(videoUrl);
    }

    // Update master data
    master.mastername = req.body.mastername || master.mastername;
    master.image = imageUrl;
    master.videoUrl = videoUrl;
    master.bio = req.body.bio || master.bio;
    master.specialization = req.body.specialization || master.specialization;

    // Save updated master to the database
    await master.save();

    res.status(200).json({ status: "success", data: master });
  } catch (error) {
    console.error("Error updating master:", error);
    res.status(500).json({ message: error.message });
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
  try {
    const master = await Master.findById(req.params.id);
    if (!master) {
      return res.status(404).json({ message: "Master not found" });
    }

    // Delete image if exists
    if (master.image && typeof master.image === "string") {
      try {
        const fileName = master.image.split("/").pop().split("?")[0];
        if (fileName) {
          const { error } = await supabase.storage
            .from("store")
            .remove([`masters/${fileName}`]);

          if (error) {
            console.error("Error deleting image from Supabase:", error.message);
          }
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
      }
    }

    // Delete the master from the database
    await Master.findByIdAndDelete(req.params.id);

    res
      .status(200)
      .json({ status: "success", message: "Master deleted successfully" });
  } catch (error) {
    console.error("Error deleting master:", error);
    res.status(500).json({ message: error.message });
  }
};

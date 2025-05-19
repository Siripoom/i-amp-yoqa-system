const Master = require("../models/master");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabaseConfig"); // Import the Supabase client
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// master creation (with Supabase file upload for image and video)
exports.createMaster = async (req, res) => {
  try {
    let imageUrl = req.body.image; // Default to the image URL from the request body
    let videoUrl = req.body.video; // Default to the video URL from the request body

    // If image file is uploaded, upload it to Supabase Storage
    if (req.files && req.files.image) {
      const file = req.files.image[0];
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

    // If video file is uploaded, upload it to Supabase Storage
    if (req.files && req.files.video) {
      const file = req.files.video[0];
      const ext = path.extname(file.originalname); // Get the file extension
      const fileName = `video_${Date.now()}${ext}`; // Unique file name
      const folderPath = "masters_videos"; // Separate folder for videos

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("store") // Replace with your Supabase bucket name
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      // Construct the public URL for the uploaded video
      videoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    }

    // Prepare master data
    const masterData = {
      mastername: req.body.mastername,
      image: imageUrl, // Store the public URL of the image
      video: videoUrl, // Store the public URL of the video
      // bio: req.body.bio,
      // specialization: req.body.specialization,
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

// master update (with Supabase file upload for image and video)
exports.updateMaster = async (req, res) => {
  try {
    const master = await Master.findById(req.params.id);
    if (!master) {
      return res.status(404).json({ message: "Master not found" });
    }

    let imageUrl = master.image; // Default to the existing image URL
    let videoUrl = master.video; // Default to the existing video URL

    // Handle image deletion and update
    if (req.files && req.files.image) {
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
      const file = req.files.image[0];
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

    // Handle video deletion and update
    if (req.files && req.files.video) {
      // Delete existing video if present
      if (videoUrl && typeof videoUrl === "string") {
        try {
          const fileName = videoUrl.split("/").pop().split("?")[0];
          if (fileName) {
            const { error } = await supabase.storage
              .from("store")
              .remove([`masters_videos/${fileName}`]);

            if (error) {
              console.error(
                "Error deleting video from Supabase:",
                error.message
              );
            }
          }
        } catch (error) {
          console.error("Error processing the video URL:", error.message);
        }
      }

      // Upload new video
      const file = req.files.video[0];
      const ext = path.extname(file.originalname);
      const fileName = `video_${Date.now()}${ext}`;
      const folderPath = "masters_videos";

      const { data, error } = await supabase.storage
        .from("store")
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      videoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    }

    // Update master data
    master.mastername = req.body.mastername || master.mastername;
    master.image = imageUrl;
    master.video = videoUrl;
    // master.bio = req.body.bio || master.bio;
    // master.specialization = req.body.specialization || master.specialization;

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

    // Delete video if exists
    if (master.video && typeof master.video === "string") {
      try {
        const fileName = master.video.split("/").pop().split("?")[0];
        if (fileName) {
          const { error } = await supabase.storage
            .from("store")
            .remove([`masters_videos/${fileName}`]);

          if (error) {
            console.error("Error deleting video from Supabase:", error.message);
          }
        }
      } catch (error) {
        console.error("Error processing the video URL:", error.message);
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

// Configuration for multer to handle multiple file types
exports.uploadFields = [
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
];

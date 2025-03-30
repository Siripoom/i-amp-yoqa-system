const HeroImage = require("../models/heroImage");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabaseConfig"); // Import the Supabase client
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// master creation (with Supabase file upload)
exports.createHeroImage = async (req, res) => {
  try {
    let imageUrl = req.body.image; // Default to the image URL from the request body

    // If a file is uploaded, upload it to Supabase Storage
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname); // Get the file extension
      const fileName = `${Date.now()}${ext}`; // Unique file name
      const folderPath = "heroImages"; // The folder where files will be stored

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

    // Prepare master data
    const heroImageData = {
      image: imageUrl, // Store the public URL of the image
    };

    // Save master to the database
    const heroImage = new HeroImage(heroImageData);
    await heroImage.save();

    res.status(201).json({ status: "success", data: heroImage });
  } catch (error) {
    console.error("Error creating heroImage:", error);
    res.status(500).json({ message: error.message });
  }
};

// master update (with Supabase file upload)
exports.updateHeroImage = async (req, res) => {
  try {
    const heroImage = await HeroImage.findById(req.params.id);
    if (!heroImage) {
      return res.status(404).json({ message: "master not found" });
    }

    let imageUrl = heroImage.image; // Default to the existing image URL

    if (imageUrl && typeof imageUrl === "string") {
      try {
        const Url = imageUrl;

        // Extract file name directly from the image URL (after the last '/')
        const fileName = Url.split("/").pop().split("?")[0]; // Get the last part of the URL, remove query params if present

        if (fileName) {
          // Correct file path: Remove any spaces between "masters" and the file name
          const { error } = await supabase.storage
            .from("store") // Replace with your Supabase bucket name
            .remove([`heroImage/${fileName}`]); // Remove the space between "masters" and fileName

          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            return res
              .status(500)
              .json({ message: "Error deleting file from storage" });
          }
        } else {
          console.error("Image URL structure is incorrect:", imageUrl);
          return res
            .status(400)
            .json({ message: "Invalid image URL structure" });
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
        return res
          .status(500)
          .json({ message: "Error processing the image URL" });
      }
    } else {
      console.warn("No image URL found for the heroImage, skipping deletion");
    }

    // If a new file is uploaded, upload it to Supabase Storage
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname); // Get the file extension
      const fileName = `${Date.now()}${ext}`; // Unique file name
      const folderPath = "heroImage"; // The folder where files will be stored

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

    // Update master data

    heroImage.image = imageUrl;

    // Save updated master to the database
    await heroImage.save();

    res.status(200).json({ status: "success", data: heroImage });
  } catch (error) {
    console.error("Error updating heroImage:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all masters
exports.getHeroImage = async (req, res) => {
  try {
    const heroImage = await HeroImage.find();
    res.status(200).json({
      status: "success",
      masterCount: heroImage.length,
      data: heroImage,
    });
  } catch (error) {
    console.error("Error fetching heroImage:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete master
exports.deleteHeroImage = async (req, res) => {
  try {
    const heroImage = await HeroImage.findById(req.params.id);
    if (!heroImage) {
      return res.status(404).json({ message: "heroImage not found" });
    }

    // Ensure heroImage.image exists and is a valid string before attempting to split it
    if (heroImage.image && typeof heroImage.image === "string") {
      try {
        const imageUrl = heroImage.image;

        // Extract file name directly from the image URL (after the last '/')
        const fileName = imageUrl.split("/").pop().split("?")[0]; // Get the last part of the URL, remove query params if present

        if (fileName) {
          // Correct file path: Remove any spaces between "masters" and the file name
          const { error } = await supabase.storage
            .from("store") // Replace with your Supabase bucket name
            .remove([`heroImage/${fileName}`]); // Remove the space between "masters" and fileName

          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            return res
              .status(500)
              .json({ message: "Error deleting file from storage" });
          }
        } else {
          console.error("Image URL structure is incorrect:", imageUrl);
          return res
            .status(400)
            .json({ message: "Invalid image URL structure" });
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
        return res
          .status(500)
          .json({ message: "Error processing the image URL" });
      }
    } else {
      console.warn("No image URL found for the master, skipping deletion");
    }

    // Delete the master from the database
    await HeroImage.findByIdAndDelete(req.params.id);

    res
      .status(200)
      .json({ status: "success", message: "master deleted successfully" });
  } catch (error) {
    console.error("Error deleting master:", error);
    res.status(500).json({ message: error.message });
  }
};

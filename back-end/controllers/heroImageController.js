const { StorageChanges, respondStorageError } = require("../services/storageChanges");
const HeroImage = require("../models/heroImage");
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.createHeroImage = async (req, res) => {
  const files = new StorageChanges();
  try {
    let imageUrl = req.body.image; // Default to the image URL from the request body

    // Prepare master data
    const heroImageData = {
      image: imageUrl, // Store the public URL of the image
    };

    // Save master to the database
    const heroImage = new HeroImage(heroImageData);
    await heroImage.validate();
    if (req.file) {
      heroImage.image = await files.upload(req.file, "heroImages");
    }
    await heroImage.save();
    files.commit();

    res.status(201).json({ status: "success", data: heroImage });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error creating heroImage:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await files.finish();
  }
};

exports.updateHeroImage = async (req, res) => {
  const files = new StorageChanges();
  try {
    const heroImage = await HeroImage.findById(req.params.id);
    if (!heroImage) {
      return res.status(404).json({ message: "master not found" });
    }

    let imageUrl = heroImage.image; // Default to the existing image URL

    // Update master data

    heroImage.image = imageUrl;

    // Save updated master to the database
    await heroImage.validate();
    if (req.file) {
      heroImage.image = await files.upload(req.file, "heroImages", heroImage.image);
    }
    await heroImage.save();
    files.commit();

    res.status(200).json({ status: "success", data: heroImage });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error updating heroImage:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await files.finish();
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
  const files = new StorageChanges();
  try {
    const heroImage = await HeroImage.findById(req.params.id);
    if (!heroImage) {
      return res.status(404).json({ message: "heroImage not found" });
    }

    // Ensure heroImage.image exists and is a valid string before attempting to split it
    files.removeAfterCommit(heroImage.image);

    // Delete the master from the database
    await HeroImage.findByIdAndDelete(req.params.id);
    files.commit();

    res
      .status(200)
      .json({ status: "success", message: "master deleted successfully" });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error deleting master:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await files.finish();
  }
};

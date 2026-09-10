const { StorageChanges, respondStorageError } = require("../services/storageChanges");
const SliderImage = require("../models/sliderImage");
const multer = require("multer");

const dotenv = require("dotenv");
dotenv.config();

// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// สร้าง Slider Image ใหม่
exports.createSliderImage = async (req, res) => {
  const files = new StorageChanges();
  try {
    let imageUrl = req.body.image; // Default to the image URL from the request body

    // Prepare slider image data
    const sliderImageData = {
      title: req.body.title || "",
      image: imageUrl,
      description: req.body.description || "",
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      order: req.body.order || 0,
    };

    const sliderImage = new SliderImage(sliderImageData);
    await sliderImage.validate({ pathsToSkip: req.file ? ["image"] : [] });
    if (req.file) {
      sliderImage.image = await files.upload(req.file, "slider_images");
    }
    await sliderImage.save();
    files.commit();

    res.status(201).json({ status: "success", data: sliderImage });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error creating slider image:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await files.finish();
  }
};

// อัพเดต Slider Image
exports.updateSliderImage = async (req, res) => {
  const files = new StorageChanges();
  try {
    const sliderImage = await SliderImage.findById(req.params.id);
    if (!sliderImage) {
      return res.status(404).json({ message: "Slider image not found" });
    }

    let imageUrl = sliderImage.image;

    // Delete old image if exists and new file is uploaded

    // Upload new image if provided

    // Update slider image data
    sliderImage.title = req.body.title || sliderImage.title;
    sliderImage.image = imageUrl;
    sliderImage.description = req.body.description || sliderImage.description;
    sliderImage.isActive =
      req.body.isActive !== undefined
        ? req.body.isActive
        : sliderImage.isActive;
    sliderImage.order =
      req.body.order !== undefined ? req.body.order : sliderImage.order;

    await sliderImage.validate();
    if (req.file) {
      sliderImage.image = await files.upload(req.file, "slider_images", sliderImage.image);
    }
    await sliderImage.save();
    files.commit();

    res.status(200).json({ status: "success", data: sliderImage });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error updating slider image:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await files.finish();
  }
};

// ดึงข้อมูล Slider Images ทั้งหมด
exports.getSliderImages = async (req, res) => {
  try {
    const sliderImages = await SliderImage.find({ isActive: true }).sort({
      order: 1,
    });
    res.status(200).json({
      status: "success",
      count: sliderImages.length,
      data: sliderImages,
    });
  } catch (error) {
    console.error("Error fetching slider images:", error);
    res.status(500).json({ message: error.message });
  }
};

// ดึงข้อมูล Slider Images ทั้งหมด (รวม inactive)
exports.getAllSliderImages = async (req, res) => {
  try {
    const sliderImages = await SliderImage.find().sort({
      order: 1,
      createdAt: -1,
    });
    res.status(200).json({
      status: "success",
      count: sliderImages.length,
      data: sliderImages,
    });
  } catch (error) {
    console.error("Error fetching all slider images:", error);
    res.status(500).json({ message: error.message });
  }
};

// ดึงข้อมูล Slider Image ตาม ID
exports.getSliderImageById = async (req, res) => {
  try {
    const sliderImage = await SliderImage.findById(req.params.id);
    if (!sliderImage) {
      return res.status(404).json({ message: "Slider image not found" });
    }
    res.status(200).json({ status: "success", data: sliderImage });
  } catch (error) {
    console.error("Error fetching slider image:", error);
    res.status(500).json({ message: error.message });
  }
};

// ลบ Slider Image
exports.deleteSliderImage = async (req, res) => {
  const files = new StorageChanges();
  try {
    const sliderImage = await SliderImage.findById(req.params.id);
    if (!sliderImage) {
      return res.status(404).json({ message: "Slider image not found" });
    }

    files.removeAfterCommit(sliderImage.image);

    await SliderImage.findByIdAndDelete(req.params.id);
    files.commit();

    res.status(200).json({
      status: "success",
      message: "Slider image deleted successfully",
    });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    console.error("Error deleting slider image:", error);
    res.status(500).json({ message: error.message });
  } finally {
    await files.finish();
  }
};

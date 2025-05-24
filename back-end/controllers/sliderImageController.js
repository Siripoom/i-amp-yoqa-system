const SliderImage = require("../models/sliderImage");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabaseConfig");
const dotenv = require("dotenv");
dotenv.config();

// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// สร้าง Slider Image ใหม่
exports.createSliderImage = async (req, res) => {
  try {
    let imageUrl = req.body.image; // Default to the image URL from the request body

    // If a file is uploaded, upload it to Supabase Storage
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `slider_${Date.now()}${ext}`;
      const folderPath = "slider_images";

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

    // Prepare slider image data
    const sliderImageData = {
      title: req.body.title || "",
      image: imageUrl,
      description: req.body.description || "",
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      order: req.body.order || 0,
    };

    const sliderImage = new SliderImage(sliderImageData);
    await sliderImage.save();

    res.status(201).json({ status: "success", data: sliderImage });
  } catch (error) {
    console.error("Error creating slider image:", error);
    res.status(500).json({ message: error.message });
  }
};

// อัพเดต Slider Image
exports.updateSliderImage = async (req, res) => {
  try {
    const sliderImage = await SliderImage.findById(req.params.id);
    if (!sliderImage) {
      return res.status(404).json({ message: "Slider image not found" });
    }

    let imageUrl = sliderImage.image;

    // Delete old image if exists and new file is uploaded
    if (req.file && imageUrl && typeof imageUrl === "string") {
      try {
        const fileName = imageUrl.split("/").pop().split("?")[0];
        if (fileName) {
          const { error } = await supabase.storage
            .from("store")
            .remove([`slider_images/${fileName}`]);

          if (error) {
            console.error("Error deleting old image:", error.message);
          }
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
      }
    }

    // Upload new image if provided
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `slider_${Date.now()}${ext}`;
      const folderPath = "slider_images";

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

    await sliderImage.save();

    res.status(200).json({ status: "success", data: sliderImage });
  } catch (error) {
    console.error("Error updating slider image:", error);
    res.status(500).json({ message: error.message });
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
  try {
    const sliderImage = await SliderImage.findById(req.params.id);
    if (!sliderImage) {
      return res.status(404).json({ message: "Slider image not found" });
    }

    // Delete image from Supabase if exists
    if (sliderImage.image && typeof sliderImage.image === "string") {
      try {
        const fileName = sliderImage.image.split("/").pop().split("?")[0];
        if (fileName) {
          const { error } = await supabase.storage
            .from("store")
            .remove([`slider_images/${fileName}`]);

          if (error) {
            console.error("Error deleting image from Supabase:", error.message);
          }
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
      }
    }

    await SliderImage.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Slider image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting slider image:", error);
    res.status(500).json({ message: error.message });
  }
};

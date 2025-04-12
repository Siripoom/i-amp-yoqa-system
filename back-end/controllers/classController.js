const Class = require("../models/class");
const Course = require("../models/course");
const User = require("../models/user");
const Reservation = require("../models/reservation");
const dayjs = require("dayjs");
const ClassCatalog = require("../models/classCatalog");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabaseConfig"); // Import the Supabase client
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// Use Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// สร้างคลาสใหม่
exports.createClass = async (req, res) => {
  try {
    const {
      title,
      instructor,
      description,
      room_number,
      passcode,
      zoom_link,
      start_time,
      end_time,
      color,
    } = req.body;

    const course = await Course.findOne({ course_name: title });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const difficulty = course.difficulty;
    const newClass = new Class({
      title,
      instructor,
      description,
      room_number,
      passcode,
      zoom_link,
      start_time,
      end_time,
      color,
      difficulty, // Make sure your Class model has this field
      amount: 0,
      participants: [], // Initialize with an empty array
    });

    const savedClass = await newClass.save();
    res
      .status(201)
      .json({ message: "Class created successfully", data: savedClass });
  } catch (error) {
    res.status(500).json({ message: "Error creating class", error });
  }
};

// ดึงข้อมูลคลาสทั้งหมด
exports.getAllClasses = async (req, res) => {
  try {
    const now = dayjs();

    // First get all classes that haven't ended yet
    const classes = await Class.find({
      end_time: { $gte: now.toDate() },
    }).lean(); // Convert Mongoose docs to plain JS objects

    // Sort by start_time in ascending order (earliest first)
    const sortedClasses = classes.sort((a, b) =>
      dayjs(a.start_time).diff(dayjs(b.start_time))
    );

    res.status(200).json({
      status: "success",
      count: sortedClasses.length,
      data: sortedClasses,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching classes", error });
  }
};

// ดึงข้อมูลคลาสโดย ID
exports.getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.status(200).json(classData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching class", error });
  }
};

// แก้ไขข้อมูลคลาส
exports.updateClass = async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }
    res
      .status(200)
      .json({ message: "Class updated successfully", data: updatedClass });
  } catch (error) {
    res.status(500).json({ message: "Error updating class", error });
  }
};

// ลบคลาส
exports.deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting class", error });
  }
};

// Duplicate a class
exports.duplicateClass = async (req, res) => {
  try {
    // Find the class to duplicate
    const originalClass = await Class.findById(req.params.id);

    if (!originalClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Create a new class object with the data from the original
    const duplicatedClass = new Class({
      title: originalClass.title,
      instructor: originalClass.instructor,
      description: originalClass.description,
      room_number: originalClass.room_number,
      passcode: originalClass.passcode,
      zoom_link: originalClass.zoom_link,

      // Adjust times as needed (default: same times, one week later)
      start_time:
        req.body.start_time ||
        new Date(
          new Date(originalClass.start_time).getTime() + 7 * 24 * 60 * 60 * 1000
        ),
      end_time:
        req.body.end_time ||
        new Date(
          new Date(originalClass.end_time).getTime() + 7 * 24 * 60 * 60 * 1000
        ),

      difficulty: originalClass.difficulty,
      color: originalClass.color,
      amount: 0, // Reset participant count
      participants: [], // Reset participants
    });

    // Save the duplicated class
    const savedClass = await duplicatedClass.save();

    res.status(201).json({
      message: "Class duplicated successfully",
      data: savedClass,
    });
  } catch (error) {
    console.error("Error duplicating class:", error);
    res.status(500).json({
      message: "Error duplicating class",
      error: error.message || "Unknown error occurred",
    });
  }
};

//! =================== Class Catalog show in คลาสโยคะ ===================
exports.createClassCatalog = async (req, res) => {
  // console.log(req.body.classname);
  try {
    // Check if required fields are present
    if (!req.body.classname) {
      return res.status(400).json({
        message: "Validation failed",
        error: "classname is required",
      });
    }

    let imageUrl = req.body.image;
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `${Date.now()}${ext}`;
      const folderPath = "class";

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("store")
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      // Construct the public URL for the uploaded image
      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    }

    const newClassCatalog = new ClassCatalog({
      classname: req.body.classname,
      description: req.body.description || "", // Provide default empty string if missing
      image: imageUrl || "", // Provide default empty string if missing
    });

    const savedClassCatalog = await newClassCatalog.save();
    res.status(201).json({
      message: "Class catalog created successfully",
      data: savedClassCatalog,
    });
  } catch (error) {
    // For debugging purposes, log the full error
    console.error("Error creating class catalog:", error);
    // Return a more user-friendly error message
    res.status(500).json({
      message: "Error creating class catalog",
      error: error.message || "Unknown error occurred",
    });
  }
};

// Get all class catalogs
exports.getAllClassCatalogs = async (req, res) => {
  try {
    const catalogs = await ClassCatalog.find();
    res.status(200).json({
      status: "success",
      count: catalogs.length,
      data: catalogs,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching class catalogs", error: error.message });
  }
};

exports.updateClassCatalog = async (req, res) => {
  try {
    const classId = req.params.id;
    const updatedClassCatalog = await ClassCatalog.findById(classId);

    if (!updatedClassCatalog) {
      return res.status(404).json({ message: "Class catalog not found" });
    }

    let imageUrl = updatedClassCatalog.image; // Fixed variable reference (was using 'master.image')

    // Handle image deletion if a new file is uploaded
    if (req.file && imageUrl && typeof imageUrl === "string") {
      try {
        // Extract file name from the image URL
        const fileName = imageUrl.split("/").pop().split("?")[0];

        if (fileName) {
          const { error } = await supabase.storage
            .from("store")
            .remove([`class/${fileName}`]);

          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            // Continue with update even if deletion fails
          }
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
        // Continue with update even if image URL processing fails
      }
    }

    // Handle new file upload
    if (req.file) {
      const file = req.file;
      const ext = path.extname(file.originalname);
      const fileName = `${Date.now()}${ext}`;
      const folderPath = "class";

      const { data, error } = await supabase.storage
        .from("store")
        .upload(`${folderPath}/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      // Update the image URL
      imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    }

    // Update class catalog fields
    updatedClassCatalog.image = imageUrl;
    updatedClassCatalog.classname =
      req.body.classname || updatedClassCatalog.classname;
    updatedClassCatalog.description =
      req.body.description || updatedClassCatalog.description;

    // Save updated class catalog
    await updatedClassCatalog.save();

    res.status(200).json({
      message: "Class catalog updated successfully",
      data: updatedClassCatalog,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating class catalog", error: error.message });
  }
};

exports.deleteClassCatalog = async (req, res) => {
  try {
    const classId = req.params.id;
    const classCatalog = await ClassCatalog.findById(classId);

    if (!classCatalog) {
      return res.status(404).json({ message: "Class catalog not found" });
    }

    // Handle image deletion
    if (classCatalog.image && typeof classCatalog.image === "string") {
      try {
        const fileName = classCatalog.image.split("/").pop().split("?")[0];

        if (fileName) {
          const { error } = await supabase.storage
            .from("store")
            .remove([`class/${fileName}`]);

          if (error) {
            console.error("Error deleting file from Supabase:", error.message);
            // Continue with deletion even if file removal fails
          }
        }
      } catch (error) {
        console.error("Error processing the image URL:", error.message);
        // Continue with deletion even if image processing fails
      }
    }

    // Delete the class catalog from the database
    await ClassCatalog.findByIdAndDelete(classId);

    res.status(200).json({ message: "Class catalog deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting class catalog", error: error.message });
  }
};

const { StorageChanges, respondStorageError } = require("../services/storageChanges");
const Class = require("../models/class");
const Course = require("../models/course");
const User = require("../models/user");
const Reservation = require("../models/reservation");
const dayjs = require("dayjs");
const ClassCatalog = require("../models/classCatalog");
const multer = require("multer");
const LineNotificationOutbox = require("../models/lineNotificationOutbox");
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
      allowed_gender = "all",
    } = req.body;

    if (!["all", "male", "female"].includes(allowed_gender)) {
      return res.status(400).json({ message: "Invalid allowed_gender" });
    }

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
      allowed_gender,
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

    // Get all classes that haven't ended yet
    let classes = await Class.find({
      end_time: { $gte: now.toDate() },
    }).lean();
    classes = classes.map((cls) => ({
      ...cls,
      allowed_gender: cls.allowed_gender || "all",
    }));

    // Filter out classes that have started and amount = 0
    classes = classes.filter((cls) => {
      const hasStarted = dayjs(cls.start_time).isBefore(now);
      return !(hasStarted && cls.amount === 0);
    });

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
    const existingClass = await Class.findById(req.params.id);
    if (!existingClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    const nextAllowedGender =
      req.body.allowed_gender || existingClass.allowed_gender || "all";
    if (!["all", "male", "female"].includes(nextAllowedGender)) {
      return res.status(400).json({ message: "Invalid allowed_gender" });
    }

    const currentAllowedGender = existingClass.allowed_gender || "all";
    if (
      nextAllowedGender !== currentAllowedGender &&
      nextAllowedGender !== "all"
    ) {
      const activeReservations = await Reservation.find({
        class_id: req.params.id,
        status: "Reserved",
      }).populate("user_id", "gender");
      const incompatibleCount = activeReservations.filter(
        (reservation) =>
          !reservation.user_id ||
          reservation.user_id.gender !== nextAllowedGender
      ).length;
      if (incompatibleCount > 0) {
        return res.status(409).json({
          code: "CLASS_GENDER_CONFLICT",
          message: "Existing reservations conflict with the selected gender",
          incompatible_count: incompatibleCount,
        });
      }
    }

    const course = await Course.findOne({
      course_name: req.body.title || existingClass.title,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const difficulty = course.difficulty;

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { ...req.body, allowed_gender: nextAllowedGender, difficulty },
      { new: true, runValidators: true }
    );
    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    const materialFields = ["start_time", "end_time", "instructor", "room_number", "zoom_link"];
    const changed = materialFields.some((field) => req.body[field] !== undefined && String(req.body[field]) !== String(existingClass[field] ?? ""));
    if (changed) {
      const reservations = await Reservation.find({ class_id: req.params.id, status: "Reserved" }).populate("user_id", "line_user_id");
      const entries = reservations.filter((r) => r.user_id?.line_user_id).map((r) => ({
        event_key: `class-change:${updatedClass._id}:${updatedClass.updatedAt?.getTime()}:${r._id}`,
        line_user_id: r.user_id.line_user_id,
        type: "class_changed",
        payload: { reservation_id: String(r._id), class_name: updatedClass.title, start_time: updatedClass.start_time, instructor: updatedClass.instructor, location: updatedClass.room_number || updatedClass.zoom_link },
      }));
      if (entries.length) await LineNotificationOutbox.insertMany(entries, { ordered: false });
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
      allowed_gender: originalClass.allowed_gender || "all",
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
  const files = new StorageChanges();
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

    const newClassCatalog = new ClassCatalog({
      classname: req.body.classname,
      description: req.body.description || "", // Provide default empty string if missing
      image: imageUrl || "", // Provide default empty string if missing
    });

    await newClassCatalog.validate();
    if (req.file) {
      newClassCatalog.image = await files.upload(req.file, "class");
    }
    const savedClassCatalog = await newClassCatalog.save();
    files.commit();
    res.status(201).json({
      message: "Class catalog created successfully",
      data: savedClassCatalog,
    });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    // For debugging purposes, log the full error
    console.error("Error creating class catalog:", error);
    // Return a more user-friendly error message
    res.status(500).json({
      message: "Error creating class catalog",
      error: error.message || "Unknown error occurred",
    });
  } finally {
    await files.finish();
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
  const files = new StorageChanges();
  try {
    const classId = req.params.id;
    const updatedClassCatalog = await ClassCatalog.findById(classId);

    if (!updatedClassCatalog) {
      return res.status(404).json({ message: "Class catalog not found" });
    }

    let imageUrl = updatedClassCatalog.image; // Fixed variable reference (was using 'master.image')

    // Handle image deletion if a new file is uploaded

    // Handle new file upload

    // Update class catalog fields
    updatedClassCatalog.image = imageUrl;
    updatedClassCatalog.classname =
      req.body.classname || updatedClassCatalog.classname;
    updatedClassCatalog.description =
      req.body.description || updatedClassCatalog.description;

    // Save updated class catalog
    await updatedClassCatalog.validate();
    if (req.file) {
      updatedClassCatalog.image = await files.upload(req.file, "class", updatedClassCatalog.image);
    }
    await updatedClassCatalog.save();
    files.commit();

    res.status(200).json({
      message: "Class catalog updated successfully",
      data: updatedClassCatalog,
    });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    res
      .status(500)
      .json({ message: "Error updating class catalog", error: error.message });
  } finally {
    await files.finish();
  }
};

exports.deleteClassCatalog = async (req, res) => {
  const files = new StorageChanges();
  try {
    const classId = req.params.id;
    const classCatalog = await ClassCatalog.findById(classId);

    if (!classCatalog) {
      return res.status(404).json({ message: "Class catalog not found" });
    }

    // Handle image deletion
    files.removeAfterCommit(classCatalog.image);

    // Delete the class catalog from the database
    await ClassCatalog.findByIdAndDelete(classId);
    files.commit();

    res.status(200).json({ message: "Class catalog deleted successfully" });
  } catch (error) {
    if (respondStorageError(res, error)) return;
    res
      .status(500)
      .json({ message: "Error deleting class catalog", error: error.message });
  } finally {
    await files.finish();
  }
};

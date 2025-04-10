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

//! =================== Class Catalog show in คลาสโยคะ ===================
exports.createClassCatalog = async (req, res) => {
  try {
    const { classname } = req.body;
    const newClassCatalog = new ClassCatalog({
      classname,
      image,
    });
    const savedClassCatalog = await newClassCatalog.save();
    res.status(201).json({
      message: "Class catalog created successfully",
      data: savedClassCatalog,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating class catalog", error });
  }
};

// ดึงข้อมูลคลาสทั้งหมดใน catalog
exports.getAllClassCatalogs = async (req, res) => {
  try {
    const catalogs = await ClassCatalog.find();
    res.status(200).json({
      status: "success",
      count: catalogs.length,
      data: catalogs,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching class catalogs", error });
  }
};

exports.updateClassCatalog = async (req, res) => {
  try {
    const updatedClassCatalog = await ClassCatalog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedClassCatalog) {
      return res.status(404).json({ message: "Class catalog not found" });
    }
    res.status(200).json({
      message: "Class catalog updated successfully",
      data: updatedClassCatalog,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating class catalog", error });
  }
};

// ลบคลาสใน catalog
exports.deleteClassCatalog = async (req, res) => {
  try {
    const deletedClassCatalog = await ClassCatalog.findByIdAndDelete(
      req.params.id
    );
    if (!deletedClassCatalog) {
      return res.status(404).json({ message: "Class catalog not found" });
    }
    res.status(200).json({ message: "Class catalog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting class catalog", error });
  }
};

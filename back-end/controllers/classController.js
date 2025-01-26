const Class = require("../models/class");
const Course = require("../models/course");

// สร้างคลาสใหม่
exports.createClass = async (req, res) => {
  try {
    const course = await Course.findById(req.body.course_id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    req.body.title = course.course_name;
    const newClass = new Class(req.body);
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
    const classes = await Class.find();
    res
      .status(200)
      .json({ status: "success", count: classes.length, data: classes });
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
    const course = await Course.findById(req.body.course_id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    req.body.title = course.course_name;
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

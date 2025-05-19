const Class = require("../models/class");

// ฟังก์ชันสำหรับดึงรายงานผู้สอน
exports.getInstructorReport = async (req, res) => {
  try {
    // ดึงข้อมูลทั้งหมดของคลาสจาก database
    const classes = await Class.find({});

    // สร้าง object สำหรับเก็บข้อมูลผู้สอน
    const instructorData = {};

    // วนลูปผ่านแต่ละคลาส
    for (const classItem of classes) {
      // ข้ามคลาสที่ไม่มีผู้สอน
      if (!classItem.instructor) continue;

      const instructorName = classItem.instructor;

      // คำนวณจำนวนผู้เรียนในคลาส
      const studentCount = classItem.participants
        ? classItem.participants.length
        : 0;

      // สร้างข้อมูลคลาส
      const classData = {
        title: classItem.title,
        studentCount: studentCount,
        date: classItem.start_time, // วันที่สอน (ใช้ start_time)
        startTime: classItem.start_time,
        endTime: classItem.end_time,
        roomNumber: classItem.room_number || "N/A",
      };

      // ถ้ายังไม่มีข้อมูลของผู้สอนคนนี้ ให้สร้างใหม่
      if (!instructorData[instructorName]) {
        instructorData[instructorName] = {
          totalClasses: 0,
          totalStudents: 0,
          classes: [],
        };
      }

      // เพิ่มข้อมูลคลาสให้กับผู้สอน
      instructorData[instructorName].classes.push(classData);
      instructorData[instructorName].totalClasses += 1;
      instructorData[instructorName].totalStudents += studentCount;
    }

    // แปลง object เป็น array เพื่อง่ายต่อการแสดงผล
    const report = Object.keys(instructorData).map((instructorName) => {
      return {
        name: instructorName,
        totalClasses: instructorData[instructorName].totalClasses,
        totalStudents: instructorData[instructorName].totalStudents,
        classes: instructorData[instructorName].classes.sort(
          (a, b) => a.date - b.date
        ), // เรียงตามวันที่
      };
    });

    // ส่งผลลัพธ์กลับไป
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error generating instructor report:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายงานผู้สอน",
      error: error.message,
    });
  }
};

// ฟังก์ชันสำหรับดึงรายงานผู้สอนรายบุคคล
exports.getInstructorDetailReport = async (req, res) => {
  try {
    const instructorName = req.params.instructorName;

    if (!instructorName) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุชื่อผู้สอน",
      });
    }

    // ดึงข้อมูลคลาสของผู้สอนที่ระบุ
    const classes = await Class.find({ instructor: instructorName });

    // ถ้าไม่พบข้อมูลผู้สอน
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบข้อมูลผู้สอนชื่อ ${instructorName}`,
      });
    }

    let totalStudents = 0;
    const classesData = classes.map((classItem) => {
      const studentCount = classItem.participants
        ? classItem.participants.length
        : 0;
      totalStudents += studentCount;

      return {
        title: classItem.title,
        studentCount: studentCount,
        date: classItem.start_time,
        startTime: classItem.start_time,
        endTime: classItem.end_time,
        roomNumber: classItem.room_number || "N/A",
        description: classItem.description || "",
        difficulty: classItem.difficulty || "N/A",
      };
    });

    // เรียงข้อมูลตามวันที่
    classesData.sort((a, b) => a.date - b.date);

    // สร้างข้อมูลรายงาน
    const report = {
      name: instructorName,
      totalClasses: classes.length,
      totalStudents: totalStudents,
      classes: classesData,
    };

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error generating instructor detail report:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายงานผู้สอนรายบุคคล",
      error: error.message,
    });
  }

  // ฟังก์ชันสำหรับลบรายงานผู้สอน
};
exports.deleteInstructorReport = async (req, res) => {
  try {
    const instructorName = req.params.instructorName;

    if (!instructorName) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุชื่อผู้สอน",
      });
    }

    // ลบข้อมูลคลาสของผู้สอนที่ระบุ
    await Class.deleteMany({ instructor: instructorName });

    res.status(200).json({
      success: true,
      message: `ลบข้อมูลรายงานผู้สอน ${instructorName} สำเร็จ`,
    });
  } catch (error) {
    console.error("Error deleting instructor report:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบรายงานผู้สอน",
      error: error.message,
    });
  }
};

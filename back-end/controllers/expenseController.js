const Expense = require("../models/expense");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/receipts");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "receipt-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("รองรับเฉพาะไฟล์ JPG, PNG และ PDF เท่านั้น"));
    }
  },
});

// F006: เพิ่ม แก้ไข และลบข้อมูลรายจ่าย
const createExpense = async (req, res) => {
  try {
    const {
      amount,
      description,
      category,
      expense_date,
      vendor,
      receipt_number,
      notes,
      payment_method,
      is_tax_deductible,
      vat_amount,
      is_recurring,
      recurring_months,
    } = req.body;

    if (!amount || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกจำนวนเงิน รายละเอียด และหมวดหมู่",
      });
    }

    const expenseData = {
      amount: parseFloat(amount),
      description,
      category,
      expense_date: expense_date ? new Date(expense_date) : new Date(),
      vendor,
      receipt_number,
      notes,
      payment_method: payment_method || "transfer",
      is_tax_deductible: is_tax_deductible || false,
      vat_amount: parseFloat(vat_amount) || 0,
      is_recurring: is_recurring || false,
      recurring_months: parseInt(recurring_months) || 1,
      created_by: req.user.userId,
      status: "pending",
    };

    // Handle file upload
    if (req.file) {
      expenseData.receipt_url = `/uploads/receipts/${req.file.filename}`;
      expenseData.receipt_filename = req.file.originalname;
    }

    const expense = new Expense(expenseData);
    await expense.save();

    // ถ้าเป็นรายจ่ายแบบแบ่งงวด สร้างรายการเพิ่มเติม
    if (is_recurring && recurring_months > 1) {
      const recurringExpenses = [];
      const monthlyAmount = Math.round(expense.amount / recurring_months);

      // อัพเดทรายจ่ายแรกให้เป็นจำนวนเงินต่อเดือน
      expense.amount = monthlyAmount;
      expense.recurring_sequence = 1;
      await expense.save();

      // สร้างรายจ่ายสำหรับเดือนถัดไป
      for (let i = 2; i <= recurring_months; i++) {
        const nextExpenseDate = new Date(expense.expense_date);
        nextExpenseDate.setMonth(nextExpenseDate.getMonth() + (i - 1));

        const recurringExpense = new Expense({
          ...expenseData,
          amount: monthlyAmount,
          expense_date: nextExpenseDate,
          recurring_sequence: i,
          parent_expense_id: expense._id,
          description: `${description} (งวดที่ ${i}/${recurring_months})`,
        });

        await recurringExpense.save();
        recurringExpenses.push(recurringExpense);
      }

      return res.status(201).json({
        success: true,
        message: `สร้างรายจ่ายสำเร็จ (แบ่งเป็น ${recurring_months} งวด)`,
        data: {
          main_expense: expense,
          recurring_expenses: recurringExpenses,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "สร้างรายจ่ายสำเร็จ",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายจ่าย",
      error: error.message,
    });
  }
};

// F007: จัดหมวดหมู่รายจ่าย
const getExpensesByCategory = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const matchConditions = {
      status: "approved",
    };

    if (start_date && end_date) {
      matchConditions.expense_date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      };
    }

    const result = await Expense.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$category",
          total_amount: { $sum: "$amount" },
          transaction_count: { $sum: 1 },
          average_amount: { $avg: "$amount" },
          expenses: {
            $push: {
              id: "$_id",
              description: "$description",
              amount: "$amount",
              expense_date: "$expense_date",
              vendor: "$vendor",
            },
          },
        },
      },
      {
        $sort: { total_amount: -1 },
      },
    ]);

    const totalExpense = result.reduce(
      (sum, item) => sum + item.total_amount,
      0
    );

    const formattedResult = result.map((item) => ({
      category: item._id,
      total_amount: item.total_amount,
      transaction_count: item.transaction_count,
      average_amount: Math.round(item.average_amount),
      percentage:
        totalExpense > 0
          ? ((item.total_amount / totalExpense) * 100).toFixed(2)
          : 0,
      formatted_amount: item.total_amount.toLocaleString("th-TH", {
        style: "currency",
        currency: "THB",
      }),
      expenses: item.expenses,
    }));

    res.json({
      success: true,
      data: {
        expense_by_category: formattedResult,
        total_expense: totalExpense,
        formatted_total: totalExpense.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการจัดกลุ่มรายจ่าย",
      error: error.message,
    });
  }
};

// F009: ค้นหาและกรองข้อมูลรายจ่าย
const getAllExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      start_date,
      end_date,
      category,
      status,
      search,
      vendor,
      sort_by = "expense_date",
      sort_order = "desc",
    } = req.query;

    const matchConditions = {};

    if (start_date && end_date) {
      matchConditions.expense_date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      };
    }

    if (category) {
      matchConditions.category = category;
    }

    if (status) {
      matchConditions.status = status;
    }

    if (vendor) {
      matchConditions.vendor = { $regex: vendor, $options: "i" };
    }

    if (search) {
      matchConditions.$or = [
        { description: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { receipt_number: { $regex: search, $options: "i" } },
        { vendor: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sort_order === "desc" ? -1 : 1;
    const sortObj = {};
    sortObj[sort_by] = sortOrder;

    const expenses = await Expense.find(matchConditions)
      .populate("created_by", "name email")
      .populate("approved_by", "name email")
      .populate("parent_expense_id", "description amount")
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(matchConditions);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_records: total,
          per_page: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายจ่าย",
      error: error.message,
    });
  }
};

// F010: แสดงยอดรายจ่ายรวมตามช่วงเวลา
const getTotalExpenseByPeriod = async (req, res) => {
  try {
    const { start_date, end_date, category } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุวันที่เริ่มต้นและสิ้นสุด",
      });
    }

    const matchConditions = {
      expense_date: {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      },
      status: "approved",
    };

    if (category) {
      matchConditions.category = category;
    }

    const result = await Expense.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          total_amount: { $sum: "$amount" },
          transaction_count: { $sum: 1 },
          average_amount: { $avg: "$amount" },
          total_vat: { $sum: "$vat_amount" },
        },
      },
    ]);

    const summary = result[0] || {
      total_amount: 0,
      transaction_count: 0,
      average_amount: 0,
      total_vat: 0,
    };

    res.json({
      success: true,
      data: {
        period: {
          start_date,
          end_date,
          category: category || "all",
        },
        summary: {
          total_amount: summary.total_amount,
          transaction_count: summary.transaction_count,
          average_amount: Math.round(summary.average_amount || 0),
          total_vat: summary.total_vat,
          net_amount: summary.total_amount - summary.total_vat,
          formatted_total: summary.total_amount.toLocaleString("th-TH", {
            style: "currency",
            currency: "THB",
          }),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายจ่าย",
      error: error.message,
    });
  }
};

// อัพเดทรายจ่าย
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // ลบฟิลด์ที่ไม่ควรให้แก้ไข
    delete updateData.created_by;
    delete updateData.approved_by;
    delete updateData.approved_date;

    // Handle file upload
    if (req.file) {
      updateData.receipt_url = `/uploads/receipts/${req.file.filename}`;
      updateData.receipt_filename = req.file.originalname;
    }

    const expense = await Expense.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("created_by", "name email")
      .populate("approved_by", "name email");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลรายจ่าย",
      });
    }

    res.json({
      success: true,
      message: "อัพเดทรายจ่ายสำเร็จ",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัพเดทรายจ่าย",
      error: error.message,
    });
  }
};

// ลบรายจ่าย
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลรายจ่าย",
      });
    }

    // ลบไฟล์ใบเสร็จถ้ามี
    if (expense.receipt_url) {
      const filePath = path.join(__dirname, "../", expense.receipt_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // ถ้าเป็นรายจ่ายหลักที่มีการแบ่งงวด ให้ลบทั้งหมด
    if (expense.is_recurring && !expense.parent_expense_id) {
      await Expense.deleteMany({ parent_expense_id: expense._id });
    }

    await Expense.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "ลบรายจ่ายสำเร็จ",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบรายจ่าย",
      error: error.message,
    });
  }
};

// อนุมัติรายจ่าย
const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลรายจ่าย",
      });
    }

    if (expense.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "รายจ่ายนี้ถูกดำเนินการแล้ว",
      });
    }

    expense.status = "approved";
    expense.approved_by = req.user.userId;
    expense.approved_date = new Date();

    if (notes) {
      expense.notes = expense.notes
        ? `${expense.notes}\n\nหมายเหตุการอนุมัติ: ${notes}`
        : `หมายเหตุการอนุมัติ: ${notes}`;
    }

    await expense.save();

    const populatedExpense = await Expense.findById(id)
      .populate("created_by", "name email")
      .populate("approved_by", "name email");

    res.json({
      success: true,
      message: "อนุมัติรายจ่ายสำเร็จ",
      data: populatedExpense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอนุมัติรายจ่าย",
      error: error.message,
    });
  }
};

// ปฏิเสธรายจ่าย
const rejectExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลรายจ่าย",
      });
    }

    if (expense.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "รายจ่ายนี้ถูกดำเนินการแล้ว",
      });
    }

    expense.status = "rejected";
    expense.approved_by = req.user.userId;
    expense.approved_date = new Date();

    if (reason) {
      expense.notes = expense.notes
        ? `${expense.notes}\n\nเหตุผลที่ปฏิเสธ: ${reason}`
        : `เหตุผลที่ปฏิเสธ: ${reason}`;
    }

    await expense.save();

    const populatedExpense = await Expense.findById(id)
      .populate("created_by", "name email")
      .populate("approved_by", "name email");

    res.json({
      success: true,
      message: "ปฏิเสธรายจ่ายสำเร็จ",
      data: populatedExpense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการปฏิเสธรายจ่าย",
      error: error.message,
    });
  }
};

// ดึงข้อมูลรายจ่ายตาม ID
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate("created_by", "name email")
      .populate("approved_by", "name email")
      .populate("parent_expense_id", "description amount");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลรายจ่าย",
      });
    }

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายจ่าย",
      error: error.message,
    });
  }
};

// ดาวน์โหลดใบเสร็จ
const downloadReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);

    if (!expense || !expense.receipt_url) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบไฟล์ใบเสร็จ",
      });
    }

    const filePath = path.join(__dirname, "../", expense.receipt_url);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "ไฟล์ใบเสร็จไม่พบในระบบ",
      });
    }

    res.download(filePath, expense.receipt_filename || "receipt");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดาวน์โหลดใบเสร็จ",
      error: error.message,
    });
  }
};

module.exports = {
  upload,
  createExpense,
  getExpensesByCategory,
  getAllExpenses,
  getTotalExpenseByPeriod,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getExpenseById,
  downloadReceipt,
};

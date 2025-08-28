const Income = require("../models/income");
const Order = require("../models/order");
const Reservation = require("../models/reservation");
const User = require("../models/user");
const Goods = require("../models/goods");
const mongoose = require("mongoose");

// F001: บันทึกรายรับจากการขายแพ็คเกจ/sessions อัตโนมัติ
// F002: บันทึกรายรับจากการขายสินค้า (goods) อัตโนมัติ
const createIncomeFromOrder = async (orderData, session = null) => {
  try {
    const incomeData = {
      amount: orderData.total_amount || orderData.amount,
      description: `รายรับจากการขาย ${orderData.order_type === "product" ? "แพ็คเกจ" : "สินค้า"
        } - Order #${orderData._id}`,
      income_type: orderData.order_type === "product" ? "package" : "goods",
      income_date: orderData.createdAt || new Date(),
      order_id: orderData._id,
      created_by: orderData.user_id,
      payment_method: orderData.payment_method || "transfer",
      reference_number: orderData.payment_reference,
      status: orderData.status || "pending", // ใช้ status ที่ส่งมา หรือเป็น pending
      category:
        orderData.order_type === "product" ? "package_sales" : "goods_sales",
    };

    const income = new Income(incomeData);

    if (session) {
      await income.save({ session });
    } else {
      await income.save();
    }

    return income;
  } catch (error) {
    throw new Error(`Failed to create income from order: ${error.message}`);
  }
};

// F003: แสดงยอดรายรับรวมตามช่วงเวลาที่กำหนด
const getTotalIncomeByPeriod = async (req, res) => {
  try {
    const { start_date, end_date, income_type } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุวันที่เริ่มต้นและสิ้นสุด",
      });
    }

    const matchConditions = {
      income_date: {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      },
      status: "confirmed",
    };

    if (income_type) {
      matchConditions.income_type = income_type;
    }

    const result = await Income.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          total_amount: { $sum: "$amount" },
          transaction_count: { $sum: 1 },
          average_amount: { $avg: "$amount" },
        },
      },
    ]);

    const summary = result[0] || {
      total_amount: 0,
      transaction_count: 0,
      average_amount: 0,
    };

    res.json({
      success: true,
      data: {
        period: {
          start_date,
          end_date,
          income_type: income_type || "all",
        },
        summary: {
          total_amount: summary.total_amount,
          transaction_count: summary.transaction_count,
          average_amount: Math.round(summary.average_amount || 0),
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
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายรับ",
      error: error.message,
    });
  }
};

// F004: จัดกลุ่มรายรับตามประเภท (แพ็คเกจ/สินค้า)
const getIncomeByType = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const matchConditions = {
      status: "confirmed",
    };

    if (start_date && end_date) {
      matchConditions.income_date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      };
    }

    const result = await Income.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$income_type",
          total_amount: { $sum: "$amount" },
          transaction_count: { $sum: 1 },
          average_amount: { $avg: "$amount" },
        },
      },
      {
        $sort: { total_amount: -1 },
      },
    ]);

    const totalIncome = result.reduce(
      (sum, item) => sum + item.total_amount,
      0
    );

    const formattedResult = result.map((item) => ({
      income_type: item._id,
      total_amount: item.total_amount,
      transaction_count: item.transaction_count,
      average_amount: Math.round(item.average_amount),
      percentage:
        totalIncome > 0
          ? ((item.total_amount / totalIncome) * 100).toFixed(2)
          : 0,
      formatted_amount: item.total_amount.toLocaleString("th-TH", {
        style: "currency",
        currency: "THB",
      }),
    }));

    res.json({
      success: true,
      data: {
        income_by_type: formattedResult,
        total_income: totalIncome,
        formatted_total: totalIncome.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการจัดกลุ่มรายรับ",
      error: error.message,
    });
  }
};

// F005: แสดงรายรับรายวัน รายเดือน และรายปี
const getIncomeByPeriod = async (req, res) => {
  try {
    const { period_type, year, month } = req.query;

    if (!period_type) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุประเภทของช่วงเวลา (daily, monthly, yearly)",
      });
    }

    let matchConditions = { status: "confirmed" };
    let groupBy = {};
    let sortBy = {};

    if (period_type === "daily") {
      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุปีและเดือนสำหรับข้อมูลรายวัน",
        });
      }

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      matchConditions.income_date = {
        $gte: startDate,
        $lte: endDate,
      };

      groupBy = {
        year: { $year: "$income_date" },
        month: { $month: "$income_date" },
        day: { $dayOfMonth: "$income_date" },
      };

      sortBy = { "_id.year": 1, "_id.month": 1, "_id.day": 1 };
    } else if (period_type === "monthly") {
      if (!year) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุปีสำหรับข้อมูลรายเดือน",
        });
      }

      matchConditions.income_date = {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31),
      };

      groupBy = {
        year: { $year: "$income_date" },
        month: { $month: "$income_date" },
      };

      sortBy = { "_id.year": 1, "_id.month": 1 };
    } else if (period_type === "yearly") {
      groupBy = {
        year: { $year: "$income_date" },
      };

      sortBy = { "_id.year": 1 };
    }

    const result = await Income.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: groupBy,
          total_amount: { $sum: "$amount" },
          transaction_count: { $sum: 1 },
          income_by_type: {
            $push: {
              type: "$income_type",
              amount: "$amount",
            },
          },
        },
      },
      { $sort: sortBy },
    ]);

    // Format the results
    const formattedResult = result.map((item) => {
      let period_label = "";

      if (period_type === "daily") {
        period_label = `${item._id.day}/${item._id.month}/${item._id.year}`;
      } else if (period_type === "monthly") {
        period_label = `${item._id.month}/${item._id.year}`;
      } else if (period_type === "yearly") {
        period_label = item._id.year.toString();
      }

      // Group income by type for this period
      const incomeByType = {};
      item.income_by_type.forEach((income) => {
        if (!incomeByType[income.type]) {
          incomeByType[income.type] = 0;
        }
        incomeByType[income.type] += income.amount;
      });

      return {
        period: item._id,
        period_label,
        total_amount: item.total_amount,
        transaction_count: item.transaction_count,
        income_by_type: incomeByType,
        formatted_amount: item.total_amount.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
      };
    });

    res.json({
      success: true,
      data: {
        period_type,
        results: formattedResult,
        total_periods: formattedResult.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายรับตามช่วงเวลา",
      error: error.message,
    });
  }
};

// เพิ่มรายรับแบบ manual
const createManualIncome = async (req, res) => {
  try {
    const {
      amount,
      description,
      income_type = "manual",
      income_date,
      payment_method,
      reference_number,
      notes,
      category,
    } = req.body;

    if (!amount || !description) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกจำนวนเงินและรายละเอียด",
      });
    }

    const income = new Income({
      amount: parseFloat(amount),
      description,
      income_type,
      income_date: income_date ? new Date(income_date) : new Date(),
      payment_method: payment_method || "cash",
      reference_number,
      notes,
      category: category || "manual",
      created_by: req.user ? req.user.userId : null,
      status: "confirmed",
    });

    await income.save();

    res.status(201).json({
      success: true,
      message: "เพิ่มรายรับสำเร็จ",
      data: income,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มรายรับ",
      error: error.message,
    });
  }
};

// ดึงรายการรายรับทั้งหมด
// ในไฟล์ /controllers/incomeController.js

// ดึงรายการรายรับทั้งหมด
const getAllIncome = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      start_date,
      end_date,
      income_type,
      status,
      search,
    } = req.query;

    const matchConditions = {};

    // ===================================================================
    // =======================   จุดที่แก้ไข   ===========================
    // ===================================================================
    // Logic การกรองวันที่ (แก้ไขให้ครอบคลุมเวลาทั้งหมดของวัน)
    if (start_date && end_date) {
      // สร้าง Object วันที่เริ่มต้น ให้เป็นเวลา 00:00:00 ของวันนั้น
      const startDateObj = new Date(start_date);
      startDateObj.setHours(0, 0, 0, 0);

      // สร้าง Object วันที่สิ้นสุด ให้เป็นเวลา 23:59:59.999 ของวันนั้น
      const endDateObj = new Date(end_date);
      endDateObj.setHours(23, 59, 59, 999); // <-- นี่คือหัวใจของการแก้ไข

      matchConditions.income_date = {
        $gte: startDateObj,
        $lte: endDateObj,
      };
    } else if (start_date) {
      const startDateObj = new Date(start_date);
      startDateObj.setHours(0, 0, 0, 0);
      matchConditions.income_date = { $gte: startDateObj };
    } else if (end_date) {
      const endDateObj = new Date(end_date);
      endDateObj.setHours(23, 59, 59, 999);
      matchConditions.income_date = { $lte: endDateObj };
    }
    // ===================================================================
    // ===================================================================

    // Logic การกรองประเภทรายรับ
    if (income_type) {
      matchConditions.income_type = income_type;
    }

    // Logic การกรองสถานะ (จากรอบที่แล้ว)
    if (status) {
      matchConditions.status = status;
    } else {
      matchConditions.status = { $in: ["confirmed", "pending"] };
    }

    // Logic การค้นหา
    if (search) {
      matchConditions.$or = [
        { description: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { reference_number: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const incomes = await Income.find(matchConditions)
      .populate("created_by", "name email")
      .populate("order_id")
      .sort({ income_date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Income.countDocuments(matchConditions);

    const summaryData = await Income.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          total_amount: { $sum: "$amount" },
        },
      },
    ]);

    const totalAmount = summaryData.length > 0 ? summaryData[0].total_amount : 0;

    res.json({
      success: true,
      data: {
        incomes,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_records: total,
          per_page: parseInt(limit),
        },
        summary: {
          total_amount: totalAmount,
          formatted_total: totalAmount.toLocaleString("th-TH", {
            style: "currency",
            currency: "THB",
          }),
        },
        filters: {
          start_date: start_date || null,
          end_date: end_date || null,
          income_type: income_type || null,
          status: status || "all (confirmed, pending)",
          search: search || null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายรับ",
      error: error.message,
    });
  }
};

// อัพเดทรายรับ
const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // ลบฟิลด์ที่ไม่ควรให้แก้ไข
    delete updateData.order_id;
    delete updateData.reservation_id;
    delete updateData.created_by;

    const income = await Income.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("created_by", "name email");

    if (!income) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลรายรับ",
      });
    }

    res.json({
      success: true,
      message: "อัพเดทรายรับสำเร็จ",
      data: income,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัพเดทรายรับ",
      error: error.message,
    });
  }
};

const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;

    const income = await Income.findById(id)
      .populate({
        path: 'order_id',
        populate: [
          { path: 'product_id' },
          { path: 'goods_id' }
        ]
      });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลรายรับ",
      });
    }

    if (income.order_id) {
      console.log(`Income is linked to Order ID: ${income.order_id._id}. Reverting actions...`);
      const associatedOrder = income.order_id;

      if (associatedOrder.status === 'อนุมัติ') {
        if (associatedOrder.order_type === 'product' && associatedOrder.product_id) {
          // คืน Session ให้ User
          await User.findByIdAndUpdate(associatedOrder.user_id, {
            $inc: { remaining_session: - (associatedOrder.product_id.sessions * associatedOrder.quantity) }
          });
          console.log(`Reverted sessions for user ${associatedOrder.user_id}`);
        } else if (associatedOrder.order_type === 'goods' && associatedOrder.goods_id) {
          // คืน Stock ให้สินค้า
          await Goods.findByIdAndUpdate(associatedOrder.goods_id._id, {
            $inc: { stock: associatedOrder.quantity }
          });
          console.log(`Reverted stock for goods ${associatedOrder.goods_id._id}`);
        }
      }

      await Order.findByIdAndUpdate(associatedOrder._id, {
        status: 'ยกเลิก',
        notes: `ถูกยกเลิกอัตโนมัติเนื่องจากรายรับ ID: ${income._id} ถูกลบโดยตรงจากระบบ Finance`
      });
      console.log(`Order status updated to 'ยกเลิก' for Order ID: ${associatedOrder._id}`);
    }

    await Income.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "ลบรายรับสำเร็จ และได้ทำการปรับปรุง Order ที่เกี่ยวข้อง (ถ้ามี) เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบรายรับ",
      error: error.message,
    });
  }
};

// ดึงข้อมูลรายรับตาม ID
const getIncomeById = async (req, res) => {
  try {
    const { id } = req.params;

    const income = await Income.findById(id)
      .populate("created_by", "name email")
      .populate("order_id");

    if (!income) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลรายรับ",
      });
    }

    res.json({
      success: true,
      data: income,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายรับ",
      error: error.message,
    });
  }
};

// ส่งออกข้อมูลรายรับเป็น CSV
const exportIncomeToCSV = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุวันที่เริ่มต้นและสิ้นสุด",
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    const incomes = await Income.find({
      income_date: { $gte: startDate, $lte: endDate }
    }).sort({ income_date: -1 });

    // สร้าง CSV content
    let csvContent = `รายงานรายรับ,${start_date} ถึง ${end_date}\n\n`;
    csvContent += `วันที่,รายละเอียด,ประเภท,จำนวนเงิน,วิธีชำระ,สถานะ,หมายเหตุ\n`;

    incomes.forEach(income => {
      const date = income.income_date.toISOString().split('T')[0];
      csvContent += `${date},"${income.description}","${income.income_type}",${income.amount},"${income.payment_method}","${income.status}","${income.notes || ''}"\n`;
    });

    const timestamp = new Date().toISOString().slice(0, -5);
    const filename = `income-report-${timestamp}.csv`;

    // Set response headers for CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Add BOM for UTF-8 to ensure proper encoding in Excel
    res.write('\uFEFF');
    res.write(csvContent);
    res.end();

  } catch (error) {
    console.error('Income CSV export error:', error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการส่งออกรายงานรายรับ CSV",
      error: error.message,
    });
  }
};

module.exports = {
  createIncomeFromOrder,
  getTotalIncomeByPeriod,
  getIncomeByType,
  getIncomeByPeriod,
  createManualIncome,
  getAllIncome,
  updateIncome,
  deleteIncome,
  getIncomeById,
  exportIncomeToCSV,
};

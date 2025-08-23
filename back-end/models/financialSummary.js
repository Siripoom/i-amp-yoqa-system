const mongoose = require("mongoose");

const financialSummarySchema = new mongoose.Schema(
  {
    // ช่วงเวลา
    period_type: {
      type: String,
      enum: ["daily", "monthly", "yearly"],
      required: true,
    },

    // วันที่เริ่มต้นและสิ้นสุดของงวด
    period_start: {
      type: Date,
      required: true,
    },

    period_end: {
      type: Date,
      required: true,
    },

    // ข้อมูลรายรับ
    total_income: {
      type: Number,
      default: 0,
      min: 0,
    },

    income_by_type: {
      package: { type: Number, default: 0 },
      product: { type: Number, default: 0 },
      goods: { type: Number, default: 0 },
      session: { type: Number, default: 0 },
      manual: { type: Number, default: 0 },
    },

    // ข้อมูลรายจ่าย
    total_expense: {
      type: Number,
      default: 0,
      min: 0,
    },

    expense_by_category: {
      rent: { type: Number, default: 0 },
      salary: { type: Number, default: 0 },
      equipment: { type: Number, default: 0 },
      utilities: { type: Number, default: 0 },
      marketing: { type: Number, default: 0 },
      supplies: { type: Number, default: 0 },
      maintenance: { type: Number, default: 0 },
      training: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      transportation: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    // กำไร/ขาดทุน
    net_profit: {
      type: Number,
      default: 0,
    },

    profit_margin: {
      type: Number,
      default: 0,
    },

    // จำนวนธุรกรรม
    income_transactions: {
      type: Number,
      default: 0,
    },

    expense_transactions: {
      type: Number,
      default: 0,
    },

    // สถานะการคำนวณ
    is_calculated: {
      type: Boolean,
      default: false,
    },

    calculated_at: {
      type: Date,
      default: null,
    },

    // ผู้คำนวณ
    calculated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ข้อมูลเปรียบเทียบ
    comparison_data: {
      previous_period_income: { type: Number, default: 0 },
      previous_period_expense: { type: Number, default: 0 },
      previous_period_profit: { type: Number, default: 0 },
      income_growth_rate: { type: Number, default: 0 },
      expense_growth_rate: { type: Number, default: 0 },
      profit_growth_rate: { type: Number, default: 0 },
    },

    // หมายเหตุ
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
financialSummarySchema.index({ period_type: 1, period_start: 1 });
financialSummarySchema.index({ period_start: 1, period_end: 1 });
financialSummarySchema.index({ is_calculated: 1 });

// Virtual fields
financialSummarySchema.virtual("period_label").get(function () {
  const start = this.period_start;
  const end = this.period_end;

  if (this.period_type === "daily") {
    return start.toLocaleDateString("th-TH");
  } else if (this.period_type === "monthly") {
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  } else if (this.period_type === "yearly") {
    return start.getFullYear().toString();
  }

  return `${start.toLocaleDateString(
    "th-TH"
  )} - ${end.toLocaleDateString("th-TH")}`;
});

// Methods
financialSummarySchema.methods.calculateSummary = async function () {
  const Income = mongoose.model("Income");
  const Expense = mongoose.model("Expense");

  // คำนวณรายรับ
  const incomeAgg = await Income.aggregate([
    {
      $match: {
        income_date: {
          $gte: this.period_start,
          $lte: this.period_end,
        },
        status: "confirmed",
      },
    },
    {
      $group: {
        _id: "$income_type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  // คำนวณรายจ่าย
  const expenseAgg = await Expense.aggregate([
    {
      $match: {
        expense_date: {
          $gte: this.period_start,
          $lte: this.period_end,
        },
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  // รีเซ็ตค่า
  this.total_income = 0;
  this.total_expense = 0;
  this.income_transactions = 0;
  this.expense_transactions = 0;

  // อัพเดทรายรับ
  incomeAgg.forEach((item) => {
    this.income_by_type[item._id] = item.total;
    this.total_income += item.total;
    this.income_transactions += item.count;
  });

  // อัพเดทรายจ่าย
  expenseAgg.forEach((item) => {
    this.expense_by_category[item._id] = item.total;
    this.total_expense += item.total;
    this.expense_transactions += item.count;
  });

  // คำนวณกำไร
  this.net_profit = this.total_income - this.total_expense;
  this.profit_margin =
    this.total_income > 0 ? (this.net_profit / this.total_income) * 100 : 0;

  // อัพเดทสถานะ
  this.is_calculated = true;
  this.calculated_at = new Date();

  return this.save();
};

module.exports = mongoose.model("FinancialSummary", financialSummarySchema);

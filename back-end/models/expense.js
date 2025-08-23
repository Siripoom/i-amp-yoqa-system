const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    // ข้อมูลหลัก
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // หมวดหมู่รายจ่าย
    category: {
      type: String,
      enum: [
        "rent", // ค่าเช่า
        "salary", // เงินเดือน
        "equipment", // อุปกรณ์
        "utilities", // ค่าสาธารณูปโภค
        "marketing", // การตลาด
        "supplies", // วัสดุสิ้นเปลือง
        "maintenance", // ค่าบำรุงรักษา
        "training", // ค่าฝึกอบรม
        "insurance", // ค่าประกัน
        "transportation", // ค่าเดินทาง
        "other", // อื่นๆ
      ],
      required: true,
    },

    // วันที่ที่เกิดรายจ่าย
    expense_date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // ใบเสร็จ/หลักฐาน
    receipt_url: {
      type: String,
      trim: true,
    },

    receipt_filename: {
      type: String,
      trim: true,
    },

    // ผู้จำหน่าย/ร้านค้า
    vendor: {
      type: String,
      trim: true,
    },

    // หมายเลขใบเสร็จ
    receipt_number: {
      type: String,
      trim: true,
    },

    // รายละเอียดเพิ่มเติม
    notes: {
      type: String,
      trim: true,
    },

    // สถานะ
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
    },

    // ผู้สร้างข้อมูล
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ผู้อนุมัติ
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approved_date: {
      type: Date,
      default: null,
    },

    // วิธีการชำระเงิน
    payment_method: {
      type: String,
      enum: ["cash", "transfer", "credit_card", "check", "other"],
      default: "transfer",
    },

    // ข้อมูลภาษี
    is_tax_deductible: {
      type: Boolean,
      default: false,
    },

    vat_amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // การแบ่งรายจ่าย (ถ้ามีการแบ่งเป็นหลายเดือน)
    is_recurring: {
      type: Boolean,
      default: false,
    },

    recurring_months: {
      type: Number,
      default: 1,
      min: 1,
    },

    // เดือนที่ของการแบ่งจ่าย
    recurring_sequence: {
      type: Number,
      default: 1,
      min: 1,
    },

    // อ้างอิงไปยังรายจ่ายหลัก (ถ้าเป็นการแบ่งจ่าย)
    parent_expense_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
expenseSchema.index({ expense_date: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ created_by: 1 });
expenseSchema.index({ approved_by: 1 });
expenseSchema.index({ vendor: 1 });

// Virtual fields
expenseSchema.virtual("formatted_amount").get(function () {
  return this.amount.toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
  });
});

expenseSchema.virtual("net_amount").get(function () {
  return this.amount - this.vat_amount;
});

// Methods
expenseSchema.methods.isApproved = function () {
  return this.status === "approved";
};

expenseSchema.methods.approve = function (approver_id) {
  this.status = "approved";
  this.approved_by = approver_id;
  this.approved_date = new Date();
  return this.save();
};

expenseSchema.methods.reject = function () {
  this.status = "rejected";
  return this.save();
};

module.exports = mongoose.model("Expense", expenseSchema);

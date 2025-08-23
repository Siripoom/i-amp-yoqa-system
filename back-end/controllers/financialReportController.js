const Income = require("../models/income");
const Expense = require("../models/expense");
const FinancialSummary = require("../models/financialSummary");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

// F011: สร้างรายงานกำไร-ขาดทุน (P&L Statement)
const generateProfitLossReport = async (req, res) => {
  try {
    const { start_date, end_date, period_type = "monthly" } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุวันที่เริ่มต้นและสิ้นสุด",
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // ดึงข้อมูลรายรับ
    const incomeData = await Income.aggregate([
      {
        $match: {
          income_date: { $gte: startDate, $lte: endDate },
          status: "confirmed",
        },
      },
      {
        $group: {
          _id: "$income_type",
          total_amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // ดึงข้อมูลรายจ่าย
    const expenseData = await Expense.aggregate([
      {
        $match: {
          expense_date: { $gte: startDate, $lte: endDate },
          status: "approved",
        },
      },
      {
        $group: {
          _id: "$category",
          total_amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // คำนวณรายรับรวม
    const totalIncome = incomeData.reduce(
      (sum, item) => sum + item.total_amount,
      0
    );
    const incomeByType = {};
    incomeData.forEach((item) => {
      incomeByType[item._id] = {
        amount: item.total_amount,
        count: item.count,
        percentage:
          totalIncome > 0
            ? ((item.total_amount / totalIncome) * 100).toFixed(2)
            : 0,
      };
    });

    // คำนวณรายจ่ายรวม
    const totalExpense = expenseData.reduce(
      (sum, item) => sum + item.total_amount,
      0
    );
    const expenseByCategory = {};
    expenseData.forEach((item) => {
      expenseByCategory[item._id] = {
        amount: item.total_amount,
        count: item.count,
        percentage:
          totalExpense > 0
            ? ((item.total_amount / totalExpense) * 100).toFixed(2)
            : 0,
      };
    });

    // คำนวณกำไร/ขาดทุน
    const netProfit = totalIncome - totalExpense;
    const profitMargin =
      totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0;

    // สร้างรายงาน
    const report = {
      period: {
        start_date: start_date,
        end_date: end_date,
        period_type,
      },
      revenue: {
        total_income: totalIncome,
        income_by_type: incomeByType,
        formatted_total_income: totalIncome.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
      },
      expenses: {
        total_expense: totalExpense,
        expense_by_category: expenseByCategory,
        formatted_total_expense: totalExpense.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
      },
      profit_loss: {
        net_profit: netProfit,
        profit_margin: parseFloat(profitMargin),
        is_profitable: netProfit > 0,
        formatted_net_profit: netProfit.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
      },
      summary: {
        total_income_transactions: incomeData.reduce(
          (sum, item) => sum + item.count,
          0
        ),
        total_expense_transactions: expenseData.reduce(
          (sum, item) => sum + item.count,
          0
        ),
        generated_at: new Date(),
        generated_by: req.user.userId,
      },
    };

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายงานกำไร-ขาดทุน",
      error: error.message,
    });
  }
};

// F012: สร้างรายงานกระแสเงินสด (Cash Flow)
const generateCashFlowReport = async (req, res) => {
  try {
    const { start_date, end_date, period_type = "monthly" } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุวันที่เริ่มต้นและสิ้นสุด",
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // สร้าง aggregation pipeline สำหรับจัดกลุ่มตามช่วงเวลา
    let dateGrouping = {};

    if (period_type === "daily") {
      dateGrouping = {
        year: { $year: "$date" },
        month: { $month: "$date" },
        day: { $dayOfMonth: "$date" },
      };
    } else if (period_type === "monthly") {
      dateGrouping = {
        year: { $year: "$date" },
        month: { $month: "$date" },
      };
    } else if (period_type === "yearly") {
      dateGrouping = {
        year: { $year: "$date" },
      };
    }

    // ดึงข้อมูลกระแสเงินสดเข้า (รายรับ)
    const cashInflows = await Income.aggregate([
      {
        $match: {
          income_date: { $gte: startDate, $lte: endDate },
          status: "confirmed",
        },
      },
      {
        $addFields: {
          date: "$income_date",
        },
      },
      {
        $group: {
          _id: dateGrouping,
          total_inflow: { $sum: "$amount" },
          transactions: {
            $push: {
              amount: "$amount",
              description: "$description",
              type: "$income_type",
              date: "$income_date",
              payment_method: "$payment_method",
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // ดึงข้อมูลกระแสเงินสดออก (รายจ่าย)
    const cashOutflows = await Expense.aggregate([
      {
        $match: {
          expense_date: { $gte: startDate, $lte: endDate },
          status: "approved",
        },
      },
      {
        $addFields: {
          date: "$expense_date",
        },
      },
      {
        $group: {
          _id: dateGrouping,
          total_outflow: { $sum: "$amount" },
          transactions: {
            $push: {
              amount: "$amount",
              description: "$description",
              category: "$category",
              date: "$expense_date",
              payment_method: "$payment_method",
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // รวมข้อมูลกระแสเงินสด
    const cashFlowData = {};
    let runningBalance = 0;

    // เพิ่มข้อมูลเงินเข้า
    cashInflows.forEach((inflow) => {
      const periodKey = JSON.stringify(inflow._id);
      if (!cashFlowData[periodKey]) {
        cashFlowData[periodKey] = {
          period: inflow._id,
          cash_inflow: 0,
          cash_outflow: 0,
          net_cash_flow: 0,
          running_balance: 0,
          inflow_transactions: [],
          outflow_transactions: [],
        };
      }
      cashFlowData[periodKey].cash_inflow = inflow.total_inflow;
      cashFlowData[periodKey].inflow_transactions = inflow.transactions;
    });

    // เพิ่มข้อมูลเงินออก
    cashOutflows.forEach((outflow) => {
      const periodKey = JSON.stringify(outflow._id);
      if (!cashFlowData[periodKey]) {
        cashFlowData[periodKey] = {
          period: outflow._id,
          cash_inflow: 0,
          cash_outflow: 0,
          net_cash_flow: 0,
          running_balance: 0,
          inflow_transactions: [],
          outflow_transactions: [],
        };
      }
      cashFlowData[periodKey].cash_outflow = outflow.total_outflow;
      cashFlowData[periodKey].outflow_transactions = outflow.transactions;
    });

    // คำนวณกระแสเงินสดสุทธิและยอดคงเหลือสะสม
    const sortedPeriods = Object.values(cashFlowData).sort((a, b) => {
      if (a.period.year !== b.period.year) return a.period.year - b.period.year;
      if (a.period.month !== b.period.month)
        return (a.period.month || 0) - (b.period.month || 0);
      return (a.period.day || 0) - (b.period.day || 0);
    });

    sortedPeriods.forEach((period) => {
      period.net_cash_flow = period.cash_inflow - period.cash_outflow;
      runningBalance += period.net_cash_flow;
      period.running_balance = runningBalance;

      // Format period label
      if (period_type === "daily") {
        period.period_label = `${period.period.day}/${period.period.month}/${period.period.year}`;
      } else if (period_type === "monthly") {
        period.period_label = `${period.period.month}/${period.period.year}`;
      } else {
        period.period_label = period.period.year.toString();
      }

      // Add formatted amounts
      period.formatted_cash_inflow = period.cash_inflow.toLocaleString(
        "th-TH",
        {
          style: "currency",
          currency: "THB",
        }
      );
      period.formatted_cash_outflow = period.cash_outflow.toLocaleString(
        "th-TH",
        {
          style: "currency",
          currency: "THB",
        }
      );
      period.formatted_net_cash_flow = period.net_cash_flow.toLocaleString(
        "th-TH",
        {
          style: "currency",
          currency: "THB",
        }
      );
      period.formatted_running_balance = period.running_balance.toLocaleString(
        "th-TH",
        {
          style: "currency",
          currency: "THB",
        }
      );
    });

    // สรุปรายงาน
    const totalInflow = sortedPeriods.reduce(
      (sum, period) => sum + period.cash_inflow,
      0
    );
    const totalOutflow = sortedPeriods.reduce(
      (sum, period) => sum + period.cash_outflow,
      0
    );
    const netCashFlow = totalInflow - totalOutflow;

    const report = {
      period: {
        start_date,
        end_date,
        period_type,
      },
      cash_flow_data: sortedPeriods,
      summary: {
        total_cash_inflow: totalInflow,
        total_cash_outflow: totalOutflow,
        net_cash_flow: netCashFlow,
        final_balance: runningBalance,
        formatted_total_inflow: totalInflow.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
        formatted_total_outflow: totalOutflow.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
        formatted_net_cash_flow: netCashFlow.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
        formatted_final_balance: runningBalance.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
      },
      generated_at: new Date(),
      generated_by: req.user.userId,
    };

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างรายงานกระแสเงินสด",
      error: error.message,
    });
  }
};

// F013: สรุปยอดรายรับ-รายจ่ายรายเดือน
const getMonthlySummary = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุปี",
      });
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // ดึงข้อมูลรายรับรายเดือน
    const monthlyIncome = await Income.aggregate([
      {
        $match: {
          income_date: { $gte: startDate, $lte: endDate },
          status: "confirmed",
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$income_date" },
            year: { $year: "$income_date" },
          },
          total_income: { $sum: "$amount" },
          income_count: { $sum: 1 },
          income_by_type: {
            $push: {
              type: "$income_type",
              amount: "$amount",
            },
          },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    // ดึงข้อมูลรายจ่ายรายเดือน
    const monthlyExpense = await Expense.aggregate([
      {
        $match: {
          expense_date: { $gte: startDate, $lte: endDate },
          status: "approved",
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$expense_date" },
            year: { $year: "$expense_date" },
          },
          total_expense: { $sum: "$amount" },
          expense_count: { $sum: 1 },
          expense_by_category: {
            $push: {
              category: "$category",
              amount: "$amount",
            },
          },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    // สร้างข้อมูลรายเดือน (12 เดือน)
    const monthlyData = [];
    const monthNames = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    for (let month = 1; month <= 12; month++) {
      const incomeData = monthlyIncome.find((item) => item._id.month === month);
      const expenseData = monthlyExpense.find(
        (item) => item._id.month === month
      );

      const totalIncome = incomeData ? incomeData.total_income : 0;
      const totalExpense = expenseData ? expenseData.total_expense : 0;
      const netProfit = totalIncome - totalExpense;

      // จัดกลุ่มรายรับตามประเภท
      const incomeByType = {};
      if (incomeData) {
        incomeData.income_by_type.forEach((item) => {
          if (!incomeByType[item.type]) {
            incomeByType[item.type] = 0;
          }
          incomeByType[item.type] += item.amount;
        });
      }

      // จัดกลุ่มรายจ่ายตามหมวดหมู่
      const expenseByCategory = {};
      if (expenseData) {
        expenseData.expense_by_category.forEach((item) => {
          if (!expenseByCategory[item.category]) {
            expenseByCategory[item.category] = 0;
          }
          expenseByCategory[item.category] += item.amount;
        });
      }

      monthlyData.push({
        month: month,
        month_name: monthNames[month - 1],
        year: parseInt(year),
        total_income: totalIncome,
        total_expense: totalExpense,
        net_profit: netProfit,
        profit_margin:
          totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0,
        income_count: incomeData ? incomeData.income_count : 0,
        expense_count: expenseData ? expenseData.expense_count : 0,
        income_by_type: incomeByType,
        expense_by_category: expenseByCategory,
        formatted_total_income: totalIncome.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
        formatted_total_expense: totalExpense.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
        formatted_net_profit: netProfit.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
        }),
      });
    }

    // สรุปรวมทั้งปี
    const yearSummary = {
      year: parseInt(year),
      total_income: monthlyData.reduce(
        (sum, month) => sum + month.total_income,
        0
      ),
      total_expense: monthlyData.reduce(
        (sum, month) => sum + month.total_expense,
        0
      ),
      net_profit: monthlyData.reduce((sum, month) => sum + month.net_profit, 0),
      total_income_transactions: monthlyData.reduce(
        (sum, month) => sum + month.income_count,
        0
      ),
      total_expense_transactions: monthlyData.reduce(
        (sum, month) => sum + month.expense_count,
        0
      ),
    };

    yearSummary.profit_margin =
      yearSummary.total_income > 0
        ? ((yearSummary.net_profit / yearSummary.total_income) * 100).toFixed(2)
        : 0;

    yearSummary.formatted_total_income =
      yearSummary.total_income.toLocaleString("th-TH", {
        style: "currency",
        currency: "THB",
      });
    yearSummary.formatted_total_expense =
      yearSummary.total_expense.toLocaleString("th-TH", {
        style: "currency",
        currency: "THB",
      });
    yearSummary.formatted_net_profit = yearSummary.net_profit.toLocaleString(
      "th-TH",
      {
        style: "currency",
        currency: "THB",
      }
    );

    res.json({
      success: true,
      data: {
        monthly_data: monthlyData,
        year_summary: yearSummary,
        generated_at: new Date(),
        generated_by: req.user.userId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างสรุปรายเดือน",
      error: error.message,
    });
  }
};

// F014: เปรียบเทียบข้อมูลการเงินระหว่างเดือน
const getFinancialComparison = async (req, res) => {
  try {
    const { current_year, current_month, compare_year, compare_month } =
      req.query;

    if (!current_year || !current_month) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุปีและเดือนปัจจุบัน",
      });
    }

    // ถ้าไม่ระบุเดือนเปรียบเทียบ ให้ใช้เดือนก่อนหน้า
    const compareYear = compare_year || current_year;
    const compareMonth =
      compare_month || (current_month > 1 ? current_month - 1 : 12);
    const adjustedCompareYear =
      compare_month || (current_month > 1 ? current_year : current_year - 1);

    // ข้อมูลเดือนปัจจุบัน
    const currentStartDate = new Date(current_year, current_month - 1, 1);
    const currentEndDate = new Date(current_year, current_month, 0);

    // ข้อมูลเดือนเปรียบเทียบ
    const compareStartDate = new Date(adjustedCompareYear, compareMonth - 1, 1);
    const compareEndDate = new Date(adjustedCompareYear, compareMonth, 0);

    // ฟังก์ชันดึงข้อมูลการเงินสำหรับช่วงเวลาหนึ่ง
    const getFinancialDataForPeriod = async (startDate, endDate) => {
      const incomeData = await Income.aggregate([
        {
          $match: {
            income_date: { $gte: startDate, $lte: endDate },
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

      const expenseData = await Expense.aggregate([
        {
          $match: {
            expense_date: { $gte: startDate, $lte: endDate },
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

      const totalIncome = incomeData.reduce((sum, item) => sum + item.total, 0);
      const totalExpense = expenseData.reduce(
        (sum, item) => sum + item.total,
        0
      );
      const netProfit = totalIncome - totalExpense;

      return {
        total_income: totalIncome,
        total_expense: totalExpense,
        net_profit: netProfit,
        profit_margin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
        income_by_type: incomeData.reduce((acc, item) => {
          acc[item._id] = item.total;
          return acc;
        }, {}),
        expense_by_category: expenseData.reduce((acc, item) => {
          acc[item._id] = item.total;
          return acc;
        }, {}),
        income_transactions: incomeData.reduce(
          (sum, item) => sum + item.count,
          0
        ),
        expense_transactions: expenseData.reduce(
          (sum, item) => sum + item.count,
          0
        ),
      };
    };

    // ดึงข้อมูลทั้งสองเดือน
    const currentData = await getFinancialDataForPeriod(
      currentStartDate,
      currentEndDate
    );
    const compareData = await getFinancialDataForPeriod(
      compareStartDate,
      compareEndDate
    );

    // คำนวณการเปรียบเทียบ
    const comparison = {
      income_change: currentData.total_income - compareData.total_income,
      income_change_percent:
        compareData.total_income > 0
          ? (
              ((currentData.total_income - compareData.total_income) /
                compareData.total_income) *
              100
            ).toFixed(2)
          : 0,

      expense_change: currentData.total_expense - compareData.total_expense,
      expense_change_percent:
        compareData.total_expense > 0
          ? (
              ((currentData.total_expense - compareData.total_expense) /
                compareData.total_expense) *
              100
            ).toFixed(2)
          : 0,

      profit_change: currentData.net_profit - compareData.net_profit,
      profit_change_percent:
        compareData.net_profit !== 0
          ? (
              ((currentData.net_profit - compareData.net_profit) /
                Math.abs(compareData.net_profit)) *
              100
            ).toFixed(2)
          : 0,

      margin_change: currentData.profit_margin - compareData.profit_margin,

      transaction_change: {
        income:
          currentData.income_transactions - compareData.income_transactions,
        expense:
          currentData.expense_transactions - compareData.expense_transactions,
      },
    };

    // เปรียบเทียบรายรับตามประเภท
    const incomeTypeComparison = {};
    const allIncomeTypes = new Set([
      ...Object.keys(currentData.income_by_type),
      ...Object.keys(compareData.income_by_type),
    ]);

    allIncomeTypes.forEach((type) => {
      const currentAmount = currentData.income_by_type[type] || 0;
      const compareAmount = compareData.income_by_type[type] || 0;
      const change = currentAmount - compareAmount;
      const changePercent =
        compareAmount > 0 ? ((change / compareAmount) * 100).toFixed(2) : 0;

      incomeTypeComparison[type] = {
        current: currentAmount,
        compare: compareAmount,
        change: change,
        change_percent: parseFloat(changePercent),
      };
    });

    // เปรียบเทียบรายจ่ายตามหมวดหมู่
    const expenseCategoryComparison = {};
    const allExpenseCategories = new Set([
      ...Object.keys(currentData.expense_by_category),
      ...Object.keys(compareData.expense_by_category),
    ]);

    allExpenseCategories.forEach((category) => {
      const currentAmount = currentData.expense_by_category[category] || 0;
      const compareAmount = compareData.expense_by_category[category] || 0;
      const change = currentAmount - compareAmount;
      const changePercent =
        compareAmount > 0 ? ((change / compareAmount) * 100).toFixed(2) : 0;

      expenseCategoryComparison[category] = {
        current: currentAmount,
        compare: compareAmount,
        change: change,
        change_percent: parseFloat(changePercent),
      };
    });

    const monthNames = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    const report = {
      current_period: {
        year: parseInt(current_year),
        month: parseInt(current_month),
        month_name: monthNames[current_month - 1],
        data: {
          ...currentData,
          formatted_total_income: currentData.total_income.toLocaleString(
            "th-TH",
            {
              style: "currency",
              currency: "THB",
            }
          ),
          formatted_total_expense: currentData.total_expense.toLocaleString(
            "th-TH",
            {
              style: "currency",
              currency: "THB",
            }
          ),
          formatted_net_profit: currentData.net_profit.toLocaleString("th-TH", {
            style: "currency",
            currency: "THB",
          }),
        },
      },
      compare_period: {
        year: parseInt(adjustedCompareYear),
        month: parseInt(compareMonth),
        month_name: monthNames[compareMonth - 1],
        data: {
          ...compareData,
          formatted_total_income: compareData.total_income.toLocaleString(
            "th-TH",
            {
              style: "currency",
              currency: "THB",
            }
          ),
          formatted_total_expense: compareData.total_expense.toLocaleString(
            "th-TH",
            {
              style: "currency",
              currency: "THB",
            }
          ),
          formatted_net_profit: compareData.net_profit.toLocaleString("th-TH", {
            style: "currency",
            currency: "THB",
          }),
        },
      },
      comparison: {
        ...comparison,
        formatted_income_change: comparison.income_change.toLocaleString(
          "th-TH",
          {
            style: "currency",
            currency: "THB",
          }
        ),
        formatted_expense_change: comparison.expense_change.toLocaleString(
          "th-TH",
          {
            style: "currency",
            currency: "THB",
          }
        ),
        formatted_profit_change: comparison.profit_change.toLocaleString(
          "th-TH",
          {
            style: "currency",
            currency: "THB",
          }
        ),
      },
      detailed_comparison: {
        income_by_type: incomeTypeComparison,
        expense_by_category: expenseCategoryComparison,
      },
      generated_at: new Date(),
      generated_by: req.user.userId,
    };

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเปรียบเทียบข้อมูลการเงิน",
      error: error.message,
    });
  }
};

// F015: ส่งออกรายงานเป็นไฟล์ Excel
const exportFinancialReportToExcel = async (req, res) => {
  try {
    const { report_type, start_date, end_date, year, month } = req.query;

    if (!report_type) {
      return res.status(400).json({
        success: false,
        message:
          "กรุณาระบุประเภทรายงาน (profit_loss, cash_flow, monthly_summary, comparison)",
      });
    }

    const workbook = new ExcelJS.Workbook();

    // ตั้งค่าข้อมูลเมตา
    workbook.creator = "YOQA Financial System";
    workbook.created = new Date();
    workbook.modified = new Date();

    if (report_type === "profit_loss") {
      // สร้างรายงานกำไร-ขาดทุน
      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุวันที่เริ่มต้นและสิ้นสุดสำหรับรายงานกำไร-ขาดทุน",
        });
      }

      // ดึงข้อมูลรายงาน (ใช้ฟังก์ชันเดียวกับ API)
      const reportData = await generateProfitLossData(start_date, end_date);

      const worksheet = workbook.addWorksheet("รายงานกำไร-ขาดทุน");

      // หัวข้อรายงาน
      worksheet.mergeCells("A1:D1");
      worksheet.getCell("A1").value = "รายงานกำไร-ขาดทุน";
      worksheet.getCell("A1").font = { size: 16, bold: true };
      worksheet.getCell("A1").alignment = { horizontal: "center" };

      worksheet.mergeCells("A2:D2");
      worksheet.getCell(
        "A2"
      ).value = `ระหว่างวันที่ ${start_date} ถึง ${end_date}`;
      worksheet.getCell("A2").alignment = { horizontal: "center" };

      // ส่วนรายรับ
      worksheet.getCell("A4").value = "รายรับ";
      worksheet.getCell("A4").font = { bold: true };

      let row = 5;
      Object.entries(reportData.revenue.income_by_type).forEach(
        ([type, data]) => {
          worksheet.getCell(`A${row}`).value = `  ${type}`;
          worksheet.getCell(`B${row}`).value = data.amount;
          worksheet.getCell(`B${row}`).numFmt = "#,##0.00";
          row++;
        }
      );

      worksheet.getCell(`A${row}`).value = "รวมรายรับ";
      worksheet.getCell(`A${row}`).font = { bold: true };
      worksheet.getCell(`B${row}`).value = reportData.revenue.total_income;
      worksheet.getCell(`B${row}`).numFmt = "#,##0.00";
      worksheet.getCell(`B${row}`).font = { bold: true };

      row += 2;

      // ส่วนรายจ่าย
      worksheet.getCell(`A${row}`).value = "รายจ่าย";
      worksheet.getCell(`A${row}`).font = { bold: true };
      row++;

      Object.entries(reportData.expenses.expense_by_category).forEach(
        ([category, data]) => {
          worksheet.getCell(`A${row}`).value = `  ${category}`;
          worksheet.getCell(`B${row}`).value = data.amount;
          worksheet.getCell(`B${row}`).numFmt = "#,##0.00";
          row++;
        }
      );

      worksheet.getCell(`A${row}`).value = "รวมรายจ่าย";
      worksheet.getCell(`A${row}`).font = { bold: true };
      worksheet.getCell(`B${row}`).value = reportData.expenses.total_expense;
      worksheet.getCell(`B${row}`).numFmt = "#,##0.00";
      worksheet.getCell(`B${row}`).font = { bold: true };

      row += 2;

      // กำไร/ขาดทุน
      worksheet.getCell(`A${row}`).value = "กำไร/ขาดทุนสุทธิ";
      worksheet.getCell(`A${row}`).font = { bold: true };
      worksheet.getCell(`B${row}`).value = reportData.profit_loss.net_profit;
      worksheet.getCell(`B${row}`).numFmt = "#,##0.00";
      worksheet.getCell(`B${row}`).font = { bold: true };

      if (reportData.profit_loss.net_profit >= 0) {
        worksheet.getCell(`B${row}`).font = {
          ...worksheet.getCell(`B${row}`).font,
          color: { argb: "FF00B050" },
        };
      } else {
        worksheet.getCell(`B${row}`).font = {
          ...worksheet.getCell(`B${row}`).font,
          color: { argb: "FFFF0000" },
        };
      }

      // ปรับความกว้างคอลัมน์
      worksheet.getColumn("A").width = 30;
      worksheet.getColumn("B").width = 15;
    } else if (report_type === "monthly_summary") {
      // สร้างรายงานสรุปรายเดือน
      if (!year) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุปีสำหรับรายงานสรุปรายเดือน",
        });
      }

      // ดึงข้อมูลรายงาน
      const reportData = await getMonthlySummaryData(year);

      const worksheet = workbook.addWorksheet("สรุปรายเดือน");

      // หัวข้อ
      worksheet.mergeCells("A1:G1");
      worksheet.getCell("A1").value = `สรุปรายรับ-รายจ่ายประจำปี ${year}`;
      worksheet.getCell("A1").font = { size: 16, bold: true };
      worksheet.getCell("A1").alignment = { horizontal: "center" };

      // หัวตาราง
      const headers = [
        "เดือน",
        "รายรับ",
        "รายจ่าย",
        "กำไร/ขาดทุน",
        "อัตรากำไร (%)",
        "ธุรกรรมรายรับ",
        "ธุรกรรมรายจ่าย",
      ];
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(3, index + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2EFDA" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // ข้อมูลรายเดือน
      reportData.monthly_data.forEach((monthData, index) => {
        const row = index + 4;
        worksheet.getCell(row, 1).value = monthData.month_name;
        worksheet.getCell(row, 2).value = monthData.total_income;
        worksheet.getCell(row, 3).value = monthData.total_expense;
        worksheet.getCell(row, 4).value = monthData.net_profit;
        worksheet.getCell(row, 5).value = parseFloat(monthData.profit_margin);
        worksheet.getCell(row, 6).value = monthData.income_count;
        worksheet.getCell(row, 7).value = monthData.expense_count;

        // Format numbers
        [2, 3, 4].forEach((col) => {
          worksheet.getCell(row, col).numFmt = "#,##0.00";
        });
        worksheet.getCell(row, 5).numFmt = "0.00%";

        // Add borders
        for (let col = 1; col <= 7; col++) {
          worksheet.getCell(row, col).border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }

        // Color coding for profit/loss
        if (monthData.net_profit >= 0) {
          worksheet.getCell(row, 4).font = { color: { argb: "FF00B050" } };
        } else {
          worksheet.getCell(row, 4).font = { color: { argb: "FFFF0000" } };
        }
      });

      // รวมยอด
      const summaryRow = 16;
      worksheet.getCell(summaryRow, 1).value = "รวม";
      worksheet.getCell(summaryRow, 1).font = { bold: true };
      worksheet.getCell(summaryRow, 2).value =
        reportData.year_summary.total_income;
      worksheet.getCell(summaryRow, 3).value =
        reportData.year_summary.total_expense;
      worksheet.getCell(summaryRow, 4).value =
        reportData.year_summary.net_profit;
      worksheet.getCell(summaryRow, 5).value =
        parseFloat(reportData.year_summary.profit_margin) / 100;
      worksheet.getCell(summaryRow, 6).value =
        reportData.year_summary.total_income_transactions;
      worksheet.getCell(summaryRow, 7).value =
        reportData.year_summary.total_expense_transactions;

      // Format summary row
      [2, 3, 4].forEach((col) => {
        worksheet.getCell(summaryRow, col).numFmt = "#,##0.00";
        worksheet.getCell(summaryRow, col).font = { bold: true };
      });
      worksheet.getCell(summaryRow, 5).numFmt = "0.00%";
      worksheet.getCell(summaryRow, 5).font = { bold: true };

      for (let col = 1; col <= 7; col++) {
        worksheet.getCell(summaryRow, col).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFE599" },
        };
        worksheet.getCell(summaryRow, col).border = {
          top: { style: "thick" },
          left: { style: "thin" },
          bottom: { style: "thick" },
          right: { style: "thin" },
        };
      }

      // ปรับความกว้างคอลัมน์
      worksheet.getColumn(1).width = 15;
      [2, 3, 4].forEach((col) => {
        worksheet.getColumn(col).width = 15;
      });
      worksheet.getColumn(5).width = 12;
      [6, 7].forEach((col) => {
        worksheet.getColumn(col).width = 12;
      });
    }

    // สร้างชื่อไฟล์
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `financial-report-${report_type}-${timestamp}.xlsx`;

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการส่งออกรายงาน Excel",
      error: error.message,
    });
  }
};

// Helper functions สำหรับ Excel export
const generateProfitLossData = async (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const incomeData = await Income.aggregate([
    {
      $match: {
        income_date: { $gte: start, $lte: end },
        status: "confirmed",
      },
    },
    {
      $group: {
        _id: "$income_type",
        total_amount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const expenseData = await Expense.aggregate([
    {
      $match: {
        expense_date: { $gte: start, $lte: end },
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$category",
        total_amount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalIncome = incomeData.reduce(
    (sum, item) => sum + item.total_amount,
    0
  );
  const totalExpense = expenseData.reduce(
    (sum, item) => sum + item.total_amount,
    0
  );
  const netProfit = totalIncome - totalExpense;

  return {
    revenue: {
      total_income: totalIncome,
      income_by_type: incomeData.reduce((acc, item) => {
        acc[item._id] = { amount: item.total_amount, count: item.count };
        return acc;
      }, {}),
    },
    expenses: {
      total_expense: totalExpense,
      expense_by_category: expenseData.reduce((acc, item) => {
        acc[item._id] = { amount: item.total_amount, count: item.count };
        return acc;
      }, {}),
    },
    profit_loss: {
      net_profit: netProfit,
      profit_margin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
    },
  };
};

const getMonthlySummaryData = async (year) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const monthlyIncome = await Income.aggregate([
    {
      $match: {
        income_date: { $gte: startDate, $lte: endDate },
        status: "confirmed",
      },
    },
    {
      $group: {
        _id: { month: { $month: "$income_date" } },
        total_income: { $sum: "$amount" },
        income_count: { $sum: 1 },
      },
    },
  ]);

  const monthlyExpense = await Expense.aggregate([
    {
      $match: {
        expense_date: { $gte: startDate, $lte: endDate },
        status: "approved",
      },
    },
    {
      $group: {
        _id: { month: { $month: "$expense_date" } },
        total_expense: { $sum: "$amount" },
        expense_count: { $sum: 1 },
      },
    },
  ]);

  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const monthlyData = [];
  for (let month = 1; month <= 12; month++) {
    const incomeData = monthlyIncome.find((item) => item._id.month === month);
    const expenseData = monthlyExpense.find((item) => item._id.month === month);

    const totalIncome = incomeData ? incomeData.total_income : 0;
    const totalExpense = expenseData ? expenseData.total_expense : 0;
    const netProfit = totalIncome - totalExpense;

    monthlyData.push({
      month: month,
      month_name: monthNames[month - 1],
      total_income: totalIncome,
      total_expense: totalExpense,
      net_profit: netProfit,
      profit_margin:
        totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : "0.00",
      income_count: incomeData ? incomeData.income_count : 0,
      expense_count: expenseData ? expenseData.expense_count : 0,
    });
  }

  const yearSummary = {
    total_income: monthlyData.reduce(
      (sum, month) => sum + month.total_income,
      0
    ),
    total_expense: monthlyData.reduce(
      (sum, month) => sum + month.total_expense,
      0
    ),
    net_profit: monthlyData.reduce((sum, month) => sum + month.net_profit, 0),
    total_income_transactions: monthlyData.reduce(
      (sum, month) => sum + month.income_count,
      0
    ),
    total_expense_transactions: monthlyData.reduce(
      (sum, month) => sum + month.expense_count,
      0
    ),
  };

  yearSummary.profit_margin =
    yearSummary.total_income > 0
      ? ((yearSummary.net_profit / yearSummary.total_income) * 100).toFixed(2)
      : "0.00";

  return {
    monthly_data: monthlyData,
    year_summary: yearSummary,
  };
};

module.exports = {
  generateProfitLossReport,
  generateCashFlowReport,
  getMonthlySummary,
  getFinancialComparison,
  exportFinancialReportToExcel,
};

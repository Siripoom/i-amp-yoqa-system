const mongoose = require('mongoose');
const Income = require('./models/income');
const Expense = require('./models/expense');

// เชื่อมต่อ MongoDB
mongoose.connect('mongodb://localhost:27017/i-amp-yoqa', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const debugFinancialData = async () => {
  try {
    console.log('🔍 Debugging Financial Data...\n');

    // ตรวจสอบจำนวนข้อมูลทั้งหมด
    const totalIncome = await Income.countDocuments();
    const totalExpense = await Expense.countDocuments();

    console.log(`📊 Total Income Records: ${totalIncome}`);
    console.log(`📊 Total Expense Records: ${totalExpense}\n`);

    // ตรวจสอบข้อมูลรายรับ
    console.log('💰 Income Data:');
    const incomes = await Income.find().limit(5).sort({ createdAt: -1 });
    incomes.forEach((income, index) => {
      console.log(`  ${index + 1}. Amount: ${income.amount}, Type: ${income.income_type}, Status: ${income.status}, Date: ${income.income_date}`);
    });

    // ตรวจสอบสถานะรายรับ
    const incomeByStatus = await Income.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);
    console.log('\n📈 Income by Status:');
    incomeByStatus.forEach(item => {
      console.log(`  ${item._id}: ${item.count} records, Total: ${item.total}`);
    });

    // ตรวจสอบข้อมูลรายจ่าย
    console.log('\n💸 Expense Data:');
    const expenses = await Expense.find().limit(5).sort({ createdAt: -1 });
    expenses.forEach((expense, index) => {
      console.log(`  ${index + 1}. Amount: ${expense.amount}, Category: ${expense.category}, Status: ${expense.status}, Date: ${expense.expense_date}`);
    });

    // ตรวจสอบสถานะรายจ่าย
    const expenseByStatus = await Expense.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);
    console.log('\n📉 Expense by Status:');
    expenseByStatus.forEach(item => {
      console.log(`  ${item._id}: ${item.count} records, Total: ${item.total}`);
    });

    // ทดสอบ query สำหรับรายงาน (เดือนปัจจุบัน)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log(`\n📅 Testing queries for current month (${startOfMonth.toISOString().split('T')[0]} to ${endOfMonth.toISOString().split('T')[0]}):`);

    // Test รายรับที่ confirmed
    const confirmedIncomes = await Income.find({
      income_date: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'confirmed'
    });
    console.log(`  ✅ Confirmed incomes this month: ${confirmedIncomes.length} records`);

    // Test รายจ่ายที่ approved  
    const approvedExpenses = await Expense.find({
      expense_date: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'approved'
    });
    console.log(`  ✅ Approved expenses this month: ${approvedExpenses.length} records`);

    // ทดสอบช่วงเวลาที่กว้างขึ้น (ทั้งปี)
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    console.log(`\n📅 Testing queries for current year (${startOfYear.toISOString().split('T')[0]} to ${endOfYear.toISOString().split('T')[0]}):`);

    const yearIncomes = await Income.find({
      income_date: { $gte: startOfYear, $lte: endOfYear },
      status: 'confirmed'
    });
    console.log(`  ✅ Confirmed incomes this year: ${yearIncomes.length} records`);

    const yearExpenses = await Expense.find({
      expense_date: { $gte: startOfYear, $lte: endOfYear },
      status: 'approved'
    });
    console.log(`  ✅ Approved expenses this year: ${yearExpenses.length} records`);

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
  }
};

debugFinancialData();

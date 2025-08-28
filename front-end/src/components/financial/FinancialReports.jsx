import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Download, TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

const FinancialReports = () => {
  const [activeTab, setActiveTab] = useState('profit-loss');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [yearMonth, setYearMonth] = useState({
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString()
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    if (activeTab) {
      fetchReportData();
    }
  }, [activeTab, dateRange, yearMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let url = '';
      let params = new URLSearchParams();

      switch (activeTab) {
        case 'profit-loss':
          url = '/api/financial-reports/profit-loss';
          params.append('start_date', dateRange.start_date);
          params.append('end_date', dateRange.end_date);
          break;
        case 'cash-flow':
          url = '/api/financial-reports/cash-flow';
          params.append('start_date', dateRange.start_date);
          params.append('end_date', dateRange.end_date);
          params.append('period_type', 'daily');
          break;
        case 'monthly-summary':
          url = '/api/financial-reports/monthly-summary';
          params.append('year', yearMonth.year);
          break;
        case 'comparison':
          url = '/api/financial-reports/comparison';
          params.append('current_year', yearMonth.year);
          params.append('current_month', yearMonth.month);
          break;
        default:
          return;
      }

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data.data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      let params = new URLSearchParams();
      params.append('report_type', activeTab.replace('-', '_'));

      if (activeTab === 'profit-loss' || activeTab === 'cash-flow') {
        params.append('start_date', dateRange.start_date);
        params.append('end_date', dateRange.end_date);
      } else if (activeTab === 'monthly-summary') {
        params.append('year', yearMonth.year);
      }

      const response = await fetch(`/api/financial-reports/export/excel?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${activeTab}-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const renderProfitLossReport = () => {
    if (!reportData) return null;

    const incomeData = Object.entries(reportData.revenue.income_by_type).map(([type, data]) => ({
      name: type,
      value: data.amount,
      percentage: data.percentage
    }));

    const expenseData = Object.entries(reportData.expenses.expense_by_category).map(([category, data]) => ({
      name: category,
      value: data.amount,
      percentage: data.percentage
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">รายรับรวม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reportData.revenue.formatted_total_income}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">รายจ่ายรวม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {reportData.expenses.formatted_total_expense}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">กำไร/ขาดทุนสุทธิ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${reportData.profit_loss.is_profitable ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.profit_loss.formatted_net_profit}
              </div>
              <div className="text-sm text-gray-600">
                อัตรากำไร: {reportData.profit_loss.profit_margin.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>การแบ่งรายรับตามประเภท</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>การแบ่งรายจ่ายตามหมวดหมู่</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderCashFlowReport = () => {
    if (!reportData) return null;

    const chartData = reportData.cash_flow_data.map(item => ({
      period: item.period_label,
      inflow: item.cash_inflow,
      outflow: item.cash_outflow,
      net: item.net_cash_flow,
      balance: item.running_balance
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">เงินเข้ารวม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reportData.summary.formatted_total_inflow}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">เงินออกรวม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {reportData.summary.formatted_total_outflow}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">กระแสเงินสดสุทธิ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${reportData.summary.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.summary.formatted_net_cash_flow}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ยอดคงเหลือสุดท้าย</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${reportData.summary.final_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.summary.formatted_final_balance}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>กระแสเงินสดรายวัน</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="inflow" stroke="#00C49F" name="เงินเข้า" />
                <Line type="monotone" dataKey="outflow" stroke="#FF8042" name="เงินออก" />
                <Line type="monotone" dataKey="balance" stroke="#8884d8" name="ยอดคงเหลือ" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMonthlySummary = () => {
    if (!reportData) return null;

    const chartData = reportData.monthly_data.map(item => ({
      month: item.month_name,
      income: item.total_income,
      expense: item.total_expense,
      profit: item.net_profit
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">รายรับรวมทั้งปี</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reportData.year_summary.formatted_total_income}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">รายจ่ายรวมทั้งปี</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {reportData.year_summary.formatted_total_expense}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">กำไร/ขาดทุนทั้งปี</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${reportData.year_summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.year_summary.formatted_net_profit}
              </div>
              <div className="text-sm text-gray-600">
                อัตรากำไร: {reportData.year_summary.profit_margin}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ธุรกรรมทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reportData.year_summary.total_income_transactions + reportData.year_summary.total_expense_transactions}
              </div>
              <div className="text-xs text-gray-600">
                รายรับ: {reportData.year_summary.total_income_transactions} | รายจ่าย: {reportData.year_summary.total_expense_transactions}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>สรุปรายเดือน</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="#00C49F" name="รายรับ" />
                <Bar dataKey="expense" fill="#FF8042" name="รายจ่าย" />
                <Bar dataKey="profit" fill="#8884d8" name="กำไร/ขาดทุน" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดรายเดือน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">เดือน</th>
                    <th className="text-right p-2">รายรับ</th>
                    <th className="text-right p-2">รายจ่าย</th>
                    <th className="text-right p-2">กำไร/ขาดทุน</th>
                    <th className="text-right p-2">อัตรากำไร</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.monthly_data.map((month) => (
                    <tr key={month.month} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{month.month_name}</td>
                      <td className="p-2 text-right text-green-600">{month.formatted_total_income}</td>
                      <td className="p-2 text-right text-red-600">{month.formatted_total_expense}</td>
                      <td className={`p-2 text-right font-semibold ${month.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {month.formatted_net_profit}
                      </td>
                      <td className="p-2 text-right">{month.profit_margin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderComparison = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {reportData.current_period.month_name} {reportData.current_period.year} (เดือนปัจจุบัน)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>รายรับ:</span>
                <span className="font-semibold text-green-600">{reportData.current_period.data.formatted_total_income}</span>
              </div>
              <div className="flex justify-between">
                <span>รายจ่าย:</span>
                <span className="font-semibold text-red-600">{reportData.current_period.data.formatted_total_expense}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>กำไร/ขาดทุน:</span>
                <span className={`font-bold ${reportData.current_period.data.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.current_period.data.formatted_net_profit}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {reportData.compare_period.month_name} {reportData.compare_period.year} (เดือนที่เปรียบเทียบ)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>รายรับ:</span>
                <span className="font-semibold text-green-600">{reportData.compare_period.data.formatted_total_income}</span>
              </div>
              <div className="flex justify-between">
                <span>รายจ่าย:</span>
                <span className="font-semibold text-red-600">{reportData.compare_period.data.formatted_total_expense}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>กำไร/ขาดทุน:</span>
                <span className={`font-bold ${reportData.compare_period.data.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.compare_period.data.formatted_net_profit}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>การเปรียบเทียบ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getTrendIcon(reportData.comparison.income_change_percent)}
                  <span className="text-sm font-medium">การเปลี่ยนแปลงรายรับ</span>
                </div>
                <div className={`text-lg font-bold ${getTrendColor(reportData.comparison.income_change)}`}>
                  {reportData.comparison.formatted_income_change}
                </div>
                <div className={`text-sm ${getTrendColor(reportData.comparison.income_change_percent)}`}>
                  {reportData.comparison.income_change_percent > 0 ? '+' : ''}{reportData.comparison.income_change_percent}%
                </div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getTrendIcon(reportData.comparison.expense_change_percent)}
                  <span className="text-sm font-medium">การเปลี่ยนแปลงรายจ่าย</span>
                </div>
                <div className={`text-lg font-bold ${getTrendColor(reportData.comparison.expense_change)}`}>
                  {reportData.comparison.formatted_expense_change}
                </div>
                <div className={`text-sm ${getTrendColor(reportData.comparison.expense_change_percent)}`}>
                  {reportData.comparison.expense_change_percent > 0 ? '+' : ''}{reportData.comparison.expense_change_percent}%
                </div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getTrendIcon(reportData.comparison.profit_change_percent)}
                  <span className="text-sm font-medium">การเปลี่ยนแปลงกำไร</span>
                </div>
                <div className={`text-lg font-bold ${getTrendColor(reportData.comparison.profit_change)}`}>
                  {reportData.comparison.formatted_profit_change}
                </div>
                <div className={`text-sm ${getTrendColor(reportData.comparison.profit_change_percent)}`}>
                  {reportData.comparison.profit_change_percent > 0 ? '+' : ''}{reportData.comparison.profit_change_percent}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const tabs = [
    { id: 'profit-loss', label: 'กำไร-ขาดทุน', icon: BarChart3 },
    { id: 'cash-flow', label: 'กระแสเงินสด', icon: TrendingUp },
    { id: 'monthly-summary', label: 'สรุปรายเดือน', icon: Calendar },
    { id: 'comparison', label: 'เปรียบเทียบ', icon: TrendingDown }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">รายงานการเงิน</h1>
        <Button onClick={exportToExcel} disabled={loading || !reportData}>
          <Download className="h-4 w-4 mr-2" />
          ส่งออก Excel
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          {(activeTab === 'profit-loss' || activeTab === 'cash-flow') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">วันที่เริ่มต้น</label>
                <Input
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด</label>
                <Input
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                />
              </div>
            </div>
          )}

          {(activeTab === 'monthly-summary' || activeTab === 'comparison') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ปี</label>
                <Select value={yearMonth.year} onValueChange={(value) => setYearMonth({ ...yearMonth, year: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {activeTab === 'comparison' && (
                <div>
                  <label className="block text-sm font-medium mb-1">เดือน</label>
                  <Select value={yearMonth.month} onValueChange={(value) => setYearMonth({ ...yearMonth, month: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          เดือน {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">กำลังโหลดรายงาน...</div>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeTab === 'profit-loss' && renderProfitLossReport()}
          {activeTab === 'cash-flow' && renderCashFlowReport()}
          {activeTab === 'monthly-summary' && renderMonthlySummary()}
          {activeTab === 'comparison' && renderComparison()}
        </>
      )}
    </div>
  );
};

export default FinancialReports;

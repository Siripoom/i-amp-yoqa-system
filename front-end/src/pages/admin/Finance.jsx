import { useState, useEffect } from 'react';
import {
  Layout,
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  DatePicker,
  Select,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Upload,
  Tag,
  Space,
  Tooltip,
  Popconfirm,
  Alert,
  Spin
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  CheckOutlined,
  CloseOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import ReceiptManagement from '../../components/ReceiptManagement';
import financeService from '../../services/financeService';
import '../../styles/Dashboard.css';

const { Sider, Content } = Layout;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;


const Finance = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('income'); // Changed from 'dashboard' to 'income'
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);

  // Income data
  const [incomes, setIncomes] = useState([]);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [incomePagination, setIncomePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Expense data
  const [expenses, setExpenses] = useState([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [expensePagination, setExpensePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Financial reports data
  const [profitLossData, setProfitLossData] = useState(null);

  // Modal states
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  // Forms
  const [incomeForm] = Form.useForm();
  const [expenseForm] = Form.useForm();

  // User role for permissions
  const userRole = localStorage.getItem('role');
  const canEdit = userRole === 'SuperAdmin' || userRole === 'Admin';
  const canApprove = userRole === 'SuperAdmin' || userRole === 'Admin';

  const incomeTypes = [
    { value: 'package', label: 'แพ็คเกจ' },
    { value: 'product', label: 'ผลิตภัณฑ์' },
    { value: 'goods', label: 'สินค้า' },
    { value: 'session', label: 'เซสชัน' },
    { value: 'manual', label: 'บันทึกด้วยตนเอง' }
  ];

  const expenseCategories = [
    { value: 'rent', label: 'ค่าเช่า' },
    { value: 'salary', label: 'เงินเดือน' },
    { value: 'equipment', label: 'อุปกรณ์' },
    { value: 'utilities', label: 'ค่าสาธารณูปโภค' },
    { value: 'marketing', label: 'การตลาด' },
    { value: 'supplies', label: 'วัสดุสิ้นเปลือง' },
    { value: 'maintenance', label: 'ค่าบำรุงรักษา' },
    { value: 'training', label: 'ค่าฝึกอบรม' },
    { value: 'insurance', label: 'ค่าประกัน' },
    { value: 'transportation', label: 'ค่าเดินทาง' },
    { value: 'other', label: 'อื่นๆ' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'เงินสด' },
    { value: 'transfer', label: 'โอนเงิน' },
    { value: 'qr_code', label: 'QR Code' },
    { value: 'credit_card', label: 'บัตรเครดิต' },
    { value: 'check', label: 'เช็ค' },
    { value: 'other', label: 'อื่นๆ' }
  ];

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (activeTab === 'income') {
      fetchIncomes();
    } else if (activeTab === 'expense') {
      fetchExpenses();
    } else if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // ฟังก์ชัน handleSubmit สำหรับรายรับ (Income)
  const handleIncomeSubmit = async (values) => {
    try {
      if (editingIncome) {
        // โหมดแก้ไข: เรียกใช้ service update
        const response = await financeService.updateIncome(editingIncome._id, values);
        if (response.success) {
          message.success("อัปเดตรายรับเรียบร้อยแล้ว");
        }
      } else {
        // โหมดสร้างใหม่: เรียกใช้ service create
        const response = await financeService.createManualIncome(values);
        if (response.success) {
          message.success("เพิ่มรายรับเรียบร้อยแล้ว");
        }
      }
      setIncomeModalVisible(false);
      incomeForm.resetFields();
      setEditingIncome(null);
      fetchIncomes(); // ดึงข้อมูลใหม่
    } catch (error) {
      console.error("Error submitting income:", error);
      const errorMessage = error?.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      message.error(errorMessage);
    }
  };

  const handleDownloadReceipt = async (record) => {
    if (!record.receipt_url) {
      message.error("ไม่มีใบเสร็จสำหรับรายการนี้");
      return;
    }
    try {
      message.loading({ content: 'กำลังดาวน์โหลด...', key: 'download' });

      // 1. เรียก service เพื่อเอาข้อมูลไฟล์ (blob)
      const blob = await financeService.downloadReceipt(record._id);

      // 2. สร้าง URL ชั่วคราวจาก blob
      const url = window.URL.createObjectURL(new Blob([blob]));

      // 3. สร้าง element <a> ที่มองไม่เห็นขึ้นมา
      const link = document.createElement('a');
      link.href = url;

      // 4. ตั้งชื่อไฟล์ที่จะดาวน์โหลด (ดึงจาก record หรือตั้งชื่อ default)
      const fileName = record.receipt_filename || `receipt-${record._id}.pdf`;
      link.setAttribute('download', fileName);

      // 5. เพิ่ม element นี้เข้าไปในหน้าเว็บ
      document.body.appendChild(link);

      // 6. "คลิก" ที่ link นี้โดยอัตโนมัติเพื่อเริ่มการดาวน์โหลด
      link.click();

      // 7. ลบ element และ URL ชั่วคราวทิ้งไปหลังจากดาวน์โหลดเสร็จ
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: 'ดาวน์โหลดสำเร็จ!', key: 'download', duration: 2 });

    } catch (error) {
      console.error("Error downloading receipt:", error);
      message.error({ content: 'ดาวน์โหลดล้มเหลว!', key: 'download', duration: 2 });
    }
  };

  const handleExpenseSubmit = async (values) => {
    try {
      // 1. สร้าง FormData object ขึ้นมาใหม่
      const formData = new FormData();

      // 2. วนลูปเพื่อใส่ข้อมูลทั้งหมดจาก Form ลงใน FormData
      for (const key in values) {
        if (key === 'receipt') {
          // 3. จัดการข้อมูลไฟล์เป็นพิเศษ
          // ตรวจสอบว่ามีไฟล์อัปโหลดมาจริง และเป็น fileList
          if (values.receipt && values.receipt.length > 0) {
            // ดึงไฟล์จริงๆ ออกมาจาก antd upload component
            const file = values.receipt[0].originFileObj;
            formData.append('receipt', file);
          }
        } else if (key === 'expense_date') {
          // 4. จัดการข้อมูลวันที่ (dayjs object)
          // แปลงเป็น ISO String เพื่อให้ Backend จัดการง่าย
          if (values.expense_date) {
            formData.append(key, values.expense_date.toISOString());
          }
        } else if (values[key] !== undefined && values[key] !== null) {
          // 5. ใส่ข้อมูลอื่นๆ ที่เหลือลงไป
          formData.append(key, values[key]);
        }
      }

      // 6. เรียกใช้ service โดยส่ง formData ที่สร้างเสร็จแล้วไป
      if (editingExpense) {
        // โหมดแก้ไข
        const response = await financeService.updateExpense(editingExpense._id, formData);
        if (response.success) {
          message.success("อัปเดตรายจ่ายเรียบร้อยแล้ว");
        }
      } else {
        // โหมดสร้างใหม่
        const response = await financeService.createExpense(formData);
        if (response.success) {
          message.success("เพิ่มรายจ่ายเรียบร้อยแล้ว");
        }
      }

      // 7. ปิด Modal, รีเซ็ตฟอร์ม, และดึงข้อมูลใหม่ (เหมือนเดิม)
      setExpenseModalVisible(false);
      expenseForm.resetFields();
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error("Error submitting expense:", error);
      const errorMessage = error?.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      message.error(errorMessage);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const [profitLoss] = await Promise.all([
        financeService.getProfitLossReport(startDate, endDate)
      ]);

      setProfitLossData(profitLoss.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomes = async () => {
    setIncomeLoading(true);
    try {
      const params = {
        page: incomePagination.current,
        limit: incomePagination.pageSize,
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD')
      };

      const response = await financeService.getAllIncome(params);

      if (response.success) {
        setIncomes(response.data.incomes || []);
        setIncomeTotal(response.data.summary?.total_amount || 0);
        setIncomePagination(prev => ({
          ...prev,
          total: response.data.pagination?.total_records || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching incomes:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลรายรับ');
    } finally {
      setIncomeLoading(false);
    }
  };

  const fetchExpenses = async () => {
    setExpenseLoading(true);
    try {
      const params = {
        page: expensePagination.current,
        limit: expensePagination.pageSize,
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD')
      };

      const response = await financeService.getAllExpenses(params);

      if (response.success) {
        setExpenses(response.data.expenses || []);
        setExpenseTotal(response.data.summary?.total_amount || 0);
        setExpensePagination(prev => ({
          ...prev,
          total: response.data.pagination?.total_records || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลรายจ่าย');
    } finally {
      setExpenseLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Reports functionality removed - will be handled in reports tab if needed

    } catch (error) {
      console.error('Error fetching reports:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncome = async (values) => {
    try {
      const response = await financeService.createManualIncome(values);
      if (response.success) {
        message.success('เพิ่มรายรับเรียบร้อยแล้ว');
        setIncomeModalVisible(false);
        incomeForm.resetFields();
        fetchIncomes();
        if (activeTab === 'dashboard') fetchDashboardData();
      }
    } catch (error) {
      console.error('Error creating income:', error);
      message.error('เกิดข้อผิดพลาดในการเพิ่มรายรับ');
    }
  };

  const handleCreateExpense = async (values) => {
    try {
      const response = await financeService.createExpense(values);
      if (response.success) {
        message.success('เพิ่มรายจ่ายเรียบร้อยแล้ว');
        setExpenseModalVisible(false);
        expenseForm.resetFields();
        fetchExpenses();
        if (activeTab === 'dashboard') fetchDashboardData();
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      message.error('เกิดข้อผิดพลาดในการเพิ่มรายจ่าย');
    }
  };

  const handleDeleteIncome = async (id) => {
    try {
      const response = await financeService.deleteIncome(id);
      if (response.success) {
        message.success('ลบรายรับเรียบร้อยแล้ว');
        fetchIncomes();
        if (activeTab === 'dashboard') fetchDashboardData();
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      message.error('เกิดข้อผิดพลาดในการลบรายรับ');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const response = await financeService.deleteExpense(id);
      if (response.success) {
        message.success('ลบรายจ่ายเรียบร้อยแล้ว');
        fetchExpenses();
        if (activeTab === 'dashboard') fetchDashboardData();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      message.error('เกิดข้อผิดพลาดในการลบรายจ่าย');
    }
  };

  const handleApproveExpense = async (id) => {
    try {
      const response = await financeService.approveExpense(id);
      if (response.success) {
        message.success('อนุมัติรายจ่ายเรียบร้อยแล้ว');
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error approving expense:', error);
      message.error('เกิดข้อผิดพลาดในการอนุมัติรายจ่าย');
    }
  };

  const handleRejectExpense = async (id) => {
    try {
      const response = await financeService.rejectExpense(id);
      if (response.success) {
        message.success('ปฏิเสธรายจ่ายเรียบร้อยแล้ว');
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error rejecting expense:', error);
      message.error('เกิดข้อผิดพลาดในการปฏิเสธรายจ่าย');
    }
  };

  const exportToExcel = async (reportType) => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const blob = await financeService.exportFinancialReportToExcel(reportType, startDate, endDate);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${startDate}_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success('ส่งออกรายงานเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error exporting report:', error);
      message.error('เกิดข้อผิดพลาดในการส่งออกรายงาน');
    }
  };

  const incomeColumns = [
    {
      title: 'วันที่',
      dataIndex: 'income_date',
      key: 'income_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.income_date).diff(dayjs(b.income_date))
    },
    {
      title: 'รายละเอียด',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'ประเภท',
      dataIndex: 'income_type',
      key: 'income_type',
      render: (type) => {
        const typeObj = incomeTypes.find(t => t.value === type);
        return <Tag color="blue">{typeObj?.label || type}</Tag>;
      }
    },
    {
      title: 'จำนวนเงิน',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <span className="font-bold text-green-600">฿{amount?.toLocaleString()}</span>,
      align: 'right'
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          confirmed: { color: 'green', text: 'ยืนยันแล้ว' },
          pending: { color: 'orange', text: 'รอดำเนินการ' },
          cancelled: { color: 'red', text: 'ยกเลิก' }
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: 'การดำเนินการ',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="ดูรายละเอียด">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                Modal.info({
                  title: 'รายละเอียดรายรับ',
                  width: 600,
                  content: (
                    <div className="space-y-4">
                      <div><strong>วันที่:</strong> {dayjs(record.income_date).format('DD/MM/YYYY')}</div>
                      <div><strong>รายละเอียด:</strong> {record.description}</div>
                      <div><strong>จำนวนเงิน:</strong> ฿{record.amount?.toLocaleString()}</div>
                      <div><strong>ประเภท:</strong> {incomeTypes.find(t => t.value === record.income_type)?.label}</div>
                      <div><strong>วิธีการชำระ:</strong> {paymentMethods.find(m => m.value === record.payment_method)?.label}</div>
                      {record.notes && <div><strong>หมายเหตุ:</strong> {record.notes}</div>}
                    </div>
                  )
                });
              }}
            />
          </Tooltip>
          {canEdit && (
            <>
              <Tooltip title="แก้ไข">
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => {
                    setEditingIncome(record);
                    incomeForm.setFieldsValue({
                      ...record,
                      income_date: dayjs(record.income_date)
                    });
                    setIncomeModalVisible(true);
                  }}
                />
              </Tooltip>
              <Popconfirm
                title="คุณแน่ใจหรือไม่ที่จะลบรายรับนี้?"
                onConfirm={() => handleDeleteIncome(record._id)}
                okText="ลบ"
                cancelText="ยกเลิก"
              >
                <Tooltip title="ลบ">
                  <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  const expenseColumns = [
    {
      title: 'วันที่',
      dataIndex: 'expense_date',
      key: 'expense_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.expense_date).diff(dayjs(b.expense_date))
    },
    {
      title: 'รายละเอียด',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'หมวดหมู่',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        const categoryObj = expenseCategories.find(c => c.value === category);
        return <Tag color="orange">{categoryObj?.label || category}</Tag>;
      }
    },
    {
      title: 'จำนวนเงิน',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <span className="font-bold text-red-600">฿{amount?.toLocaleString()}</span>,
      align: 'right'
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          approved: { color: 'green', text: 'อนุมัติแล้ว' },
          pending: { color: 'orange', text: 'รอการอนุมัติ' },
          rejected: { color: 'red', text: 'ปฏิเสธ' }
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      }
    },
    {
      title: 'การดำเนินการ',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="ดูรายละเอียด">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                Modal.info({
                  title: 'รายละเอียดรายจ่าย',
                  width: 600,
                  content: (
                    <div className="space-y-4">
                      <div><strong>วันที่:</strong> {dayjs(record.expense_date).format('DD/MM/YYYY')}</div>
                      <div><strong>รายละเอียด:</strong> {record.description}</div>
                      <div><strong>จำนวนเงิน:</strong> ฿{record.amount?.toLocaleString()}</div>
                      <div><strong>หมวดหมู่:</strong> {expenseCategories.find(c => c.value === record.category)?.label}</div>
                      <div><strong>ผู้จำหน่าย:</strong> {record.vendor || '-'}</div>
                      <div><strong>วิธีการชำระ:</strong> {paymentMethods.find(m => m.value === record.payment_method)?.label}</div>
                      {record.receipt_number && <div><strong>เลขที่ใบเสร็จ:</strong> {record.receipt_number}</div>}
                      {record.notes && <div><strong>หมายเหตุ:</strong> {record.notes}</div>}
                    </div>
                  )
                });
              }}
            />
          </Tooltip>
          {canApprove && record.status === 'pending' && (
            <>
              <Tooltip title="อนุมัติ">
                <Button
                  icon={<CheckOutlined />}
                  size="small"
                  type="primary"
                  onClick={() => handleApproveExpense(record._id)}
                />
              </Tooltip>
              <Tooltip title="ปฏิเสธ">
                <Button
                  icon={<CloseOutlined />}
                  size="small"
                  danger
                  onClick={() => handleRejectExpense(record._id)}
                />
              </Tooltip>
            </>
          )}
          {canEdit && (
            <>
              <Tooltip title="แก้ไข">
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => {
                    setEditingExpense(record);
                    expenseForm.setFieldsValue({
                      ...record,
                      expense_date: dayjs(record.expense_date)
                    });
                    setExpenseModalVisible(true);
                  }}
                />
              </Tooltip>
              <Popconfirm
                title="คุณแน่ใจหรือไม่ที่จะลบรายจ่ายนี้?"
                onConfirm={() => handleDeleteExpense(record._id)}
                okText="ลบ"
                cancelText="ยกเลิก"
              >
                <Tooltip title="ลบ">
                  <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  const renderIncomeTab = () => (
    <div className="space-y-4">
      <Card>
        <Row justify="space-between" align="middle" className="mb-4">
          <Col>
            <Statistic
              title="รายรับรวม"
              value={incomeTotal}
              precision={2}
              prefix="฿"
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col>
            <Space>
              {canEdit && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingIncome(null);
                    incomeForm.resetFields();
                    setIncomeModalVisible(true);
                  }}
                >
                  เพิ่มรายรับ
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        <Table
          columns={incomeColumns}
          dataSource={incomes}
          loading={incomeLoading}
          rowKey="_id"
          pagination={{
            ...incomePagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`
          }}
          onChange={(pagination) => {
            setIncomePagination(pagination);
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );

  const renderExpenseTab = () => (
    <div className="space-y-4">
      <Card>
        <Row justify="space-between" align="middle" className="mb-4">
          <Col>
            <Statistic
              title="รายจ่ายรวม"
              value={expenseTotal}
              precision={2}
              prefix="฿"
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col>
            <Space>
              {canEdit && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingExpense(null);
                    expenseForm.resetFields();
                    setExpenseModalVisible(true);
                  }}
                >
                  เพิ่มรายจ่าย
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        <Table
          columns={expenseColumns}
          dataSource={expenses}
          loading={expenseLoading}
          rowKey="_id"
          pagination={{
            ...expensePagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`
          }}
          onChange={(pagination) => {
            setExpensePagination(pagination);
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <Card title="รายงานการเงิน">
        <Space wrap className="mb-4">
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => exportToExcel('profit-loss')}
          >
            ส่งออกรายงานกำไร-ขาดทุน
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => exportToExcel('cash-flow')}
          >
            ส่งออกรายงานกระแสเงินสด
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => exportToExcel('monthly-summary')}
          >
            ส่งออกสรุปรายเดือน
          </Button>
        </Space>

        {profitLossData && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">รายงานกำไร-ขาดทุน</h3>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="รายรับรวม"
                    value={profitLossData.total_income || 0}
                    precision={2}
                    prefix="฿"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="รายจ่ายรวม"
                    value={profitLossData.total_expense || 0}
                    precision={2}
                    prefix="฿"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="กำไรสุทธิ"
                    value={profitLossData.net_profit || 0}
                    precision={2}
                    prefix="฿"
                    valueStyle={{
                      color: (profitLossData.net_profit || 0) >= 0 ? '#3f8600' : '#cf1322'
                    }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Finance Management" />

        <Content className="p-6">
          {userRole === "Accounting" && (
            <Alert
              message={`สิทธิ์การใช้งาน: ${userRole}`}
              description="คุณสามารถดูข้อมูลการเงินได้ แต่ไม่สามารถแก้ไขหรือเพิ่มข้อมูลได้"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Date Range Filter */}
          <Card className="mb-6">
            <Row align="middle" gutter={16}>
              <Col>
                <span className="font-medium">ช่วงเวลา:</span>
              </Col>
              <Col>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
          </Card>

          {/* Main Content */}
          <Spin spinning={loading}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="large"
            >
              <TabPane tab="รายรับ" key="income">
                {renderIncomeTab()}
              </TabPane>
              <TabPane tab="รายจ่าย" key="expense">
                {renderExpenseTab()}
              </TabPane>
              <TabPane tab="รายงาน" key="reports">
                {renderReportsTab()}
              </TabPane>
              <TabPane tab="ใบเสร็จ" key="receipts">
                <ReceiptManagement />
              </TabPane>
            </Tabs>
          </Spin>

          {/* Income Modal */}
          <Modal
            title={editingIncome ? "แก้ไขรายรับ" : "เพิ่มรายรับ"}
            open={incomeModalVisible}
            onCancel={() => {
              setIncomeModalVisible(false);
              setEditingIncome(null);
              incomeForm.resetFields();
            }}
            footer={null}
            width={600}
          >
            <Form
              form={incomeForm}
              layout="vertical"
              onFinish={handleIncomeSubmit}
              initialValues={{
                income_date: dayjs(),
                income_type: 'manual',
                payment_method: 'transfer',
                status: 'confirmed'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="income_date"
                    label="วันที่"
                    rules={[{ required: true, message: 'กรุณาเลือกวันที่' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="amount"
                    label="จำนวนเงิน"
                    rules={[{ required: true, message: 'กรุณาใส่จำนวนเงิน' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      formatter={value => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/฿\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="รายละเอียด"
                rules={[{ required: true, message: 'กรุณาใส่รายละเอียด' }]}
              >
                <Input />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="income_type"
                    label="ประเภทรายรับ"
                    rules={[{ required: true, message: 'กรุณาเลือกประเภทรายรับ' }]}
                  >
                    <Select>
                      {incomeTypes.map(type => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="payment_method"
                    label="วิธีการชำระ"
                    rules={[{ required: true, message: 'กรุณาเลือกวิธีการชำระ' }]}
                  >
                    <Select>
                      {paymentMethods.map(method => (
                        <Option key={method.value} value={method.value}>
                          {method.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="reference_number" label="เลขที่อ้างอิง">
                <Input />
              </Form.Item>

              <Form.Item name="notes" label="หมายเหตุ">
                <TextArea rows={3} />
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="flex justify-end space-x-2">
                  <Button onClick={() => setIncomeModalVisible(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="primary" htmlType="submit">
                    {editingIncome ? "อัปเดต" : "เพิ่ม"}รายรับ
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Modal>

          {/* Expense Modal */}
          <Modal
            title={editingExpense ? "แก้ไขรายจ่าย" : "เพิ่มรายจ่าย"}
            open={expenseModalVisible}
            onCancel={() => {
              setExpenseModalVisible(false);
              setEditingExpense(null);
              expenseForm.resetFields();
            }}
            footer={null}
            width={600}
          >
            <Form
              form={expenseForm}
              layout="vertical"
              onFinish={handleExpenseSubmit}
              initialValues={{
                expense_date: dayjs(),
                category: 'other',
                payment_method: 'transfer',
                status: 'pending'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="expense_date"
                    label="วันที่"
                    rules={[{ required: true, message: 'กรุณาเลือกวันที่' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="amount"
                    label="จำนวนเงิน"
                    rules={[{ required: true, message: 'กรุณาใส่จำนวนเงิน' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      formatter={value => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/฿\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="รายละเอียด"
                rules={[{ required: true, message: 'กรุณาใส่รายละเอียด' }]}
              >
                <Input />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="หมวดหมู่"
                    rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}
                  >
                    <Select>
                      {expenseCategories.map(category => (
                        <Option key={category.value} value={category.value}>
                          {category.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="payment_method"
                    label="วิธีการชำระ"
                    rules={[{ required: true, message: 'กรุณาเลือกวิธีการชำระ' }]}
                  >
                    <Select>
                      {paymentMethods.map(method => (
                        <Option key={method.value} value={method.value}>
                          {method.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="vendor" label="ผู้จำหน่าย">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="receipt_number" label="เลขที่ใบเสร็จ">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="receipt" label="อัปโหลดใบเสร็จ">
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                  accept="image/*,.pdf"
                >
                  <Button icon={<UploadOutlined />}>เลือกไฟล์</Button>
                </Upload>
              </Form.Item>

              <Form.Item name="notes" label="หมายเหตุ">
                <TextArea rows={3} />
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="flex justify-end space-x-2">
                  <Button onClick={() => setExpenseModalVisible(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="primary" htmlType="submit">
                    {editingExpense ? "อัปเดต" : "เพิ่ม"}รายจ่าย
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Finance;

import { useState } from 'react';
import {
  Card,
  Button,
  message,
  Row,
  Col,
  Divider,
  Typography,
  Space,
  Tag,
  Alert
} from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  SendOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import financeService from '../services/financeService';
import receiptService from '../services/receiptService';

const { Title, Text } = Typography;

const TestFinancePage = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  // Add test result
  const addTestResult = (testName, message, success, data) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      testName,
      message,
      success,
      data,
      timestamp: new Date().toLocaleString()
    }]);
  };

  // Test Income API
  const testIncomeAPI = async () => {
    setLoading(true);
    try {
      // Test manual income creation
      const incomeData = {
        amount: 1500,
        description: 'ทดสอบรายรับ - Manual Test',
        income_type: 'manual',
        income_date: new Date().toISOString(),
        payment_method: 'transfer',
        notes: 'ทดสอบระบบรายรับ'
      };

      const result = await financeService.createManualIncome(incomeData);
      
      addTestResult('Income API', 'สร้างรายรับสำเร็จ', true, result);
      message.success('ทดสอบ Income API สำเร็จ');
    } catch (error) {
      addTestResult('Income API', error.message, false, error);
      message.error('ทดสอบ Income API ล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  // Test Expense API
  const testExpenseAPI = async () => {
    setLoading(true);
    try {
      const expenseData = {
        amount: 800,
        description: 'ทดสอบรายจ่าย - Test Expense',
        category: 'supplies',
        expense_date: new Date().toISOString(),
        vendor: 'ร้านทดสอบ',
        payment_method: 'cash',
        notes: 'ทดสอบระบบรายจ่าย'
      };

      const result = await financeService.createExpense(expenseData);
      
      addTestResult('Expense API', 'สร้างรายจ่ายสำเร็จ', true, result);
      message.success('ทดสอบ Expense API สำเร็จ');
    } catch (error) {
      addTestResult('Expense API', error.message, false, error);
      message.error('ทดสอบ Expense API ล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  // Test Receipt API
  const testReceiptAPI = async () => {
    setLoading(true);
    try {
      const receiptData = {
        orderId: '507f1f77bcf86cd799439011', // Mock Order ID
        customerName: 'ลูกค้าทดสอบ',
        customerPhone: '0812345678',
        customerAddress: '123 ถนนทดสอบ กรุงเทพฯ',
        companyInfo: {
          name: 'YOQA Studio Test',
          address: '123 Test Street, Bangkok',
          phone: '02-123-4567'
        },
        items: [
          {
            name: 'แพ็คเกจทดสอบ',
            quantity: 1,
            price: 2000
          }
        ],
        totalAmount: 2000,
        template: 'default'
      };

      const result = await receiptService.createReceipt(receiptData);
      
      addTestResult('Receipt API', `สร้างใบเสร็จสำเร็จ: ${result.receiptNumber}`, true, result);
      message.success('ทดสอบ Receipt API สำเร็จ');
    } catch (error) {
      addTestResult('Receipt API', error.message, false, error);
      message.error('ทดสอบ Receipt API ล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  // Test Financial Reports
  const testFinancialReports = async () => {
    setLoading(true);
    try {
      const endDate = dayjs().format('YYYY-MM-DD');
      const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

      // Test Profit & Loss Report
      const profitLossResult = await financeService.getProfitLossReport(startDate, endDate);
      
      // Test Monthly Summary
      const monthlySummary = await financeService.getMonthlySummary(2025, 8);
      
      addTestResult('Financial Reports', 'ดึงรายงานการเงินสำเร็จ', true, {
        profitLoss: profitLossResult,
        monthly: monthlySummary
      });
      message.success('ทดสอบ Financial Reports สำเร็จ');
    } catch (error) {
      addTestResult('Financial Reports', error.message, false, error);
      message.error('ทดสอบ Financial Reports ล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setTestResults([]);
    await testIncomeAPI();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testExpenseAPI();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testReceiptAPI();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testFinancialReports();
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
      <Card>
        <Title level={2}>
          <Space>
            <FileTextOutlined />
            ทดสอบระบบการเงินและใบเสร็จ
          </Space>
        </Title>
        
        <Alert
          message="หน้าทดสอบระบบ"
          description="ใช้สำหรับทดสอบการทำงานของ API ระบบการเงินและการออกใบเสร็จ"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={testIncomeAPI}
              loading={loading}
              block
            >
              ทดสอบ Income API
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={testExpenseAPI}
              loading={loading}
              block
            >
              ทดสอบ Expense API
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={testReceiptAPI}
              loading={loading}
              block
            >
              ทดสอบ Receipt API
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={testFinancialReports}
              loading={loading}
              block
            >
              ทดสอบ Reports API
            </Button>
          </Col>
        </Row>

        <Divider />

        <Row>
          <Col span={24}>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={runAllTests}
              loading={loading}
              style={{ width: '100%', marginBottom: 16 }}
            >
              รันการทดสอบทั้งหมด
            </Button>
          </Col>
        </Row>

        <Divider>ผลการทดสอบ</Divider>

        {testResults.length > 0 && (
          <div>
            {testResults.map((result) => (
              <Card
                key={result.id}
                size="small"
                style={{ marginBottom: 8 }}
                bodyStyle={{ padding: '12px 16px' }}
              >
                <Row justify="space-between" align="middle">
                  <Col>
                    <Space>
                      <Tag color={result.success ? 'green' : 'red'}>
                        {result.success ? 'สำเร็จ' : 'ล้มเหลว'}
                      </Tag>
                      <Text strong>{result.testName}</Text>
                    </Space>
                  </Col>
                  <Col>
                    <Text type="secondary">{result.timestamp}</Text>
                  </Col>
                </Row>
                <div style={{ marginTop: 8 }}>
                  <Text>{result.message}</Text>
                </div>
                {result.data && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                      ดูรายละเอียด
                    </summary>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '8px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      marginTop: '8px',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TestFinancePage;

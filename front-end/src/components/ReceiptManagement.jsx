import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  DatePicker,
  Input,
  message,
  Modal,
  Row,
  Col,
  Space,
  Tooltip,
  Divider,
  Typography,
  QRCode,
  Empty
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import receiptService from '../services/receiptService';

const { RangePicker } = DatePicker;
const { Search } = Input;
const { Title, Text } = Typography;

const ReceiptManagement = () => {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [receiptNumberSearch, setReceiptNumberSearch] = useState('');

  useEffect(() => {
    loadAllReceipts();
  }, []);

  // โหลดใบเสร็จทั้งหมด
  const loadAllReceipts = async () => {
    setLoading(true);
    try {
      console.log('📋 Loading all receipts...');

      const data = await receiptService.getAllReceipts();

      console.log('📊 Received receipts:', data.length);

      setReceipts(data);
      setFilteredReceipts(data);
    } catch (error) {
      message.error('ไม่สามารถโหลดข้อมูลใบเสร็จได้');
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาใบเสร็จด้วยเลขที่
  const searchByReceiptNumber = async (receiptNumber) => {
    if (!receiptNumber.trim()) {
      setFilteredReceipts(receipts);
      return;
    }

    setLoading(true);
    try {
      const data = await receiptService.getReceiptByNumber(receiptNumber);
      setFilteredReceipts([data]);
    } catch {
      message.error('ไม่พบใบเสร็จที่ค้นหา');
      setFilteredReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาใบเสร็จด้วยชื่อลูกค้า
  const searchByCustomerName = async (customerName) => {
    if (!customerName.trim()) {
      setFilteredReceipts(receipts);
      return;
    }

    setLoading(true);
    try {
      const data = await receiptService.getReceiptsByCustomer(customerName);
      setFilteredReceipts(data);
    } catch {
      message.error('ไม่พบใบเสร็จของลูกค้าที่ค้นหา');
      setFilteredReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาใบเสร็จด้วยช่วงวันที่
  const searchByDateRange = async (dates) => {
    if (!dates || dates.length !== 2) {
      loadAllReceipts();
      return;
    }

    setLoading(true);
    try {
      const startDate = dates[0].format('YYYY-MM-DD');
      const endDate = dates[1].format('YYYY-MM-DD');

      const data = await receiptService.getReceiptsByDateRange(startDate, endDate);
      setFilteredReceipts(data);
    } catch (error) {
      message.error('ไม่สามารถค้นหาข้อมูลในช่วงวันที่ได้');
      console.error('Error searching by date range:', error);
    } finally {
      setLoading(false);
    }
  };

  // แสดงรายละเอียดใบเสร็จ
  const showReceiptDetail = (receipt) => {
    setSelectedReceipt(receipt);
    setIsDetailModalVisible(true);
  };



  // ดาวน์โหลดใบเสร็จ DOCX
  const downloadReceiptDOCX = async (receiptId, receiptNumber) => {
    try {
      setLoading(true);
      const blob = await receiptService.downloadReceiptDOCX(receiptId);

      // ตรวจสอบ blob
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid response format');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receiptNumber}.docx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('ดาวน์โหลด DOCX สำเร็จ');
    } catch (error) {
      console.error('Error downloading receipt DOCX:', error);
      message.error(error.message || 'ไม่สามารถดาวน์โหลด DOCX ได้');
    } finally {
      setLoading(false);
    }
  };

  // ดาวน์โหลดใบเสร็จ PDF (จาก DOCX template)
  const downloadReceiptPDF = async (receiptId, receiptNumber) => {
    try {
      setLoading(true);
      const blob = await receiptService.downloadReceiptPDF(receiptId);

      // ตรวจสอบ blob
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid response format');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receiptNumber}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('ดาวน์โหลด PDF สำเร็จ');
    } catch (error) {
      console.error('Error downloading receipt PDF:', error);
      message.error(error.message || 'ไม่สามารถดาวน์โหลด PDF ได้');
    } finally {
      setLoading(false);
    }
  };

  // พิมพ์ใบเสร็จ
  const printReceipt = async (receiptId) => {
    try {
      await receiptService.printReceipt(receiptId);
      message.success('ส่งคำสั่งพิมพ์ใบเสร็จแล้ว');
    } catch (error) {
      message.error('ไม่สามารถพิมพ์ใบเสร็จได้');
      console.error('Error printing receipt:', error);
    }
  };

  const columns = [
    {
      title: 'เลขที่ใบเสร็จ',
      dataIndex: 'receiptNumber',
      key: 'receiptNumber',
      render: (text) => (
        <Text strong style={{ color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'ชื่อลูกค้า',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: 'เบอร์โทร',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
    },
    {
      title: 'ยอดรวม',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          ฿{amount?.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'วันที่สร้าง',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {dayjs(date).format('DD/MM/YYYY HH:mm')}
        </Space>
      ),
    },
    {
      title: 'การจัดการ',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => showReceiptDetail(record)}
            />
          </Tooltip>
          <Tooltip title="ดาวน์โหลด PDF">
            <Button
              type="link"
              icon={<FilePdfOutlined />}
              onClick={() => downloadReceiptPDF(record._id, record.receiptNumber)}
            />
          </Tooltip>
          {/* <Tooltip title="ดาวน์โหลด DOCX">
            <Button
              type="link"
              icon={<FileWordOutlined />}
              onClick={() => downloadReceiptDOCX(record._id, record.receiptNumber)}
            />
          </Tooltip> */}
          <Tooltip title="พิมพ์ใบเสร็จ">
            <Button
              type="link"
              icon={<PrinterOutlined />}
              onClick={() => printReceipt(record._id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title={
        <Space>
          <FileTextOutlined />
          <span>จัดการใบเสร็จ</span>
        </Space>
      } extra={
        <Button
          type="primary"
          onClick={loadAllReceipts}
          loading={loading}
        >
          รีเฟรชข้อมูล
        </Button>
      }>
        {/* ส่วนการค้นหา */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="ค้นหาด้วยเลขที่ใบเสร็จ"
              value={receiptNumberSearch}
              onChange={(e) => setReceiptNumberSearch(e.target.value)}
              onSearch={searchByReceiptNumber}
              enterButton={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="ค้นหาด้วยชื่อลูกค้า"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onSearch={searchByCustomerName}
              enterButton={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              placeholder={['วันที่เริ่มต้น', 'วันที่สิ้นสุด']}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates);
                searchByDateRange(dates);
              }}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>

        {/* ปุ่มล้างการค้นหา */}
        <Row style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Button
                onClick={() => {
                  setReceiptNumberSearch('');
                  setCustomerSearch('');
                  setDateRange([]);
                  setFilteredReceipts(receipts);
                }}
              >
                ล้างการค้นหา
              </Button>
              <Text type="secondary">
                แสดง {filteredReceipts.length} จาก {receipts.length} รายการ
              </Text>
            </Space>
          </Col>
        </Row>

        <Divider />

        {/* ตารางแสดงข้อมูลใบเสร็จ */}
        <Table
          columns={columns}
          dataSource={filteredReceipts}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: filteredReceipts.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} จาก ${total} รายการ`,
          }}
          locale={{
            emptyText: <Empty description="ไม่พบข้อมูลใบเสร็จ" />,
          }}
        />
      </Card>

      {/* Modal แสดงรายละเอียดใบเสร็จ */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>รายละเอียดใบเสร็จ</span>
          </Space>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            ปิด
          </Button>,
          <Button
            key="download-pdf"
            icon={<FilePdfOutlined />}
            onClick={() => downloadReceiptPDF(selectedReceipt?._id, selectedReceipt?.receiptNumber)}
          >
            ดาวน์โหลด PDF
          </Button>,
          // <Button
          //   key="download-docx"
          //   icon={<FileWordOutlined />}
          //   onClick={() => downloadReceiptDOCX(selectedReceipt?._id, selectedReceipt?.receiptNumber)}
          // >
          //   ดาวน์โหลด DOCX
          // </Button>,
          <Button
            key="print"
            icon={<PrinterOutlined />}
            onClick={() => printReceipt(selectedReceipt?._id)}
          >
            พิมพ์
          </Button>,
        ]}
        width={800}
      >
        {selectedReceipt && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="ข้อมูลใบเสร็จ">
                  <p><strong>เลขที่ใบเสร็จ:</strong> {selectedReceipt.receiptNumber}</p>
                  <p><strong>วันที่สร้าง:</strong> {dayjs(selectedReceipt.createdAt).format('DD/MM/YYYY HH:mm')}</p>
                  <p><strong>Order ID:</strong> {selectedReceipt.orderId}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="ข้อมูลลูกค้า">
                  <p><strong>ชื่อ:</strong> {selectedReceipt.customerName}</p>
                  <p><strong>เบอร์โทร:</strong> {selectedReceipt.customerPhone || 'ไม่ระบุ'}</p>
                  <p><strong>ที่อยู่:</strong> {selectedReceipt.customerAddress || 'ไม่ระบุ'}</p>
                </Card>
              </Col>
            </Row>

            {selectedReceipt.companyInfo && (
              <Card size="small" title="ข้อมูลบริษัท" style={{ marginTop: 16 }}>
                <p><strong>ชื่อบริษัท:</strong> {selectedReceipt.companyInfo.name}</p>
                <p><strong>ที่อยู่:</strong> {selectedReceipt.companyInfo.address}</p>
                <p><strong>เบอร์โทร:</strong> {selectedReceipt.companyInfo.phone}</p>
              </Card>
            )}

            <Card size="small" title="รายการสินค้า" style={{ marginTop: 16 }}>
              <Table
                size="small"
                columns={[
                  { title: 'ชื่อสินค้า', dataIndex: 'name', key: 'name' },
                  { title: 'จำนวน', dataIndex: 'quantity', key: 'quantity' },
                  {
                    title: 'ราคา',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price) => `฿${price?.toLocaleString()}`
                  },
                ]}
                dataSource={selectedReceipt.items}
                pagination={false}
                rowKey={(record, index) => index}
              />
              <Divider />
              <div style={{ textAlign: 'right' }}>
                <Title level={4} style={{ color: '#52c41a' }}>
                  ยอดรวม: ฿{selectedReceipt.totalAmount?.toLocaleString()}
                </Title>
              </div>
            </Card>

            {selectedReceipt.qrCode && (
              <Card size="small" title="QR Code สำหรับตรวจสอบ" style={{ marginTop: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <QRCode value={selectedReceipt.qrCode} size={150} />
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceiptManagement;

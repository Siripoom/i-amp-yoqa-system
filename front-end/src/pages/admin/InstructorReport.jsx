import { useEffect, useState } from "react";
import {
  Layout,
  Table,
  Input,
  Button,
  Card,
  Spin,
  Typography,
  Badge,
  Space,
  Drawer,
  Tag,
  Statistic,
  Divider,
  Row,
  Col,
  List,
  Alert,
  Empty,
  DatePicker,
  Select,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/User.css";
import { MasterReport } from "../../services/reportService";
import moment from "moment";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const InstructorReport = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [allClassesOfInstructor, setAllClassesOfInstructor] = useState([]);

  useEffect(() => {
    fetchInstructorReport();
  }, []);

  // เมื่อข้อมูล instructor เปลี่ยนหรือมีการเลือกเดือน ให้กรองข้อมูลใหม่
  useEffect(() => {
    if (selectedInstructor) {
      setAllClassesOfInstructor(selectedInstructor.classes);
      filterClassesByMonth(selectedInstructor.classes, selectedMonth);
    }
  }, [selectedInstructor, selectedMonth]);

  const fetchInstructorReport = async () => {
    setLoading(true);
    try {
      const response = await MasterReport.getMasterReport();
      if (response.success && response.data) {
        setInstructors(response.data);
      } else {
        setError("ไม่สามารถโหลดข้อมูลรายงานผู้สอนได้");
      }
    } catch (err) {
      setError(
        "เกิดข้อผิดพลาดในการโหลดข้อมูล: " + (err.message || "Unknown error")
      );
      console.error("Error fetching instructor report:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructorDetail = async (instructorName) => {
    setDetailLoading(true);
    try {
      const response = await MasterReport.getMasterReportByName(instructorName);
      if (response.success && response.data) {
        setSelectedInstructor(response.data);
        setFilteredClasses(response.data.classes);
        setAllClassesOfInstructor(response.data.classes);
      } else {
        setSelectedInstructor(null);
        setFilteredClasses([]);
        setAllClassesOfInstructor([]);
      }
    } catch (err) {
      console.error("Error fetching instructor detail:", err);
      setSelectedInstructor(null);
      setFilteredClasses([]);
      setAllClassesOfInstructor([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetail = (record) => {
    setSelectedMonth(null); // รีเซ็ตการเลือกเดือนเมื่อดูผู้สอนคนใหม่
    fetchInstructorDetail(record.name);
    setDrawerVisible(true);
  };

  const formatDate = (dateString) => {
    return moment(dateString).format("DD/MM/YYYY");
  };

  const formatTime = (dateString) => {
    return moment(dateString).format("HH:mm");
  };

  // ฟังก์ชันกรองคลาสตามเดือนที่เลือก
  const filterClassesByMonth = (classes, monthDate) => {
    if (!monthDate) {
      setFilteredClasses(classes); // แสดงทั้งหมดถ้าไม่มีการเลือกเดือน
      return;
    }

    const selectedMonthYear = moment(monthDate).format("MM/YYYY");

    const filtered = classes.filter((classItem) => {
      const classDate = moment(classItem.date);
      const classMonthYear = classDate.format("MM/YYYY");
      return classMonthYear === selectedMonthYear;
    });

    setFilteredClasses(filtered);
  };

  // ฟังก์ชันจัดการการเลือกเดือน
  const handleMonthChange = (date) => {
    setSelectedMonth(date);
  };

  // ฟังก์ชันรีเซ็ตตัวกรองเดือน
  const resetMonthFilter = () => {
    setSelectedMonth(null);
    setFilteredClasses(allClassesOfInstructor);
  };

  // สร้างรายการเดือนให้เลือกจากข้อมูลที่มี
  const getAvailableMonths = () => {
    if (!allClassesOfInstructor || allClassesOfInstructor.length === 0) {
      return [];
    }

    const monthsSet = new Set();

    allClassesOfInstructor.forEach((classItem) => {
      const monthYear = moment(classItem.date).format("MM/YYYY");
      monthsSet.add(monthYear);
    });

    return Array.from(monthsSet).sort((a, b) => {
      return moment(a, "MM/YYYY").diff(moment(b, "MM/YYYY"));
    });
  };

  const columns = [
    {
      title: "ชื่อผู้สอน",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span>
          <UserOutlined style={{ marginRight: 8 }} />
          {text}
        </span>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        return record.name.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: "จำนวนคลาส",
      dataIndex: "totalClasses",
      key: "totalClasses",
      sorter: (a, b) => a.totalClasses - b.totalClasses,
      render: (text) => (
        <Badge
          count={text}
          showZero
          style={{
            backgroundColor: text > 0 ? "#52c41a" : "#d9d9d9",
            fontWeight: "bold",
          }}
        />
      ),
    },
    {
      title: "จำนวนผู้เรียนทั้งหมด",
      dataIndex: "totalStudents",
      key: "totalStudents",
      sorter: (a, b) => a.totalStudents - b.totalStudents,
      render: (text) => (
        <span>
          <TeamOutlined style={{ marginRight: 8 }} />
          {text} คน
        </span>
      ),
    },
    {
      title: "ดูรายละเอียด",
      key: "action",
      render: (_, record) => (
        <Button type="primary" onClick={() => handleViewDetail(record)}>
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  const filteredData = searchText
    ? instructors.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : instructors;

  // คำนวณยอดรวมผู้เรียนสำหรับคลาสที่กรองตามเดือน
  const calculateTotalStudentsForFilteredClasses = () => {
    if (!filteredClasses || filteredClasses.length === 0) return 0;
    return filteredClasses.reduce(
      (total, item) => total + (item.studentCount || 0),
      0
    );
  };

  // จัดเตรียมเดือนที่มีในรายการคลาส
  const availableMonths = getAvailableMonths();

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="รายงานผู้สอน" />

        <Content className="user-container">
          <Card
            title={
              <Space direction="vertical" style={{ width: "100%" }}>
                <Title level={4}>รายงานสรุปผู้สอนทั้งหมด</Title>
                <Text type="secondary">
                  แสดงข้อมูลสรุปของผู้สอนทั้งหมดในระบบ พร้อมจำนวนคลาสและผู้เรียน
                </Text>
              </Space>
            }
            extra={
              <Input
                placeholder="ค้นหาตามชื่อผู้สอน"
                prefix={<SearchOutlined />}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
            }
          >
            {error ? (
              <Alert
                message="เกิดข้อผิดพลาด"
                description={error}
                type="error"
                showIcon
              />
            ) : loading ? (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>กำลังโหลดข้อมูล...</div>
              </div>
            ) : filteredData.length === 0 ? (
              <Empty description="ไม่พบข้อมูลผู้สอน" />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="name"
                pagination={{
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} จาก ${total} รายการ`,
                }}
              />
            )}
          </Card>

          <Drawer
            title={
              <Space>
                <UserOutlined />
                <span>{selectedInstructor?.name}</span>
              </Space>
            }
            placement="right"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            width={700}
            extra={
              <Space>
                <Select
                  placeholder="เลือกเดือน"
                  style={{ width: 200 }}
                  onChange={(value) =>
                    handleMonthChange(value ? moment(value, "MM/YYYY") : null)
                  }
                  value={
                    selectedMonth
                      ? moment(selectedMonth).format("MM/YYYY")
                      : undefined
                  }
                  allowClear
                  suffixIcon={<CalendarOutlined />}
                >
                  {availableMonths.map((month) => (
                    <Option key={month} value={month}>
                      {moment(month, "MM/YYYY").format("MMMM YYYY")}
                    </Option>
                  ))}
                </Select>
                <Button
                  onClick={resetMonthFilter}
                  disabled={!selectedMonth}
                  type="default"
                >
                  รีเซ็ตตัวกรอง
                </Button>
              </Space>
            }
            footer={
              <div style={{ textAlign: "right" }}>
                <Button onClick={() => setDrawerVisible(false)}>ปิด</Button>
              </div>
            }
          >
            {detailLoading ? (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>กำลังโหลดข้อมูล...</div>
              </div>
            ) : !selectedInstructor ? (
              <Empty description="ไม่พบข้อมูลผู้สอน" />
            ) : (
              <>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic
                      title="จำนวนคลาสที่สอน"
                      value={
                        selectedMonth
                          ? filteredClasses.length
                          : selectedInstructor.totalClasses
                      }
                      prefix={<BookOutlined />}
                      suffix="คลาส"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="จำนวนผู้เรียนทั้งหมด"
                      value={
                        selectedMonth
                          ? calculateTotalStudentsForFilteredClasses()
                          : selectedInstructor.totalStudents
                      }
                      prefix={<TeamOutlined />}
                      suffix="คน"
                    />
                  </Col>
                  <Col span={8}>
                    {selectedMonth && (
                      <Statistic
                        title="เดือนที่แสดง"
                        value={moment(selectedMonth).format("MMMM YYYY")}
                        prefix={<CalendarOutlined />}
                      />
                    )}
                  </Col>
                </Row>

                <Divider orientation="left">
                  รายการคลาสที่สอน
                  {selectedMonth && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {`กรองเดือน: ${moment(selectedMonth).format(
                        "MMMM YYYY"
                      )}`}
                    </Tag>
                  )}
                </Divider>

                {filteredClasses.length === 0 ? (
                  <Empty
                    description={
                      selectedMonth
                        ? `ไม่พบคลาสในเดือน ${moment(selectedMonth).format(
                            "MMMM YYYY"
                          )}`
                        : "ไม่พบข้อมูลคลาส"
                    }
                  />
                ) : (
                  <List
                    itemLayout="vertical"
                    dataSource={filteredClasses}
                    renderItem={(item) => (
                      <List.Item>
                        <Card style={{ width: "100%" }}>
                          <div style={{ marginBottom: 8 }}>
                            <Tag color="blue">
                              <BookOutlined /> {item.title}
                            </Tag>
                          </div>

                          <Row gutter={[16, 16]}>
                            <Col span={12}>
                              <Text strong>
                                <CalendarOutlined /> วันที่:
                              </Text>{" "}
                              {formatDate(item.date)}
                            </Col>
                            <Col span={12}>
                              <Text strong>
                                <ClockCircleOutlined /> เวลา:
                              </Text>{" "}
                              {formatTime(item.startTime)} -{" "}
                              {formatTime(item.endTime)}
                            </Col>
                          </Row>

                          <Row gutter={[16, 16]}>
                            <Col span={12}>
                              <Text strong>
                                <TeamOutlined /> จำนวนผู้เรียน:
                              </Text>{" "}
                              {item.studentCount} คน
                            </Col>
                            <Col span={12}>
                              <Text strong>
                                <EnvironmentOutlined /> ห้องเรียน:
                              </Text>{" "}
                              {item.roomNumber}
                            </Col>
                          </Row>
                        </Card>
                      </List.Item>
                    )}
                  />
                )}
              </>
            )}
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default InstructorReport;

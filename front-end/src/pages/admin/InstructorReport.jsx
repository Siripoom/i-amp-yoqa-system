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
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/User.css";
import { MasterReport } from "../../services/reportService";
import moment from "moment";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const InstructorReport = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchInstructorReport();
  }, []);

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
      } else {
        setSelectedInstructor(null);
      }
    } catch (err) {
      console.error("Error fetching instructor detail:", err);
      setSelectedInstructor(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetail = (record) => {
    fetchInstructorDetail(record.name);
    setDrawerVisible(true);
  };

  const formatDate = (dateString) => {
    return moment(dateString).format("DD/MM/YYYY");
  };

  const formatTime = (dateString) => {
    return moment(dateString).format("HH:mm");
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
            visible={drawerVisible}
            width={700}
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
                  <Col span={12}>
                    <Statistic
                      title="จำนวนคลาสที่สอน"
                      value={selectedInstructor.totalClasses}
                      prefix={<BookOutlined />}
                      suffix="คลาส"
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="จำนวนผู้เรียนทั้งหมด"
                      value={selectedInstructor.totalStudents}
                      prefix={<TeamOutlined />}
                      suffix="คน"
                    />
                  </Col>
                </Row>

                <Divider orientation="left">รายการคลาสที่สอน</Divider>

                <List
                  itemLayout="vertical"
                  dataSource={selectedInstructor.classes}
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
              </>
            )}
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default InstructorReport;

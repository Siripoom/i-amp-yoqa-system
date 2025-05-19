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
  message,
  Popconfirm,
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
  DownloadOutlined,
  FileExcelOutlined,
  DeleteOutlined,
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
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Function to delete instructor report
  const handleDeleteInstructor = async (instructorName) => {
    setDeleteLoading(true);
    try {
      const response = await MasterReport.deleteMasterReport(instructorName);
      if (response.success) {
        message.success(`ลบข้อมูลผู้สอน ${instructorName} สำเร็จ`);
        fetchInstructorReport(); // Refresh the list
        if (selectedInstructor && selectedInstructor.name === instructorName) {
          setDrawerVisible(false); // Close drawer if currently viewing the deleted instructor
        }
      } else {
        message.error(response.message || "ไม่สามารถลบข้อมูลผู้สอนได้");
      }
    } catch (err) {
      console.error("Error deleting instructor:", err);
      message.error(
        "เกิดข้อผิดพลาดในการลบข้อมูลผู้สอน: " + (err.message || "Unknown error")
      );
    } finally {
      setDeleteLoading(false);
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

  // ฟังก์ชันสำหรับส่งออกข้อมูลเป็นไฟล์ CSV
  const exportToCSV = (data, filename) => {
    // กรณีไม่มีข้อมูล
    if (!data || data.length === 0) {
      message.error("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }

    // สร้างหัวข้อคอลัมน์ CSV
    let csvContent = "ชื่อผู้สอน,จำนวนคลาส,จำนวนผู้เรียนทั้งหมด\n";

    // เพิ่มข้อมูลแต่ละแถว
    data.forEach((instructor) => {
      // แทนที่ comma ใน string ด้วย semicolon เพื่อป้องกันปัญหา CSV format
      const sanitizedName = instructor.name.replace(/,/g, ";");
      csvContent += `${sanitizedName},${instructor.totalClasses},${instructor.totalStudents}\n`;
    });

    // สร้าง blob สำหรับไฟล์ CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // สร้าง URL สำหรับดาวน์โหลด
    const url = window.URL.createObjectURL(blob);

    // สร้าง element a สำหรับดาวน์โหลด
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename || "instructor_report.csv");
    document.body.appendChild(link);

    // คลิกลิงก์เพื่อดาวน์โหลด
    link.click();

    // ลบลิงก์ออกจาก DOM
    document.body.removeChild(link);

    // แสดงข้อความสำเร็จ
    message.success("ส่งออกข้อมูลเรียบร้อยแล้ว");
  };

  // ฟังก์ชันสำหรับส่งออกข้อมูลรายละเอียดของผู้สอนรายบุคคล
  const exportInstructorDetailToCSV = (instructor, filename) => {
    if (!instructor || !instructor.classes || instructor.classes.length === 0) {
      message.error("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }

    // ใช้ filtered classes ถ้ามีการกรองตามเดือน
    const classesToExport =
      filteredClasses.length > 0 ? filteredClasses : instructor.classes;

    // สร้างหัวข้อคอลัมน์ CSV
    let csvContent =
      "ชื่อผู้สอน,ชื่อคลาส,วันที่,เวลาเริ่ม,เวลาสิ้นสุด,จำนวนผู้เรียน,ห้องเรียน\n";

    // เพิ่มข้อมูลแต่ละคลาส
    classesToExport.forEach((classItem) => {
      const sanitizedName = instructor.name.replace(/,/g, ";");
      const sanitizedTitle = classItem.title.replace(/,/g, ";");
      const date = moment(classItem.date).format("YYYY-MM-DD");
      const startTime = moment(classItem.startTime).format("HH:mm");
      const endTime = moment(classItem.endTime).format("HH:mm");
      const roomNumber = classItem.roomNumber
        ? classItem.roomNumber.replace(/,/g, ";")
        : "N/A";

      csvContent += `${sanitizedName},${sanitizedTitle},${date},${startTime},${endTime},${classItem.studentCount},${roomNumber}\n`;
    });

    // สร้าง blob สำหรับไฟล์ CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // สร้าง URL สำหรับดาวน์โหลด
    const url = window.URL.createObjectURL(blob);

    // สร้าง element a สำหรับดาวน์โหลด
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      filename ||
        `instructor_detail_${instructor.name.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);

    // คลิกลิงก์เพื่อดาวน์โหลด
    link.click();

    // ลบลิงก์ออกจาก DOM
    document.body.removeChild(link);

    // แสดงข้อความสำเร็จ
    message.success(`ส่งออกข้อมูลของ ${instructor.name} เรียบร้อยแล้ว`);
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
      title: "การดำเนินการ",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleViewDetail(record)}>
            ดูรายละเอียด
          </Button>
          <Popconfirm
            title="ลบข้อมูลผู้สอน"
            description={`คุณต้องการลบข้อมูลของ "${record.name}" ใช่หรือไม่? การดำเนินการนี้จะลบข้อมูลผู้สอนออกจากคลาสทั้งหมด`}
            onConfirm={() => handleDeleteInstructor(record.name)}
            okText="ใช่"
            cancelText="ไม่"
            okButtonProps={{ loading: deleteLoading }}
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              ลบข้อมูล
            </Button>
          </Popconfirm>
        </Space>
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
              <Space>
                <Input
                  placeholder="ค้นหาตามชื่อผู้สอน"
                  prefix={<SearchOutlined />}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  allowClear
                />
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    exportToCSV(filteredData, "instructor_report.csv")
                  }
                  disabled={filteredData.length === 0}
                >
                  ส่งออก CSV
                </Button>
              </Space>
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
                {selectedInstructor && (
                  <Popconfirm
                    title="ลบข้อมูลผู้สอน"
                    description={`คุณต้องการลบข้อมูลของ "${selectedInstructor.name}" ใช่หรือไม่? การดำเนินการนี้จะลบข้อมูลผู้สอนออกจากคลาสทั้งหมด`}
                    onConfirm={() => handleDeleteInstructor(selectedInstructor.name)}
                    okText="ใช่"
                    cancelText="ไม่"
                    okButtonProps={{ loading: deleteLoading }}
                  >
                    <Button type="primary" danger icon={<DeleteOutlined />}>
                      ลบข้อมูล
                    </Button>
                  </Popconfirm>
                )}
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
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={() =>
                    exportInstructorDetailToCSV(
                      selectedInstructor,
                      `instructor_detail_${selectedInstructor?.name.replace(
                        /\s+/g,
                        "_"
                      )}${
                        selectedMonth
                          ? "_" + moment(selectedMonth).format("YYYY-MM")
                          : ""
                      }.csv`
                    )
                  }
                  disabled={!selectedInstructor || filteredClasses.length === 0}
                >
                  ส่งออก CSV
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
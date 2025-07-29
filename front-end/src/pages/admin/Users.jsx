import { useEffect, useState } from "react";
import {
  Layout,
  Table,
  Input,
  Button,
  Select,
  Modal,
  Form,
  message,
  Tag,
  Tooltip,
  InputNumber,
  Drawer,
  Space,
  List,
  Avatar,
  Empty,
  Spin,
  Divider,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  HistoryOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/User.css";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../services/userService";
import reservationService from "../../services/reservationService";
import moment from "moment";
import dayjs from "dayjs";
const { Sider, Content } = Layout;
const { Option } = Select;

const UserPage = () => {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [expiryDays, setExpiryDays] = useState(0);

  // ส่วนที่เพิ่มมาใหม่สำหรับแสดงประวัติการจองคลาส
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [selectedUserHistory, setSelectedUserHistory] = useState(null);
  const [userReservations, setUserReservations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response.status === "success") {
        setUsers(response.users); // Extract `users` from the response
      } else {
        message.error("Failed to fetch users.");
      }
    } catch (error) {
      message.error(`Failed to fetch users: ${error.message}`);
    }
  };

  // ฟังก์ชันใหม่สำหรับดึงประวัติการจองของผู้ใช้
  const fetchUserHistory = async (userId, userName) => {
    setLoadingHistory(true);
    setHistoryDrawerVisible(true);
    setSelectedUserHistory(userName);
    setUserReservations([]);

    try {
      const response = await reservationService.getUserReservations(userId);
      if (response && response.reservations) {
        setUserReservations(response.reservations);
      } else {
        message.info("No reservation history found for this user.");
      }
    } catch (error) {
      console.error("Error fetching reservation history:", error);
      message.error("Failed to fetch reservation history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const showCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    setExpiryDays(90); // Default to 90 days for new users
    form.setFieldsValue({ expiry_days: 90 });
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setEditingUser(record);

    // คำนวณวันที่เหลือถ้ามีวันหมดอายุ
    let daysLeft = 0;
    if (record.sessions_expiry_date) {
      const expiryDate = moment(record.sessions_expiry_date).endOf("day");
      const now = moment().startOf("day");
      daysLeft = Math.max(0, expiryDate.diff(now, "days"));
    }

    setExpiryDays(daysLeft);

    // Format birth date for input field (YYYY-MM-DD format)
    const formattedBirthDate = record.birth_date 
      ? moment(record.birth_date).format("YYYY-MM-DD")
      : null;

    // ตั้งค่าฟอร์มเริ่มต้น
    form.setFieldsValue({
      ...record,
      birth_date: formattedBirthDate,
      expiry_days: daysLeft,
    });

    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // คำนวณวันหมดอายุใหม่จากการใส่จำนวนวัน
      // ใช้ startOf('day') เพื่อให้เวลาเริ่มที่ 00:00:00
      // และ endOf('day') เพื่อให้เวลาสิ้นสุดที่ 23:59:59
      const newExpiryDate = moment()
        .startOf("day")
        .add(values.expiry_days, "days")
        .endOf("day")
        .toDate();

      // จัดเตรียมข้อมูลสำหรับส่งไป API
      const userPayload = {
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        code: values.code,
        phone: values.phone,
        birth_date: values.birth_date,
        address: values.address,
        registration_date: values.registration_date || new Date().toISOString(),
        role_name: values.role_id,
        referrer_id: values.referrer_id || null,
        total_classes: values.total_classes || 0,
        remaining_session: values.remaining_session || 0,
        sessions_expiry_date: values.expiry_days > 0 ? newExpiryDate : null,
        special_rights: values.special_rights,
      };

      if (editingUser) {
        await updateUser(editingUser._id, userPayload);
        message.success("User updated successfully");
      } else {
        await createUser(userPayload);
        message.success("User created successfully");
      }
      fetchUsers();
      setIsModalVisible(false);
    } catch (error) {
      message.error(`Failed to save user: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(editingUser._id);
      message.success("User deleted successfully");
      fetchUsers(); // Refresh the user list
      setIsModalVisible(false);
    } catch (error) {
      message.error(`Failed to delete user: ${error.message}`);
    }
  };

  // Function to format expiry date and calculate days left
  const formatExpiryInfo = (date) => {
    if (!date) return { text: "Not set", daysLeft: null };

    const expiryDate = moment(date).endOf("day");
    const now = moment().startOf("day");

    if (expiryDate.isBefore(now)) {
      return { text: "Expired", daysLeft: 0, status: "error" };
    }

    const daysLeft = expiryDate.diff(now, "days");
    return {
      text: expiryDate.format("YYYY-MM-DD"),
      daysLeft,
      status: daysLeft <= 7 ? "warning" : "success",
    };
  };

  const columns = [
    { 
      title: "Code", 
      dataIndex: "code", 
      key: "code",
      responsive: ["md"],
      ellipsis: true,
    },
    { 
      title: "First Name", 
      dataIndex: "first_name", 
      key: "first_name",
      ellipsis: true,
    },
    { 
      title: "Last Name", 
      dataIndex: "last_name", 
      key: "last_name",
      responsive: ["sm"],
      ellipsis: true,
    },
    { 
      title: "Email", 
      dataIndex: "email", 
      key: "email",
      responsive: ["lg"],
      ellipsis: true,
    },
    {
      title: "Birth Date",
      dataIndex: "birth_date",
      key: "birth_date",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : null),
      responsive: ["xl"],
    },
    {
      title: "Sessions",
      dataIndex: "remaining_session",
      key: "remaining_session",
      render: (sessions) => (
        <Tag color={sessions > 0 ? "green" : "red"}>{sessions || 0}</Tag>
      ),
      width: 80,
    },
    {
      title: "Expiry",
      dataIndex: "sessions_expiry_date",
      key: "sessions_expiry_date",
      render: (date) => {
        const { text, daysLeft, status } = formatExpiryInfo(date);
        return (
          <Tooltip title={daysLeft !== null ? `${daysLeft} days left` : ""}>
            <Tag icon={date ? <CalendarOutlined /> : null} color={status} size="small">
              <span className="hidden sm:inline">{text}</span>
              <span className="sm:hidden">{daysLeft !== null && daysLeft > 0 ? `${daysLeft}d` : text}</span>
              {daysLeft !== null && daysLeft > 0 && (
                <span className="hidden sm:inline"> ({daysLeft} days)</span>
              )}
            </Tag>
          </Tooltip>
        );
      },
      responsive: ["sm"],
    },
    {
      title: "Role",
      dataIndex: ["role_id"], // Access nested field
      key: "role_id",
      responsive: ["md"],
    },
    {
      title: "Action",
      key: "action",
      render: (record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            shape="circle"
            size="small"
            onClick={() => showEditModal(record)}
          />
          <Button
            type="primary"
            icon={<HistoryOutlined />}
            onClick={() =>
              fetchUserHistory(
                record._id,
                `${record.first_name} ${record.last_name}`
              )
            }
            title="View Reservation History"
            size="small"
            className="hidden sm:inline-flex"
          >
            <span className="hidden md:inline">History</span>
          </Button>
          <Button
            type="primary"
            icon={<HistoryOutlined />}
            onClick={() =>
              fetchUserHistory(
                record._id,
                `${record.first_name} ${record.last_name}`
              )
            }
            title="View Reservation History"
            size="small"
            shape="circle"
            className="sm:hidden"
          />
        </Space>
      ),
      fixed: "right",
      width: 120,
    },
  ];

  // แสดงข้อมูลการจองคลาสในรูปแบบที่อ่านง่าย
  const renderReservationList = () => {
    if (loadingHistory) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading reservation history...</div>
        </div>
      );
    }

    if (!userReservations || userReservations.length === 0) {
      return <Empty description="No reservation history found" />;
    }

    return (
      <List
        itemLayout="horizontal"
        dataSource={userReservations}
        renderItem={(item) => {
          const classInfo = item.class_id || {};

          // Format class date and time
          const classDate = classInfo.start_time
            ? moment(classInfo.start_time).format("DD MMM YYYY")
            : "N/A";

          const classTime =
            classInfo.start_time && classInfo.end_time
              ? `${moment(classInfo.start_time).format("HH:mm")} - ${moment(
                  classInfo.end_time
                ).format("HH:mm")}`
              : "N/A";

          return (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<CalendarOutlined />}
                    style={{
                      backgroundColor:
                        item.status === "Reserved" ? "#52c41a" : "#f5222d",
                    }}
                  />
                }
                title={
                  <Space>
                    <span>{classInfo.title || "Unknown Class"}</span>
                    <Tag color={item.status === "Reserved" ? "green" : "red"}>
                      {item.status}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <p>
                      <strong>Date:</strong> {classDate}
                    </p>
                    <p>
                      <strong>Time:</strong> {classTime}
                    </p>
                    <p>
                      <strong>Instructor:</strong>{" "}
                      {classInfo.instructor || "N/A"}
                    </p>
                    {item.status === "Reserved" && classInfo.room_number && (
                      <p>
                        <strong>Room:</strong> {classInfo.room_number}
                      </p>
                    )}
                    <p>
                      <strong>Reservation Date:</strong>{" "}
                      {moment(item.reservation_date).format(
                        "DD MMM YYYY HH:mm"
                      )}
                    </p>
                  </div>
                }
              />
            </List.Item>
          );
        }}
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "15", "20"],
        }}
      />
    );
  };

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider 
        width={220} 
        className="lg:block hidden"
        breakpoint="lg"
        collapsedWidth="0"
      >
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Users" />

        <Content className="user-container p-2 sm:p-4 lg:p-6">
          <div className="user-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold m-0">Users</h2>
            <Button
              type="primary"
              className="create-user-button w-full sm:w-auto"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
              size="large"
            >
              <span className="hidden sm:inline">Create User</span>
              <span className="sm:hidden">New User</span>
            </Button>
          </div>

          <div className="user-filters mb-4 flex flex-col sm:flex-row gap-2">
            <Select
              defaultValue="User Name"
              style={{ width: "100%" }}
              className="sm:w-40"
            >
              <Option value="User Name">User Name</Option>
            </Select>
            <Input
              placeholder="Search"
              prefix={<SearchOutlined />}
              style={{ width: "100%" }}
              className="sm:w-48"
              onChange={handleSearch}
            />
          </div>

          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={users.filter((user) =>
                user.first_name?.toLowerCase().includes(searchText)
              )}
              pagination={{ 
                position: ["bottomCenter"], 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                responsive: true
              }}
              rowKey="_id"
              scroll={{ x: 1000 }}
              size="small"
              className="responsive-table"
            />
          </div>

          {/* Modal สำหรับเพิ่ม/แก้ไขข้อมูลผู้ใช้ */}
          <Modal
            title={editingUser ? "Edit User" : "Create User"}
            visible={isModalVisible}
            onCancel={handleCancel}
            width="95%"
            style={{ maxWidth: 600, top: 20 }}
            footer={[
              editingUser && (
                <Button
                  key="delete"
                  type="danger"
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  size="small"
                  className="mb-2 sm:mb-0"
                >
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden">Del</span>
                </Button>
              ),
              <Button key="cancel" onClick={handleCancel} className="mb-2 sm:mb-0">
                Cancel
              </Button>,
              <Button key="save" type="primary" onClick={handleSave}>
                Save
              </Button>,
            ]}
          >
            <Form form={form} layout="vertical">
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item name="email" label="Email">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="password" label="Password">
                    <Input.Password />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="first_name"
                    label="First Name"
                    rules={[
                      { required: true, message: "Please enter the first name" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="last_name"
                    label="Last Name"
                    rules={[
                      { required: true, message: "Please enter the last name" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item name="code" label="Code">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="phone"
                    label="Phone"
                    rules={[
                      { required: true, message: "Please enter the phone number" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="birth_date"
                    label="Birth Date"
                    rules={[{ message: "Please enter the birth date" }]}
                  >
                    <Input type="date" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="role_id"
                    label="Role"
                    rules={[{ required: true, message: "Please select the role" }]}
                  >
                    <Select>
                      <Option value="Member">Member</Option>
                      <Option value="Instructor">Instructor</Option>
                      <Option value="Admin">Admin</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="referrer_id" label="Referrer ID">
                <Input />
              </Form.Item>
              
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="total_classes"
                    label="Total Classes"
                    rules={[
                      { required: false, message: "Please enter total classes" },
                    ]}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="remaining_session"
                    label="Remaining Session"
                    rules={[
                      {
                        required: false,
                        message: "Please enter remaining classes",
                      },
                    ]}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>

              {/* Changed to Days Until Expiration field */}
              <Form.Item
                name="expiry_days"
                label="Days Until Expiration"
                rules={[
                  {
                    required: false,
                    message: "Please enter number of days until expiration",
                  },
                ]}
                extra={
                  editingUser && editingUser.sessions_expiry_date
                    ? `Current expiry date: ${moment(
                        editingUser.sessions_expiry_date
                      ).format("YYYY-MM-DD")}`
                    : "Enter number of days until sessions expire"
                }
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Enter days (e.g., 90)"
                  onChange={(value) => setExpiryDays(value)}
                />
              </Form.Item>

              <Form.Item
                name="special_rights"
                label="Special Rights"
                rules={[
                  { required: false, message: "Please enter special rights" },
                ]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </Form>
          </Modal>

          {/* Drawer สำหรับแสดงประวัติการจองคลาส */}
          <Drawer
            title={
              <Space>
                <UserOutlined />
                <span className="text-sm sm:text-base">
                  {selectedUserHistory
                    ? `${selectedUserHistory}'s History`
                    : "Reservation History"}
                </span>
              </Space>
            }
            placement="right"
            width="95%"
            style={{ maxWidth: 600 }}
            onClose={() => setHistoryDrawerVisible(false)}
            visible={historyDrawerVisible}
            extra={
              <Button
                type="primary"
                onClick={() => setHistoryDrawerVisible(false)}
                size="small"
              >
                Close
              </Button>
            }
          >
            <div>
              <div className="user-history-summary">
                <h3>Reservation Summary</h3>
                <div style={{ marginBottom: 16 }}>
                  <p>
                    <strong>Total Reservations: </strong>
                    {userReservations.length}
                  </p>
                  {/* <p>
                    <strong>Active Reservations: </strong>
                    {
                      userReservations.filter(
                        (item) => item.status === "Reserved"
                      ).length
                    }
                  </p>
                  <p>
                    <strong>Cancelled Reservations: </strong>
                    {
                      userReservations.filter(
                        (item) => item.status === "Cancelled"
                      ).length
                    }
                  </p> */}
                </div>
              </div>

              <Divider />

              <div className="user-history-list">
                <h3>Reservation Details</h3>
                {renderReservationList()}
              </div>
            </div>
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserPage;

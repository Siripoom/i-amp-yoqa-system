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
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  HistoryOutlined,
  UserOutlined,
  ShoppingOutlined,
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
import orderService from "../../services/orderService";
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

  // ส่วนสำหรับแสดงประวัติการซื้อ
  const [orderDrawerVisible, setOrderDrawerVisible] = useState(false);
  const [selectedUserOrders, setSelectedUserOrders] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Get user role from localStorage for permission control
  const userRole = localStorage.getItem("role");

  // Define permissions based on role
  const canCreate = userRole === "SuperAdmin" || userRole === "Admin";
  const canEdit = userRole === "SuperAdmin" || userRole === "Admin";
  const canDelete = userRole === "SuperAdmin";
  const canViewHistory = userRole === "SuperAdmin" || userRole === "Admin" || userRole === "Accounting";

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
    if (!canViewHistory) {
      message.warning("You don't have permission to view user history.");
      return;
    }

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

  // ฟังก์ชันสำหรับดึงประวัติการซื้อของผู้ใช้
  const fetchUserOrders = async (userId, userName) => {
    if (!canViewHistory) {
      message.warning("You don't have permission to view user orders.");
      return;
    }

    setLoadingOrders(true);
    setOrderDrawerVisible(true);
    setSelectedUserOrders(userName);
    setUserOrders([]);

    try {
      const response = await orderService.getOrdersByUserId(userId);
      if (response && response.data) {
        setUserOrders(response.data);
      } else {
        message.info("No order history found for this user.");
      }
    } catch (error) {
      console.error("Error fetching order history:", error);
      message.error("Failed to fetch order history.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const showCreateModal = () => {
    if (!canCreate) {
      message.warning("You don't have permission to create users.");
      return;
    }
    setEditingUser(null);
    form.resetFields();
    setExpiryDays(90); // Default to 90 days for new users
    form.setFieldsValue({ expiry_days: 90 });
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    if (!canEdit && userRole !== "Accounting") {
      message.warning("You don't have permission to edit users.");
      return;
    }
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
    // Check permissions
    if (userRole === "Accounting") {
      message.warning("You don't have permission to modify user data.");
      return;
    }

    if (editingUser && !canEdit) {
      message.warning("You don't have permission to edit users.");
      return;
    }

    if (!editingUser && !canCreate) {
      message.warning("You don't have permission to create users.");
      return;
    }

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
        nickname: values.nickname,
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
    if (!canDelete) {
      message.warning("You don't have permission to delete users.");
      return;
    }

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
    { title: "Code", dataIndex: "code", key: "code" },
    { title: "Nickname", dataIndex: "nickname", key: "nickname" },
    { title: "First Name", dataIndex: "first_name", key: "first_name" },
    { title: "Last Name", dataIndex: "last_name", key: "last_name" },
    { title: "Email", dataIndex: "email", key: "email" },
    // {
    //   title: "Birth Date",
    //   dataIndex: "birth_date",
    //   key: "birth_date",
    //   render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : null),
    // },
    {title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Remaining Session",
      dataIndex: "remaining_session",
      key: "remaining_session",
      render: (sessions) => (
        <Tag color={sessions > 0 ? "green" : "red"}>{sessions || 0}</Tag>
      ),
    },
    {
      title: "Expiration Date",
      dataIndex: "sessions_expiry_date",
      key: "sessions_expiry_date",
      render: (date) => {
        const { text, daysLeft, status } = formatExpiryInfo(date);
        return (
          <Tooltip title={daysLeft !== null ? `${daysLeft} days left` : ""}>
            <Tag icon={date ? <CalendarOutlined /> : null} color={status}>
              {text}
              {daysLeft !== null && daysLeft > 0 ? ` (${daysLeft} days)` : ""}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Role",
      dataIndex: ["role_id"], // Access nested field
      key: "role_id",
    },
    // {
    //   title: "Status",
    //   key: "status",
    //   render: (record) => (
    //     <Tag color={record.deleted ? "red" : "green"}>
    //       {record.deleted ? "Deleted" : "Active"}
    //     </Tag>
    //   ),
    // },
    {
      title: "Action",
      key: "action",
      render: (record) => (
        <Space>
          {canEdit && (
            <Button
              icon={<EditOutlined />}
              shape="circle"
              onClick={() => showEditModal(record)}
            />
          )}
          {canViewHistory && (
            <Button
              type="primary"
               shape="circle"
              icon={<HistoryOutlined />}
              onClick={() =>
                fetchUserHistory(
                  record._id,
                  `${record.first_name} ${record.last_name}`
                )
              }
              title="View Reservation History"
            >
              
            </Button>
          )}
          {canViewHistory && (
            <Button
              type="default"
               shape="circle"
              icon={<ShoppingOutlined />}
              onClick={() =>
                fetchUserOrders(
                  record._id,
                  `${record.first_name} ${record.last_name}`
                )
              }
              title="View Order History"
            >
            
            </Button>
          )}
        </Space>
      ),
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

  // แสดงข้อมูลการซื้อในรูปแบบที่อ่านง่าย
  const renderOrderList = () => {
    if (loadingOrders) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading order history...</div>
        </div>
      );
    }

    if (!userOrders || userOrders.length === 0) {
      return <Empty description="No order history found" />;
    }

    return (
      <List
        itemLayout="horizontal"
        dataSource={userOrders}
        renderItem={(order) => {
          const isProduct = order.order_type === "product";
          const item = isProduct ? order.product_id : order.goods_id;

          // ตรวจสอบว่า item มีข้อมูลหรือไม่
          const itemName = isProduct
            ? item?.sessions && item?.duration
              ? `${item.sessions} Sessions - ${item.duration} Days`
              : "Product Package"
            : item?.goods || "Goods Item";

          // กำหนดสีของสถานะ
          const getStatusColor = (status) => {
            switch (status) {
              case "อนุมัติ":
                return "green";
              case "รออนุมัติ":
                return "orange";
              case "ยกเลิก":
                return "red";
              default:
                return "default";
            }
          };

          // Format order date
          const orderDate = order.createdAt
            ? moment(order.createdAt).format("DD MMM YYYY HH:mm")
            : "N/A";

          const approvalDate = order.approval_date
            ? moment(order.approval_date).format("DD MMM YYYY HH:mm")
            : "N/A";

          return (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<ShoppingOutlined />}
                    style={{
                      backgroundColor: isProduct ? "#1890ff" : "#722ed1",
                    }}
                  />
                }
                title={
                  <Space>
                    <span>{itemName}</span>
                    <Tag color={isProduct ? "blue" : "purple"}>
                      {isProduct ? "Product" : "Goods"}
                    </Tag>
                    <Tag color={getStatusColor(order.status)}>
                      {order.status}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <p>
                      <strong>Order Date:</strong> {orderDate}
                    </p>
                    {order.status === "อนุมัติ" && (
                      <p>
                        <strong>Approval Date:</strong> {approvalDate}
                      </p>
                    )}
                    <p>
                      <strong>Quantity:</strong> {order.quantity || 1}
                    </p>
                    {isProduct && (
                      <>
                        <p>
                          <strong>Total Sessions:</strong>{" "}
                          {order.total_sessions || 0}
                        </p>
                        <p>
                          <strong>Duration:</strong> {order.total_duration || 0}{" "}
                          days
                        </p>
                      </>
                    )}
                    {!isProduct && (
                      <>
                        {order.size && (
                          <p>
                            <strong>Size:</strong> {order.size}
                          </p>
                        )}
                        {order.color && (
                          <p>
                            <strong>Color:</strong> {order.color}
                          </p>
                        )}
                      </>
                    )}
                    <p>
                      <strong>Total Price:</strong>{" "}
                      {(order.total_price || 0).toLocaleString()} ฿
                    </p>
                    {order.invoice_number && (
                      <p>
                        <strong>Invoice Number:</strong> {order.invoice_number}
                      </p>
                    )}
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
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Users" />

        <Content className="user-container">
          {userRole === "Accounting" && (
            <div style={{
              background: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "4px",
              padding: "8px 12px",
              marginBottom: "16px",
              color: "#856404"
            }}>
              📖 You are in view-only mode. You can view user information and history but cannot make changes.
            </div>
          )}
          <div className="user-header">
            <h2>Users</h2>
            {canCreate && (
              <Button
                type="primary"
                className="create-user-button"
                icon={<PlusOutlined />}
                onClick={showCreateModal}
              >
                Create User
              </Button>
            )}
          </div>

          <div className="user-filters mb-4">
            <Select
              defaultValue="User Name"
              style={{ width: 150, marginRight: 10 }}
            >
              <Option value="User Name">User Name</Option>
            </Select>
            <Input
              placeholder="Search"
              prefix={<SearchOutlined />}
              style={{ width: 200, marginRight: 10 }}
              onChange={handleSearch}
            />
          </div>

          <Table
            columns={columns}
            dataSource={users.filter((user) =>
              user.first_name?.toLowerCase().includes(searchText) ||
              user.last_name?.toLowerCase().includes(searchText) ||
              user.nickname?.toLowerCase().includes(searchText) ||
              user.email?.toLowerCase().includes(searchText) ||
              user.code?.toLowerCase().includes(searchText)
            )}
            pagination={{ position: ["bottomCenter"], pageSize: 10 }}
            rowKey="_id"
          />

          {/* Modal สำหรับเพิ่ม/แก้ไขข้อมูลผู้ใช้ */}
          <Modal
            title={editingUser ? "Edit User" : "Create User"}
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={[
              editingUser && canDelete && (
                <Button
                  key="delete"
                  type="danger"
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              ),
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>,
              // Only show Save button if user has permission to create/edit
              (canCreate || canEdit) && (
                <Button key="save" type="primary" onClick={handleSave}>
                  Save
                </Button>
              ),
            ].filter(Boolean)} // Remove null/undefined elements
          >
            <Form form={form} layout="vertical">
              <Form.Item name="email" label="Email">
                <Input disabled={userRole !== "SuperAdmin"} />
              </Form.Item>
              <Form.Item name="password" label="Password">
                <Input.Password disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[
                  { required: true, message: "Please enter the first name" },
                ]}
              >
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[
                  { required: true, message: "Please enter the last name" },
                ]}
              >
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item name="nickname" label="Nickname">
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item name="code" label="code">
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  { required: true, message: "Please enter the phone number" },
                ]}
              >
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="birth_date"
                label="Birth Date"
                rules={[{ message: "Please enter the birth date" }]}
              >
                <Input type="date" disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="role_id"
                label="Role"
                rules={[{ required: true, message: "Please select the role" }]}
              >
                <Select disabled={userRole === "Accounting"}>
                  <Option value="Member">Member</Option>
                  <Option value="Instructor">Instructor</Option>
                  <Option value="Admin">Admin</Option>
                  <Option value="Accounting">Accounting</Option>
                  {userRole === "SuperAdmin" && (
                    <Option value="SuperAdmin">SuperAdmin</Option>
                  )}
                </Select>
              </Form.Item>
              <Form.Item name="referrer_id" label="Referrer ID">
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="total_classes"
                label="Total Classes"
                rules={[
                  { required: false, message: "Please enter total classes" },
                ]}
              >
                <Input type="number" disabled={userRole === "Accounting"} />
              </Form.Item>
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
                <Input type="number" disabled={userRole === "Accounting"} />
              </Form.Item>

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
                  disabled={userRole === "Accounting"}
                />
              </Form.Item>

              <Form.Item
                name="special_rights"
                label="Special Rights"
                rules={[
                  { required: false, message: "Please enter special rights" },
                ]}
              >
                <Input.TextArea rows={2} disabled={userRole === "Accounting"} />
              </Form.Item>
            </Form>
          </Modal>

          {/* Drawer สำหรับแสดงประวัติการจองคลาส */}
          <Drawer
            title={
              <Space>
                <UserOutlined />
                <span>
                  {selectedUserHistory
                    ? `${selectedUserHistory}'s Reservation History`
                    : "Reservation History"}
                </span>
              </Space>
            }
            placement="right"
            width={600}
            onClose={() => setHistoryDrawerVisible(false)}
            visible={historyDrawerVisible}
            extra={
              <Button
                type="primary"
                onClick={() => setHistoryDrawerVisible(false)}
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

          {/* Drawer สำหรับแสดงประวัติการซื้อ */}
          <Drawer
            title={
              <Space>
                <ShoppingOutlined />
                <span>
                  {selectedUserOrders
                    ? `${selectedUserOrders}'s Order History`
                    : "Order History"}
                </span>
              </Space>
            }
            placement="right"
            width={700}
            onClose={() => setOrderDrawerVisible(false)}
            visible={orderDrawerVisible}
            extra={
              <Button
                type="primary"
                onClick={() => setOrderDrawerVisible(false)}
              >
                Close
              </Button>
            }
          >
            <div>
              <div className="user-order-summary">
                <h3>Order Summary</h3>
                <div style={{ marginBottom: 16 }}>
                  <p>
                    <strong>Total Orders: </strong>
                    {userOrders.length}
                  </p>
                  <p>
                    <strong>Product Orders: </strong>
                    {userOrders.filter((item) => item.order_type === "product").length}
                  </p>
                  <p>
                    <strong>Goods Orders: </strong>
                    {userOrders.filter((item) => item.order_type === "goods").length}
                  </p>
                  <p>
                    <strong>Total Amount: </strong>
                    {userOrders.reduce((sum, order) => sum + (order.total_price || 0), 0).toLocaleString()} ฿
                  </p>
                </div>
              </div>

              <Divider />

              <div className="user-order-list">
                <h3>Order Details</h3>
                {renderOrderList()}
              </div>
            </div>
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserPage;
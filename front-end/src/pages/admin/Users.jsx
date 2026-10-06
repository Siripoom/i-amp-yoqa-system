import { colors } from "../../theme/tokens.js";
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
const { Sider, Content } = Layout;
const { Option } = Select;

const UserPage = () => {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [, setExpiryDays] = useState(0);
  const selectedRole = Form.useWatch("role_id", form);
  const hasMedicalCondition = Form.useWatch("has_medical_condition", form);

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
        message.error("โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
      }
    } catch (error) {
      message.error(`โหลดรายชื่อผู้ใช้ไม่สำเร็จ: ${error.message}`);
    }
  };

  // ฟังก์ชันใหม่สำหรับดึงประวัติการจองของผู้ใช้
  const fetchUserHistory = async (userId, userName) => {
    if (!canViewHistory) {
      message.warning("คุณไม่มีสิทธิ์ดูประวัติผู้ใช้");
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
        message.info("ไม่พบประวัติการจองของผู้ใช้นี้");
      }
    } catch (error) {
      console.error("Error fetching reservation history:", error);
      message.error("โหลดประวัติการจองไม่สำเร็จ");
    } finally {
      setLoadingHistory(false);
    }
  };

  // ฟังก์ชันสำหรับดึงประวัติการซื้อของผู้ใช้
  const fetchUserOrders = async (userId, userName) => {
    if (!canViewHistory) {
      message.warning("คุณไม่มีสิทธิ์ดูคำสั่งซื้อของผู้ใช้");
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
        message.info("ไม่พบประวัติคำสั่งซื้อของผู้ใช้นี้");
      }
    } catch (error) {
      console.error("Error fetching order history:", error);
      message.error("โหลดประวัติคำสั่งซื้อไม่สำเร็จ");
    } finally {
      setLoadingOrders(false);
    }
  };

  const showCreateModal = () => {
    if (!canCreate) {
      message.warning("คุณไม่มีสิทธิ์สร้างผู้ใช้");
      return;
    }
    setEditingUser(null);
    form.resetFields();
    setExpiryDays(30);
    form.setFieldsValue({ expiry_days: 30, role_id: "Member" });
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    if (!canEdit && userRole !== "Accounting") {
      message.warning("คุณไม่มีสิทธิ์แก้ไขผู้ใช้");
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
      message.warning("คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้");
      return;
    }

    if (editingUser && !canEdit) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขผู้ใช้");
      return;
    }

    if (!editingUser && !canCreate) {
      message.warning("คุณไม่มีสิทธิ์สร้างผู้ใช้");
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
        gender: values.gender,
        has_medical_condition: values.has_medical_condition,
        medical_condition_details: values.medical_condition_details,
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
        message.success("แก้ไขข้อมูลผู้ใช้สำเร็จ");
      } else {
        await createUser(userPayload);
        message.success("สร้างผู้ใช้สำเร็จ");
      }
      fetchUsers();
      setIsModalVisible(false);
    } catch (error) {
      message.error(`บันทึกผู้ใช้ไม่สำเร็จ: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      message.warning("คุณไม่มีสิทธิ์ลบผู้ใช้");
      return;
    }

    try {
      await deleteUser(editingUser._id);
      message.success("ลบผู้ใช้สำเร็จ");
      fetchUsers(); // Refresh the user list
      setIsModalVisible(false);
    } catch (error) {
      message.error(`ลบผู้ใช้ไม่สำเร็จ: ${error.message}`);
    }
  };

  // Function to format expiry date and calculate days left
  const formatExpiryInfo = (date) => {
    if (!date) return { text: "ยังไม่ได้ระบุ", daysLeft: null };

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
    { title: "รหัส", dataIndex: "code", key: "code" },
    { title: "ชื่อเล่น", dataIndex: "nickname", key: "nickname" },
    { title: "ชื่อ", dataIndex: "first_name", key: "first_name" },
    { title: "นามสกุล", dataIndex: "last_name", key: "last_name" },
    { title: "อีเมล", dataIndex: "email", key: "email" },
    // {
    //   title: "Birth Date",
    //   dataIndex: "birth_date",
    //   key: "birth_date",
    //   render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : null),
    // },
    {title: "เบอร์โทรศัพท์", dataIndex: "phone", key: "phone" },
    {
      title: "เพศ",
      dataIndex: "gender",
      key: "gender",
      render: (gender) => gender === "male" ? "ชาย" : gender === "female" ? "หญิง" : "-",
    },
    { title: "ที่อยู่", dataIndex: "address", key: "address" },
    ...(canEdit
      ? [{
          title: "โรคประจำตัว",
          key: "medical_condition",
          render: (_, record) => record.has_medical_condition
            ? record.medical_condition_details || "มี"
            : record.has_medical_condition === false ? "ไม่มี" : "-",
        }]
      : []),
    {
      title: "จำนวนครั้งคงเหลือ",
      dataIndex: "remaining_session",
      key: "remaining_session",
      render: (sessions) => (
        <Tag color={sessions > 0 ? "green" : "red"}>{sessions || 0}</Tag>
      ),
    },
    {
      title: "วันหมดอายุ",
      dataIndex: "sessions_expiry_date",
      key: "sessions_expiry_date",
      render: (date) => {
        const { text, daysLeft, status } = formatExpiryInfo(date);
        return (
          <Tooltip title={daysLeft !== null ? `เหลือ ${daysLeft} วัน` : ""}>
            <Tag icon={date ? <CalendarOutlined /> : null} color={status}>
              {text}
              {daysLeft !== null && daysLeft > 0 ? ` (${daysLeft} days)` : ""}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "บทบาท",
      dataIndex: ["role_id"], // Access nested field
      key: "role_id",
    },
    // {
    //   title: "สถานะ",
    //   key: "status",
    //   render: (record) => (
    //     <Tag color={record.deleted ? "red" : "green"}>
    //       {record.deleted ? "Deleted" : "Active"}
    //     </Tag>
    //   ),
    // },
    {
      title: "จัดการ",
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
              title="ดูประวัติการจอง"
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
              title="ดูประวัติคำสั่งซื้อ"
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
          <div style={{ marginTop: 16 }}>กำลังโหลดประวัติการจอง...</div>
        </div>
      );
    }

    if (!userReservations || userReservations.length === 0) {
      return <Empty description="ไม่พบประวัติการจอง" />;
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
                        item.status === "Reserved" ? colors["success"] : "#f5222d",
                    }}
                  />
                }
                title={
                  <Space>
                    <span>{classInfo.title || "ไม่ทราบชื่อคลาส"}</span>
                    <Tag color={item.status === "Reserved" ? "green" : "red"}>
                      {item.status === "Reserved" ? "จองแล้ว" : item.status === "Cancelled" ? "ยกเลิกแล้ว" : item.status}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <p>
                      <strong>วันที่:</strong> {classDate}
                    </p>
                    <p>
                      <strong>เวลา:</strong> {classTime}
                    </p>
                    <p>
                      <strong>ครูผู้สอน:</strong>{" "}
                      {classInfo.instructor || "N/A"}
                    </p>
                    {item.status === "Reserved" && classInfo.room_number && (
                      <p>
                        <strong>ห้อง:</strong> {classInfo.room_number}
                      </p>
                    )}
                    <p>
                      <strong>วันที่จอง:</strong>{" "}
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
          <div style={{ marginTop: 16 }}>กำลังโหลดประวัติคำสั่งซื้อ...</div>
        </div>
      );
    }

    if (!userOrders || userOrders.length === 0) {
      return <Empty description="ไม่พบประวัติคำสั่งซื้อ" />;
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
                      backgroundColor: isProduct ? colors["primary"] : colors["primary"],
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
                      <strong>วันที่สั่งซื้อ:</strong> {orderDate}
                    </p>
                    {order.status === "อนุมัติ" && (
                      <p>
                        <strong>วันที่อนุมัติ:</strong> {approvalDate}
                      </p>
                    )}
                    <p>
                      <strong>จำนวน:</strong> {order.quantity || 1}
                    </p>
                    {isProduct && (
                      <>
                        <p>
                          <strong>จำนวนครั้งทั้งหมด:</strong>{" "}
                          {order.total_sessions || 0}
                        </p>
                        <p>
                          <strong>ระยะเวลา:</strong> {order.total_duration || 0}{" "}
                          days
                        </p>
                      </>
                    )}
                    {!isProduct && (
                      <>
                        {order.size && (
                          <p>
                            <strong>ขนาด:</strong> {order.size}
                          </p>
                        )}
                        {order.color && (
                          <p>
                            <strong>สี:</strong> {order.color}
                          </p>
                        )}
                      </>
                    )}
                    <p>
                      <strong>ราคารวม:</strong>{" "}
                      {(order.total_price || 0).toLocaleString()} ฿
                    </p>
                    {order.invoice_number && (
                      <p>
                        <strong>เลขที่ใบแจ้งหนี้:</strong> {order.invoice_number}
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
        <Header title="ผู้ใช้" />

        <Content className="user-container">
          {userRole === "Accounting" && (
            <div style={{
              background: "var(--color-warning-soft)",
              border: "1px solid var(--color-warning-soft)",
              borderRadius: "4px",
              padding: "8px 12px",
              marginBottom: "16px",
              color: colors["warning"]
            }}>
              📖 You are in view-only mode. You can view user information and history but cannot make changes.
            </div>
          )}
          <div className="user-header">
            <h2>ผู้ใช้</h2>
            {canCreate && (
              <Button
                type="primary"
                className="create-user-button"
                icon={<PlusOutlined />}
                onClick={showCreateModal}
              >
                สร้างผู้ใช้
              </Button>
            )}
          </div>

          <div className="user-filters mb-4">
            <Select
              defaultValue="User Name"
              style={{ width: 150, marginRight: 10 }}
            >
              <Option value="User Name">ชื่อผู้ใช้</Option>
            </Select>
            <Input
              placeholder="ค้นหา"
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
            title={editingUser ? "แก้ไขผู้ใช้" : "สร้างผู้ใช้"}
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
                  ลบ
                </Button>
              ),
                <Button key="cancel" onClick={handleCancel}>
                  ยกเลิก
              </Button>,
              // Only show Save button if user has permission to create/edit
              (canCreate || canEdit) && (
                <Button key="save" type="primary" onClick={handleSave}>
                  บันทึก
                </Button>
              ),
            ].filter(Boolean)} // Remove null/undefined elements
          >
            <Form form={form} layout="vertical">
              <Form.Item name="email" label="อีเมล">
                <Input disabled={userRole !== "SuperAdmin"} />
              </Form.Item>
              <Form.Item name="password" label="รหัสผ่าน">
                <Input.Password disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="first_name"
                label="ชื่อ"
                rules={[
                  { required: true, message: "กรุณาระบุชื่อ" },
                ]}
              >
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="last_name"
                label="นามสกุล"
                rules={[
                  { required: true, message: "กรุณาระบุนามสกุล" },
                ]}
              >
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item name="nickname" label="ชื่อเล่น">
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item name="code" label="รหัส"
              >
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="phone"
                label="เบอร์โทรศัพท์"
                rules={[
                  { required: true, message: "กรุณาระบุเบอร์โทรศัพท์" },
                ]}
              >
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="birth_date"
                label="วันเกิด"
                rules={[{ message: "กรุณาระบุวันเกิด" }]}
              >
                <Input type="date" disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="gender"
                label="เพศ"
                rules={[
                  {
                    required: selectedRole === "Member",
                    message: "กรุณาเลือกเพศ",
                  },
                ]}
              >
                <Select disabled={userRole === "Accounting"} allowClear>
                  <Option value="female">หญิง</Option>
                  <Option value="male">ชาย</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="address"
                label="ที่อยู่"
                rules={[
                  {
                    required: selectedRole === "Member",
                    whitespace: true,
                    message: "กรุณาระบุที่อยู่",
                  },
                ]}
              >
                <Input.TextArea rows={3} disabled={userRole === "Accounting"} />
              </Form.Item>
              {canEdit && (
                <Form.Item
                  name="has_medical_condition"
                  label="โรคประจำตัว"
                  rules={[
                    {
                      required: selectedRole === "Member",
                      message: "กรุณาระบุข้อมูลโรคประจำตัว",
                    },
                  ]}
                >
                  <Select allowClear>
                    <Option value={false}>ไม่มีโรคประจำตัว</Option>
                    <Option value={true}>มีโรคประจำตัว</Option>
                  </Select>
                </Form.Item>
              )}
              {canEdit && hasMedicalCondition === true && (
                <Form.Item
                  name="medical_condition_details"
                  label="รายละเอียดโรคประจำตัว"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: "กรุณาระบุรายละเอียดโรคประจำตัว",
                    },
                  ]}
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
              )}
              <Form.Item
                name="role_id"
                label="บทบาท"
                rules={[{ required: true, message: "กรุณาเลือกบทบาท" }]}
              >
                <Select disabled={userRole === "Accounting"}>
                  <Option value="Member">สมาชิก</Option>
                  <Option value="Instructor">ครูผู้สอน</Option>
                  <Option value="Admin">ผู้ดูแลระบบ</Option>
                  <Option value="Accounting">บัญชี</Option>
                  {userRole === "SuperAdmin" && (
                    <Option value="SuperAdmin">ผู้ดูแลระบบสูงสุด</Option>
                  )}
                </Select>
              </Form.Item>
              <Form.Item name="referrer_id" label="รหัสผู้แนะนำ">
                <Input disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="total_classes"
                label="จำนวนคลาสทั้งหมด"
                rules={[
                  { required: false, message: "กรุณาระบุจำนวนคลาสทั้งหมด" },
                ]}
              >
                <Input type="number" disabled={userRole === "Accounting"} />
              </Form.Item>
              <Form.Item
                name="remaining_session"
                label="จำนวนครั้งคงเหลือ"
                rules={[
                  {
                    required: false,
                    message: "กรุณาระบุจำนวนครั้งคงเหลือ",
                  },
                ]}
              >
                <Input type="number" disabled={userRole === "Accounting"} />
              </Form.Item>

              {/* Changed to Days Until Expiration field */}
              <Form.Item
                name="expiry_days"
                label="จำนวนวันก่อนหมดอายุ"
                rules={[
                  {
                    required: false,
                    message: "กรุณาระบุจำนวนวันก่อนหมดอายุ",
                  },
                ]}
                extra={
                  editingUser && editingUser.sessions_expiry_date
                    ? `Current expiry date: ${moment(
                      editingUser.sessions_expiry_date
                    ).format("YYYY-MM-DD")}`
                    : "ระบุจำนวนวันก่อนแพ็กเกจหมดอายุ"
                }
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="ระบุจำนวนวัน เช่น 30"
                  onChange={(value) => setExpiryDays(value)}
                  disabled={userRole === "Accounting"}
                />
              </Form.Item>

              <Form.Item
                name="special_rights"
                label="สิทธิพิเศษ"
                rules={[
                  { required: false, message: "กรุณาระบุสิทธิพิเศษ" },
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
                    : "ประวัติการจอง"}
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
                ปิด
              </Button>
            }
          >
            <div>
              <div className="user-history-summary">
                <h3>สรุปรายการจอง</h3>
                <div style={{ marginBottom: 16 }}>
                  <p>
                    <strong>การจองทั้งหมด: </strong>
                    {userReservations.length}
                  </p>
                  {/* <p>
                    <strong>การจองที่ใช้งาน: </strong>
                    {
                      userReservations.filter(
                        (item) => item.status === "Reserved"
                      ).length
                    }
                  </p>
                  <p>
                    <strong>การจองที่ยกเลิก: </strong>
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
                <h3>รายละเอียดการจอง</h3>
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
                    : "ประวัติคำสั่งซื้อ"}
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
                ปิด
              </Button>
            }
          >
            <div>
              <div className="user-order-summary">
                <h3>สรุปคำสั่งซื้อ</h3>
                <div style={{ marginBottom: 16 }}>
                  <p>
                    <strong>คำสั่งซื้อทั้งหมด: </strong>
                    {userOrders.length}
                  </p>
                  <p>
                    <strong>คำสั่งซื้อคอร์ส: </strong>
                    {userOrders.filter((item) => item.order_type === "product").length}
                  </p>
                  <p>
                    <strong>คำสั่งซื้อสินค้า: </strong>
                    {userOrders.filter((item) => item.order_type === "goods").length}
                  </p>
                  <p>
                    <strong>ยอดรวม: </strong>
                    {userOrders.reduce((sum, order) => sum + (order.total_price || 0), 0).toLocaleString()} ฿
                  </p>
                </div>
              </div>

              <Divider />

              <div className="user-order-list">
                <h3>รายละเอียดคำสั่งซื้อ</h3>
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

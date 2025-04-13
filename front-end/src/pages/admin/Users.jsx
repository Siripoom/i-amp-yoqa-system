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
  Upload,
  Tag,
  Tooltip,
  InputNumber,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  CalendarOutlined,
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
import moment from "moment";

const { Sider, Content } = Layout;
const { Option } = Select;

const UserPage = () => {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [expiryDays, setExpiryDays] = useState(0);

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

    // ตั้งค่าฟอร์มเริ่มต้น
    form.setFieldsValue({
      ...record,
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
    { title: "Code", dataIndex: "code", key: "code" },
    { title: "First Name", dataIndex: "first_name", key: "first_name" },
    { title: "Last Name", dataIndex: "last_name", key: "last_name" },
    { title: "Email", dataIndex: "email", key: "email" },
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
    {
      title: "Status",
      key: "status",
      render: (record) => (
        <Tag color={record.deleted ? "red" : "green"}>
          {record.deleted ? "Deleted" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record) => (
        <Button
          icon={<EditOutlined />}
          shape="circle"
          onClick={() => showEditModal(record)}
        />
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Users" />

        <Content className="user-container">
          <div className="user-header">
            <h2>Users</h2>
            <Button
              type="primary"
              className="create-user-button"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
            >
              Create User
            </Button>
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
              user.first_name?.toLowerCase().includes(searchText)
            )}
            pagination={{ position: ["bottomCenter"], pageSize: 10 }}
            rowKey="_id"
          />

          <Modal
            title={editingUser ? "Edit User" : "Create User"}
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={[
              editingUser && (
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
              <Button key="save" type="primary" onClick={handleSave}>
                Save
              </Button>,
            ]}
          >
            <Form form={form} layout="vertical">
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Password">
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[
                  { required: true, message: "Please enter the first name" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[
                  { required: true, message: "Please enter the last name" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="code" label="code">
                <Input />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  { required: true, message: "Please enter the phone number" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="birth_date"
                label="Birth Date"
                rules={[
                  { required: true, message: "Please enter the birth date" },
                ]}
              >
                <Input type="date" />
              </Form.Item>
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
              <Form.Item name="referrer_id" label="Referrer ID">
                <Input />
              </Form.Item>
              <Form.Item
                name="total_classes"
                label="Total Classes"
                rules={[
                  { required: false, message: "Please enter total classes" },
                ]}
              >
                <Input type="number" />
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
                <Input type="number" />
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
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserPage;

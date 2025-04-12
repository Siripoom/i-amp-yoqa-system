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
  DatePicker,
  Space,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
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
  const [expiryEditMode, setExpiryEditMode] = useState({});
  const [form] = Form.useForm();

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
        setUsers(response.users);
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
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      birth_date: record.birth_date ? moment(record.birth_date) : null,
      sessions_expiry_date: record.sessions_expiry_date
        ? moment(record.sessions_expiry_date)
        : null,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const userPayload = {
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        code: values.code,
        phone: values.phone,
        birth_date: values.birth_date
          ? values.birth_date.format("YYYY-MM-DD")
          : null,
        address: values.address,
        registration_date: values.registration_date || new Date().toISOString(),
        role_name: values.role_id,
        referrer_id: values.referrer_id || null,
        total_classes: values.total_classes || 0,
        remaining_session: values.remaining_session || 0,
        sessions_expiry_date: values.sessions_expiry_date
          ? values.sessions_expiry_date.format("YYYY-MM-DD")
          : null,
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
      fetchUsers();
      setIsModalVisible(false);
    } catch (error) {
      message.error(`Failed to delete user: ${error.message}`);
    }
  };

  // Toggle expiry edit mode for a specific user
  const toggleExpiryEditMode = (userId) => {
    setExpiryEditMode((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Update expiration date for a user
  const updateExpiryDate = async (userId, newDate) => {
    try {
      // Calculate new expiry date based on today + new days
      const newExpiryDate = moment().add(newDate, "days").format("YYYY-MM-DD");

      await updateUser(userId, {
        sessions_expiry_date: newExpiryDate,
      });

      message.success("Expiration date updated");
      fetchUsers();
      setExpiryEditMode((prev) => ({ ...prev, [userId]: false }));
    } catch (error) {
      message.error(`Failed to update expiration: ${error.message}`);
    }
  };

  // Calculate days remaining until expiration
  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null;

    const expiry = moment(expiryDate);
    const today = moment();

    if (expiry.isBefore(today)) {
      return <Tag color="red">Expired</Tag>;
    }

    const days = expiry.diff(today, "days");
    return (
      <Tag color={days <= 7 ? "warning" : "success"}>{days} days left</Tag>
    );
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
    },
    {
      title: "Sessions Expiry",
      key: "sessions_expiry_date",
      render: (record) => (
        <Space>
          {expiryEditMode[record._id] ? (
            <Space>
              <Input
                placeholder="Days to add"
                type="number"
                defaultValue={30}
                style={{ width: 100 }}
                onPressEnter={(e) =>
                  updateExpiryDate(record._id, e.target.value)
                }
              />
              <Popconfirm
                title="Add these days to expiration?"
                onConfirm={(e) => {
                  const input =
                    e.target.parentNode.parentNode.parentNode.querySelector(
                      "input"
                    );
                  updateExpiryDate(record._id, input.value);
                }}
                okText="Yes"
                cancelText="No"
              >
                <Button size="small" type="primary">
                  Save
                </Button>
              </Popconfirm>
              <Button
                size="small"
                onClick={() => toggleExpiryEditMode(record._id)}
              >
                Cancel
              </Button>
            </Space>
          ) : (
            <Space>
              {record.sessions_expiry_date ? (
                <>
                  <Tooltip
                    title={moment(record.sessions_expiry_date).format(
                      "YYYY-MM-DD"
                    )}
                  >
                    {getDaysRemaining(record.sessions_expiry_date)}
                  </Tooltip>
                  <Button
                    type="link"
                    size="small"
                    icon={<CalendarOutlined />}
                    onClick={() => toggleExpiryEditMode(record._id)}
                  >
                    Edit
                  </Button>
                </>
              ) : (
                <Space>
                  <Tag color="default">Not set</Tag>
                  <Button
                    type="link"
                    size="small"
                    icon={<CalendarOutlined />}
                    onClick={() => toggleExpiryEditMode(record._id)}
                  >
                    Set
                  </Button>
                </Space>
              )}
            </Space>
          )}
        </Space>
      ),
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
              defaultValue="User ID"
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
            dataSource={users.filter(
              (user) =>
                user.first_name?.toLowerCase().includes(searchText) ||
                user.last_name?.toLowerCase().includes(searchText) ||
                user.email?.toLowerCase().includes(searchText)
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
                  danger
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
            width={700}
          >
            <Form form={form} layout="vertical">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <Form.Item name="code" label="Code">
                  <Input />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="Phone"
                  rules={[
                    {
                      required: true,
                      message: "Please enter the phone number",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item name="birth_date" label="Birth Date">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  name="role_id"
                  label="Role"
                  rules={[
                    { required: true, message: "Please select the role" },
                  ]}
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

                <Form.Item name="total_classes" label="Total Classes">
                  <Input type="number" />
                </Form.Item>

                <Form.Item name="remaining_session" label="Remaining Session">
                  <Input type="number" />
                </Form.Item>

                <Form.Item
                  name="sessions_expiry_date"
                  label="Sessions Expiry Date"
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item name="special_rights" label="Special Rights">
                  <Input.TextArea rows={2} />
                </Form.Item>
              </div>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserPage;

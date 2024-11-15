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
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../styles/User.css";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";

const { Sider, Content } = Layout;
const { Option } = Select;

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

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
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setEditingUser(record);
    form.setFieldsValue(record);
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
        prefix: values.prefix,
        phone: values.phone,
        birth_date: values.birth_date,
        address: values.address,
        registration_date: values.registration_date || new Date().toISOString(),
        role_name: values.role_name,
        referrer_id: values.referrer_id || null, // Default to null if not provided
        total_classes: values.total_classes || 0, // Default to 0 if not provided
        remaining_classes: values.remaining_classes || 0, // Default to 0 if not provided
        special_rights: values.special_rights,
      };

      if (editingUser) {
        await updateUser(editingUser._id, userPayload);
        message.success("User updated successfully");
      } else {
        await createUser(userPayload);
        message.success("User created successfully");
      }
      fetchUsers(); // Refresh the user list
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

  const columns = [
    { title: "ID", dataIndex: "_id", key: "_id" },
    { title: "First Name", dataIndex: "first_name", key: "first_name" },
    { title: "Last Name", dataIndex: "last_name", key: "last_name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Role",
      dataIndex: ["role_id", "role_name"], // Access nested field
      key: "role_name",
      render: (_, record) => record.role_id?.role_name || "N/A",
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

          <div className="user-filters">
            <Select
              defaultValue="User ID"
              style={{ width: 150, marginRight: 10 }}
            >
              <Option value="User ID">User ID</Option>
              <Option value="User Name">User Name</Option>
            </Select>
            <Input
              placeholder="Search"
              prefix={<SearchOutlined />}
              style={{ width: 200, marginRight: 10 }}
            />
          </div>

          <Table
            columns={columns}
            dataSource={users}
            pagination={{ position: ["bottomCenter"], pageSize: 5 }}
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
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: "Please enter the email" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please enter the password" },
                ]}
              >
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
              <Form.Item
                name="prefix"
                label="Prefix"
                rules={[{ required: true, message: "Please enter the prefix" }]}
              >
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
                name="address"
                label="Address"
                rules={[
                  { required: true, message: "Please enter the address" },
                ]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item
                name="role_name"
                label="Role"
                rules={[{ required: true, message: "Please select the role" }]}
              >
                <Select>
                  <Option value="Member">Member</Option>
                  <Option value="Instructor">Instructor</Option>
                  <Option value="Admin">Instructor</Option>
                  <Option value="Sales">Instructor</Option>
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
                name="remaining_classes"
                label="Remaining Classes"
                rules={[
                  {
                    required: false,
                    message: "Please enter remaining classes",
                  },
                ]}
              >
                <Input type="number" />
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

import { useState } from "react";
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

const { Sider, Content } = Layout;
const { Option } = Select;

const initialUserData = [
  {
    userId: 59217,
    name: "Cody Fisher",
    refNumber: "12345",
    status: "Active",
  },
  {
    userId: 59213,
    name: "Kristin Watson",
    refNumber: "12346",
    status: "Invited",
  },
];

const UserPage = () => {
  const [users, setUsers] = useState(initialUserData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

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

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (editingUser) {
        setUsers((prev) =>
          prev.map((user) =>
            user.userId === editingUser.userId ? { ...user, ...values } : user
          )
        );
        message.success("User updated successfully");
      } else {
        const newUser = { ...values, userId: Date.now() };
        setUsers((prev) => [...prev, newUser]);
        message.success("User created successfully");
      }
      setIsModalVisible(false);
    });
  };

  const handleDelete = () => {
    setUsers((prev) =>
      prev.filter((user) => user.userId !== editingUser.userId)
    );
    message.success("User deleted successfully");
    setIsModalVisible(false);
  };

  const columns = [
    { title: "ID", dataIndex: "userId", key: "userId" },
    { title: "NAME", dataIndex: "name", key: "name" },
    { title: "REF NUMBER", dataIndex: "refNumber", key: "refNumber" },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "gray"}>{status}</Tag>
      ),
    },
    {
      title: "ACTION",
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
            rowKey="userId"
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
                name="name"
                label="Name"
                rules={[
                  { required: true, message: "Please enter the user name" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="refNumber"
                label="Reference Number"
                rules={[
                  {
                    required: true,
                    message: "Please enter the reference number",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="status"
                label="Status"
                rules={[
                  { required: true, message: "Please select the status" },
                ]}
              >
                <Select>
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                  <Option value="Invited">Invited</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { required: true, message: "Please enter a description" },
                ]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item
                name="image"
                label="Upload Image"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              >
                <Upload
                  name="logo"
                  listType="picture"
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserPage;

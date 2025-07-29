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
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/Terms.css";
import {
  getAllUserTerms,
  deleteUserTerms,
  updateUserTerms,
} from "../../services/userTermService";

import moment from "moment";
const { Sider, Content } = Layout;
const { Option } = Select;

const UserPage = () => {
  const [userTerms, setUserTerms] = useState([]);
  const [filteredUserTerms, setFilteredUserTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUserTerm, setEditingUserTerm] = useState(null);
  const [form] = Form.useForm();

  // Fetch user terms data
  const fetchUserTerms = async () => {
    setLoading(true);
    try {
      const response = await getAllUserTerms();
      if (response.status === "success") {
        setUserTerms(response.data);
        setFilteredUserTerms(response.data);
      }
    } catch (error) {
      message.error("Failed to fetch user terms data");
      console.error("Error fetching user terms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTerms();
  }, []);

  // Filter function
  useEffect(() => {
    let filtered = userTerms;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        (item) =>
          item.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
          item._id?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => {
        if (filterStatus === "accepted") return item.accepted === true;
        if (filterStatus === "pending") return item.accepted === false;
        return true;
      });
    }

    setFilteredUserTerms(filtered);
  }, [searchText, filterStatus, userTerms]);

  // Handle edit
  const handleEdit = (record) => {
    setEditingUserTerm(record);
    form.setFieldsValue({
      fullName: record.fullName,
      accepted: record.accepted,
    });
    setIsModalVisible(true);
  };

  // Handle update
  const handleUpdate = async (values) => {
    try {
      await updateUserTerms(editingUserTerm._id, values);
      message.success("User terms updated successfully");
      setIsModalVisible(false);
      setEditingUserTerm(null);
      form.resetFields();
      fetchUserTerms();
    } catch (error) {
      message.error("Failed to update user terms");
      console.error("Error updating user terms:", error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await deleteUserTerms(id);
      message.success("User terms deleted successfully");
      fetchUserTerms();
    } catch (error) {
      message.error("Failed to delete user terms");
      console.error("Error deleting user terms:", error);
    }
  };

  // Table columns
  const columns = [
    {
      title: "ID",
      dataIndex: "_id",
      key: "_id",
      width: 200,
      render: (text) => (
        <Tooltip title={text}>
          <span className="font-mono text-xs">{text?.substring(0, 8)}...</span>
        </Tooltip>
      ),
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      render: (text) => (
        <div className="flex items-center gap-2">
          <UserOutlined className="text-gray-500" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: "อนุญาตให้ใช้ภาพในการเผยแพร่",
      dataIndex: "accepted",
      key: "accepted",
      render: (accepted) => (
        <Tag color={accepted ? "green" : "orange"}>
          {accepted ? "Accepted" : "Pending"}
        </Tag>
      ),
    },
    {
      title: "Accepted Date",
      dataIndex: "acceptedAt",
      key: "acceptedAt",
      render: (date) => (
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-gray-500" />
          <span>
            {date ? moment(date).format("DD/MM/YYYY HH:mm") : "Not accepted"}
          </span>
        </div>
      ),
    },
    // {
    //   title: "Created Date",
    //   dataIndex: "createdAt",
    //   key: "createdAt",
    //   render: (date) => (
    //     <span>
    //       {date ? moment(date).format("DD/MM/YYYY HH:mm") : "N/A"}
    //     </span>
    //   ),
    // },
    // {
    //   title: "Actions",
    //   key: "actions",
    //   width: 150,
    //   render: (_, record) => (
    //     <Space size="small">
    //       <Tooltip title="Edit">
    //         <Button
    //           type="primary"
    //           icon={<EditOutlined />}
    //           size="small"
    //           onClick={() => handleEdit(record)}
    //         />
    //       </Tooltip>
    //       <Tooltip title="Delete">
    //         <Popconfirm
    //           title="Are you sure you want to delete this user terms?"
    //           onConfirm={() => handleDelete(record._id)}
    //           okText="Yes"
    //           cancelText="No"
    //         >
    //           <Button
    //             type="primary"
    //             danger
    //             icon={<DeleteOutlined />}
    //             size="small"
    //           />
    //         </Popconfirm>
    //       </Tooltip>
    //     </Space>
    //   ),
    // },
  ];

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
        <Header title="Terms Management" />

        <Content className="user-container p-2 sm:p-4 lg:p-6">
          <div className="user-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold m-0">
              User Terms Management
            </h2>
            <div className="flex gap-2">
              <Button type="primary" onClick={fetchUserTerms} loading={loading}>
                Refresh
              </Button>
            </div>
          </div>
         

          

          <div className="user-filters mb-4 flex flex-col sm:flex-row gap-2">
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: "100%" }}
              className="sm:w-40"
            >
              <Option value="all">All Status</Option>
              <Option value="accepted">Accepted</Option>
              <Option value="pending">Pending</Option>
            </Select>
            <Input
              placeholder="Search by name or ID"
              prefix={<SearchOutlined />}
              style={{ width: "100%" }}
              className="sm:w-48"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="responsive-table">
            <Table
              columns={columns}
              dataSource={filteredUserTerms}
              rowKey="_id"
              loading={loading}
              pagination={{
                total: filteredUserTerms.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 800 }}
            />
          </div>

          {/* Edit Modal */}
          <Modal
            title="Edit User Terms"
            open={isModalVisible}
            onCancel={() => {
              setIsModalVisible(false);
              setEditingUserTerm(null);
              form.resetFields();
            }}
            footer={null}
            width={600}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdate}
              className="mt-4"
            >
              <Form.Item
                label="Full Name"
                name="fullName"
                rules={[
                  { required: true, message: "Please input the full name!" },
                ]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>

              <Form.Item
                label="Status"
                name="accepted"
                rules={[
                  { required: true, message: "Please select the status!" },
                ]}
              >
                <Select placeholder="Select status">
                  <Option value={true}>Accepted</Option>
                  <Option value={false}>Pending</Option>
                </Select>
              </Form.Item>

              <Form.Item className="mb-0 flex justify-end">
                <Space>
                  <Button
                    onClick={() => {
                      setIsModalVisible(false);
                      setEditingUserTerm(null);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit">
                    Update
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserPage;

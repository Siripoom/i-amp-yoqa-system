import { useState } from "react";
import {
  Layout,
  Table,
  Input,
  Button,
  Tag,
  Select,
  Modal,
  Form,
  message,
  Upload,
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
import "../styles/Course.css";

const { Sider, Content } = Layout;
const { Option } = Select;

// Mock course data
const initialCourseData = [
  {
    id: 59217,
    name: "MEDITATION YOGA",
    category: "M",
    status: "Active",
    description: "",
    image: null,
  },
  {
    id: 59213,
    name: "HATHA FLOW YOGA",
    category: "H",
    status: "Invited",
    description: "",
    image: null,
  },
  {
    id: 59219,
    name: "Esther Howard",
    category: "E",
    status: "Active",
    description: "",
    image: null,
  },
];

const CoursesPage = () => {
  const [courses, setCourses] = useState(initialCourseData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form] = Form.useForm();

  const showCreateModal = () => {
    setEditingCourse(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setEditingCourse(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (editingCourse) {
        setCourses((prev) =>
          prev.map((course) =>
            course.id === editingCourse.id ? { ...course, ...values } : course
          )
        );
        message.success("Course updated successfully");
      } else {
        const newCourse = { ...values, id: Date.now() };
        setCourses((prev) => [...prev, newCourse]);
        message.success("Course created successfully");
      }
      setIsModalVisible(false);
    });
  };

  const handleDelete = () => {
    setCourses((prev) =>
      prev.filter((course) => course.id !== editingCourse.id)
    );
    message.success("Course deleted successfully");
    setIsModalVisible(false);
  };

  const handleImageUpload = (info) => {
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully.`);
      form.setFieldValue("image", info.file.originFileObj);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const columns = [
    { title: "COURSE ID", dataIndex: "id", key: "id" },
    { title: "COURSE NAME", dataIndex: "name", key: "name" },
    { title: "CATEGORY", dataIndex: "category", key: "category" },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusColors = {
          Active: "green",
          Invited: "blue",
          Inactive: "red",
        };
        return <Tag color={statusColors[status]}>{status}</Tag>;
      },
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
        <Header title="Courses" />

        <Content className="course-container">
          <div className="course-header">
            <h2>Courses</h2>
            <Button
              type="primary"
              className="create-course-button"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
            >
              Create Course
            </Button>
          </div>

          <div className="course-filters">
            <Select
              defaultValue="Course name"
              style={{ width: 150, marginRight: 10 }}
            >
              <Option value="Course name">Course name</Option>
              <Option value="Category">Category</Option>
            </Select>
            <Input
              placeholder="Search"
              prefix={<SearchOutlined />}
              style={{ width: 200, marginRight: 10 }}
            />
          </div>

          <Table
            columns={columns}
            dataSource={courses}
            pagination={{ position: ["bottomCenter"], pageSize: 5 }}
            rowKey="id"
          />

          <Modal
            title={editingCourse ? "Edit Course" : "Create Course"}
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={[
              editingCourse && (
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
                label="Course Name"
                rules={[
                  { required: true, message: "Please enter the course name" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="category"
                label="Category"
                rules={[
                  { required: true, message: "Please enter the category" },
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
                  <Option value="Invited">Invited</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { required: true, message: "Please enter the description" },
                ]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item name="image" label="Upload Image">
                <Upload
                  name="image"
                  listType="picture"
                  beforeUpload={() => false} // Prevent automatic upload
                  onChange={handleImageUpload}
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

export default CoursesPage;

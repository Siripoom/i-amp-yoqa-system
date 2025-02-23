import { useEffect, useState } from "react";
import {
  Layout,
  Table,
  Input,
  Button,
  Modal,
  Form,
  message,
  Upload,
  Select,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/Course.css";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../services/courseService";

const { Sider, Content } = Layout;
const { Option } = Select;

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form] = Form.useForm();

  // Fetch courses from the API
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await getCourses();
      setCourses(response.courses);
    } catch (error) {
      message.error("Failed to load courses");
    }
  };

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

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      formData.append("course_name", values.course_name);
      formData.append("details", values.details);
      formData.append("user_id", "670801f199db64199ba1c2dc"); // Set user_id here for testing

      if (values.image && values.image.file) {
        formData.append("image", values.image.file);
      }

      if (editingCourse) {
        await updateCourse(editingCourse._id, formData);
        message.success("Course updated successfully");
      } else {
        await createCourse(formData);
        message.success("Course created successfully");
      }

      fetchCourses(); // Refresh the course list
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to save course");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourse(editingCourse._id);
      message.success("Course deleted successfully");
      fetchCourses(); // Refresh the course list
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to delete course");
    }
  };

  const handleImageUpload = (info) => {
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully.`);
      form.setFieldsValue({ image: info.file.originFileObj });
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const columns = [
    { title: "COURSE ID", dataIndex: "_id", key: "_id" },
    { title: "COURSE NAME", dataIndex: "course_name", key: "course_name" },
    { title: "CATEGORY", dataIndex: "details", key: "details" },
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
              defaultValue="Course ID"
              style={{ width: 150, marginRight: 10 }}
            >
              <Option value="Course ID">Course ID</Option>
              <Option value="Course Name">Course Name</Option>
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
            rowKey="_id"
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
                name="course_name"
                label="Course Name"
                rules={[
                  { required: true, message: "Please enter the course name" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="details"
                label="Details"
                rules={[
                  { required: true, message: "Please enter course details" },
                ]}
              >
                <Input />
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

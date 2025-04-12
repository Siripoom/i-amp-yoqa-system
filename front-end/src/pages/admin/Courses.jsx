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
  const [searchText, setSearchText] = useState("");
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
  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const userId = localStorage.getItem("userId");

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      // Set difficulty manually, or calculate it based on another condition
      const difficulty = parseInt(values.difficulty); // or any logic to determine difficulty, for example:
      // const difficulty = userId === "someUserId" ? 3 : 1;

      formData.append("course_name", values.course_name);
      formData.append("details", values.details);
      formData.append("difficulty", difficulty); // Using manual value

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

  const columns = [
    // { title: "COURSE ID", dataIndex: "_id", key: "_id" },
    { title: "COURSE NAME", dataIndex: "course_name", key: "course_name" },
    { title: "CATEGORY", dataIndex: "details", key: "details" },
    { title: "DIFFICULTY", dataIndex: "difficulty", key: "difficulty" },
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
              defaultValue="Course Name"
              style={{ width: 150, marginRight: 10 }}
            >
              {/* <Option value="Course ID">Course ID</Option> */}
              <Option value="Course Name">Course Name</Option>
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
            dataSource={courses.filter((course) =>
              course.course_name.toLowerCase().includes(searchText)
            )}
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
              <Form.Item
                name="difficulty"
                label="Difficulty"
                rules={[
                  { required: true, message: "Please enter course difficulty" },
                ]}
              >
                <Input type="number" />
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CoursesPage;

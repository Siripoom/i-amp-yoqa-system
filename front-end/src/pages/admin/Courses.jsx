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
      message.error("โหลดคอร์สไม่สำเร็จ");
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
        message.success("แก้ไขคอร์สสำเร็จ");
      } else {
        await createCourse(formData);
        message.success("สร้างคอร์สสำเร็จ");
      }

      fetchCourses(); // Refresh the course list
      setIsModalVisible(false);
    } catch (error) {
      message.error("บันทึกคอร์สไม่สำเร็จ");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourse(editingCourse._id);
      message.success("ลบคอร์สสำเร็จ");
      fetchCourses(); // Refresh the course list
      setIsModalVisible(false);
    } catch (error) {
      message.error("ลบคอร์สไม่สำเร็จ");
    }
  };

  const columns = [
    // { title: "รหัสคอร์ส", dataIndex: "_id", key: "_id" },
    { title: "ชื่อคอร์ส", dataIndex: "course_name", key: "course_name" },
    { title: "หมวดหมู่", dataIndex: "details", key: "details" },
    { title: "ระดับความยาก", dataIndex: "difficulty", key: "difficulty" },
    {
      title: "จัดการ",
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
        <Header title="คอร์ส" />

        <Content className="course-container">
          <div className="course-header">
            <h2>คอร์ส</h2>
            <Button
              type="primary"
              className="create-course-button"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
            >
              สร้างคอร์ส
            </Button>
          </div>
          <div className="course-filters">
            <Select
              defaultValue="Course Name"
              style={{ width: 150, marginRight: 10 }}
            >
              {/* <Option value="Course ID">รหัสคอร์ส</Option> */}
              <Option value="Course Name">ชื่อคอร์ส</Option>
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
            dataSource={courses.filter((course) =>
              course.course_name.toLowerCase().includes(searchText)
            )}
            pagination={{ position: ["bottomCenter"], pageSize: 5 }}
            rowKey="_id"
          />

          <Modal
            title={editingCourse ? "แก้ไขคอร์ส" : "สร้างคอร์ส"}
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
                  ลบ
                </Button>
              ),
              <Button key="cancel" onClick={handleCancel}>
                ยกเลิก
              </Button>,
              <Button key="save" type="primary" onClick={handleSave}>
                บันทึก
              </Button>,
            ]}
          >
            <Form form={form} layout="vertical">
              <Form.Item
                name="course_name"
                label="ชื่อคอร์ส"
                rules={[
                  { required: true, message: "กรุณาระบุชื่อคอร์ส" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="details"
                label="รายละเอียด"
                rules={[
                  { required: true, message: "กรุณาระบุรายละเอียดคอร์ส" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="difficulty"
                label="ระดับความยาก"
                rules={[
                  { required: true, message: "กรุณาระบุระดับความยาก" },
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

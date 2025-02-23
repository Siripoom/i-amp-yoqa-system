import { Layout, Modal, Input, Form, Button, Select, message } from "antd";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { useState, useEffect } from "react";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import dayjs from "dayjs";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/Course.css";
import "../../styles/Calendar.css";
import { getCourses } from "../../services/courseService";
import classService from "../../services/classService";
import { getUsers } from "../../services/userService";
const { Sider, Content } = Layout;
const DragAndDropCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

const Schedule = () => {
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [form] = Form.useForm();

  // 📌 โหลดข้อมูลคอร์สและคลาสทั้งหมด
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const courseData = await getCourses();
      setCourses(courseData.courses);

      const classData = await classService.getAllClasses();
      console.log("Raw classData:", classData);

      const userData = await getUsers();
      setUsers(userData.users);
      console.log("Raw userData:", userData.users);
      const formattedEvents = classData.data.map((cls) => ({
        id: cls._id,
        title: cls.title,
        instructor: cls.instructor,
        room_number: cls.room_number,
        description: cls.description,
        passcode: cls.passcode,
        zoom_link: cls.zoom_link,
        start: new Date(cls.start_time), // ✅ แปลงเป็น Date
        end: new Date(cls.end_time), // ✅ แปลงเป็น Date
      }));

      console.log("Formatted events:", formattedEvents);
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  fetchData();
  const formatDateTimeLocal = (date) => {
    return date ? dayjs(date).format("YYYY-MM-DDTHH:mm") : null;
  };

  // 📌 เปิด Modal เพื่อเพิ่มหรือแก้ไขคลาส
  const handleOpenModal = (event = null, start = null, end = null) => {
    if (event) {
      setCurrentEvent(event);
      form.setFieldsValue({
        title: event.title,
        instructor: event.instructor,
        room_number: event.room_number,
        description: event.description,
        passcode: event.passcode,
        zoom_link: event.zoom_link,
        start_time: event.start
          ? dayjs(event.start).format("YYYY-MM-DDTHH:mm")
          : null,
        end_time: event.end
          ? dayjs(event.end).format("YYYY-MM-DDTHH:mm")
          : null,
      });
    } else {
      setCurrentEvent(null);
      form.resetFields();
      form.setFieldsValue({
        title: "",
        instructor: "",
        room_number: "",
        description: "",
        passcode: "",
        zoom_link: "",
        start_time: start ? dayjs(start).format("YYYY-MM-DDTHH:mm") : null,
        end_time: end ? dayjs(end).format("YYYY-MM-DDTHH:mm") : null,
      });
    }
    setIsModalOpen(true);
  };

  // 📌 ปิด Modal และโหลดข้อมูลใหม่
  const handleCloseModal = async () => {
    setIsModalOpen(false); // ✅ ปิด Modal หลังจากข้อมูลโหลดใหม่แล้ว
    await fetchData(); // ✅ โหลดข้อมูลใหม่ก่อนปิด Modal
    form.resetFields();
  };

  // 📌 เพิ่มหรือแก้ไขคลาส
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const classData = {
        title: values.title,
        instructor: values.instructor,
        room_number: values.room_number,
        description: values.description,
        passcode: values.passcode,
        zoom_link: values.zoom_link,
        start_time: values.start_time
          ? new Date(values.start_time).toISOString()
          : null,
        end_time: values.end_time
          ? new Date(values.end_time).toISOString()
          : null,
      };

      if (currentEvent) {
        await classService.updateClass(currentEvent.id, classData);
        message.success("Class updated successfully!");
      } else {
        await classService.createClass(classData);
        message.success("Class added successfully!");
      }

      await handleCloseModal();
    } catch (error) {
      message.error("Error saving class!");
      console.error(error);
    }
  };

  // 📌 ลบคลาส
  const handleDeleteEvent = async () => {
    try {
      await classService.deleteClass(currentEvent.id);
      message.success("Class deleted successfully!");

      await handleCloseModal();
    } catch (error) {
      message.error("Error deleting class!");
      console.error(error);
    }
  };

  // 📌 ลากแล้วเปลี่ยนเวลา
  const handleEventDrop = async ({ event, start, end }) => {
    try {
      await classService.updateClass(event.id, { start, end });
      message.success("Class rescheduled successfully!");

      // รีโหลดข้อมูลคลาส
      const updatedClasses = await classService.getAllClasses();
      setEvents(updatedClasses);
    } catch (error) {
      message.error("Error updating class schedule!");
      console.error(error);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Schedule" />

        <Content className="course-container">
          <div className="course-header">
            <h2>Schedule</h2>
          </div>
          <div style={{ padding: "16px" }}>
            <DragAndDropCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500, padding: "16px", borderRadius: "8px" }}
              selectable
              resizable
              onSelectEvent={(event) => handleOpenModal(event)}
              onSelectSlot={({ start, end }) =>
                handleOpenModal(null, start, end)
              }
              onEventDrop={handleEventDrop}
            />
          </div>
        </Content>
      </Layout>

      {/* Modal สำหรับเพิ่ม/แก้ไขอีเวนต์ */}
      <Modal
        title={currentEvent ? "Edit Class" : "Add Class"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={[
          currentEvent && (
            <Button key="delete" danger onClick={handleDeleteEvent}>
              Delete
            </Button>
          ),
          <Button key="cancel" onClick={handleCloseModal}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            {currentEvent ? "Save" : "Add"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Class Title"
            name="title"
            rules={[{ required: true, message: "Please select a class title" }]}
          >
            <Select
              placeholder="Select a class"
              onChange={(value) => {
                const selectedCourse = courses.find(
                  (course) => course.course_name === value
                );
                if (selectedCourse) {
                  form.setFieldsValue({ description: selectedCourse.details });
                }
              }}
            >
              {courses.map((course) => (
                <Select.Option key={course._id} value={course.course_name}>
                  {course.course_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Teacher"
            name="instructor"
            rules={[{ required: false, message: "Please select a teacher" }]}
          >
            <Select placeholder="Select a teacher">
              {users.map((user) => (
                <Select.Option
                  key={user._id}
                  value={user.first_name + " " + user.last_name}
                >
                  {user.first_name + " " + user.last_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="รายละเอียดของคลาส" />
          </Form.Item>
          <Form.Item label="📌 Room Number" name="room_number">
            <Input placeholder="Enter Room Number" />
          </Form.Item>

          <Form.Item label="🔑 Passcode" name="passcode">
            <Input placeholder="Enter Passcode" />
          </Form.Item>

          <Form.Item label="🔗 Zoom Link" name="zoom_link">
            <Input placeholder="Enter Zoom Link" />
          </Form.Item>
          <Form.Item
            label="Start Time"
            name="start_time"
            rules={[{ required: true }]}
          >
            <Input type="datetime-local" />
          </Form.Item>

          <Form.Item
            label="End Time"
            name="end_time"
            rules={[{ required: true }]}
          >
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Schedule;

import {
  Layout,
  Modal,
  Input,
  Form,
  Button,
  Select,
  message,
  ColorPicker,
  Checkbox,
  Space,
  Row,
  Col,
  Typography,
} from "antd";
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
import { CalendarOutlined, CopyOutlined } from "@ant-design/icons";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const DragAndDropCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

// รายชื่อเดือนในภาษาไทย
const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const Schedule = () => {
  const [instructorType, setInstructorType] = useState(null);
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [form] = Form.useForm();
  const [isDuplicating, setIsDuplicating] = useState(false);

  // เก็บข้อมูลเดือนที่ต้องการทำซ้ำ
  const [selectedMonths, setSelectedMonths] = useState([]);

  // 📌 โหลดข้อมูลคอร์สและคลาสทั้งหมด
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const courseData = await getCourses();
      setCourses(courseData.courses);

      const classData = await classService.getAllClasses();

      const userData = await getUsers();
      setUsers(userData.users);

      const formattedEvents = classData.data.map((cls) => ({
        id: cls._id,
        title: cls.title,
        instructor: cls.instructor,
        room_number: cls.room_number,
        description: cls.description,
        passcode: cls.passcode,
        zoom_link: cls.zoom_link,
        color: cls.color,
        start: new Date(cls.start_time),
        end: new Date(cls.end_time),
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
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
        color: event.color,
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
    setIsDuplicating(false);
    setSelectedMonths([]); // รีเซ็ตเดือนที่เลือกเมื่อเปิด Modal ใหม่
  };

  // 📌 ปิด Modal และโหลดข้อมูลใหม่
  const handleCloseModal = async () => {
    setIsModalOpen(false);
    await fetchData();
    form.resetFields();
    setIsDuplicating(false);
    setSelectedMonths([]);
  };

  // 📌 เพิ่มหรือแก้ไขคลาส
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formattedColor =
        typeof values.color === "string" ? values.color : "789DBC";

      const classData = {
        title: values.title,
        instructor: values.instructor,
        room_number: values.room_number,
        description: values.description,
        color: formattedColor,
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
      await classService.updateClass(event.id, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
      message.success("Class rescheduled successfully!");

      await fetchData();
    } catch (error) {
      message.error("Error updating class schedule!");
      console.error(error);
    }
  };

  // 📌 จัดการ Checkbox สำหรับเลือกเดือน
  const onMonthChange = (checkedValues) => {
    setSelectedMonths(checkedValues);
  };

  // 📌 ทำซ้ำคลาสตามเดือนที่เลือก
  const handleDuplicateEvent = async () => {
    try {
      if (!currentEvent || selectedMonths.length === 0) {
        message.warning("Please select at least one month for duplication");
        return;
      }

      // วันที่ของคลาสต้นฉบับ
      const originalDate = dayjs(currentEvent.start);
      const originalDay = originalDate.date(); // วันที่ในเดือน (1-31)
      const originalHour = originalDate.hour();
      const originalMinute = originalDate.minute();

      // คำนวณความยาวเวลาของคลาส (หน่วยเป็นนาที)
      const classDurationMinutes = dayjs(currentEvent.end).diff(
        originalDate,
        "minute"
      );

      // ข้อมูลปีปัจจุบันและปีถัดไป
      const currentYear = dayjs().year();
      const nextYear = currentYear + 1;

      // สร้างคลาสสำหรับแต่ละเดือนที่เลือก
      for (const monthIndex of selectedMonths) {
        // กำหนดปีตามเดือน (เช่น ถ้าเดือนปัจจุบันคือเดือน 11 และเลือกเดือน 2 ให้เป็นปีถัดไป)
        const currentMonth = originalDate.month();

        // หาปีที่ควรใช้ (ปีปัจจุบัน หรือ ปีถัดไป)
        let targetYear;
        if (monthIndex < currentMonth) {
          targetYear = nextYear; // ถ้าเดือนที่เลือกน้อยกว่าเดือนปัจจุบัน = ปีถัดไป
        } else if (monthIndex > currentMonth) {
          targetYear = currentYear; // ถ้าเดือนที่เลือกมากกว่าเดือนปัจจุบัน = ปีปัจจุบัน
        } else {
          continue; // ถ้าเลือกเดือนเดียวกับเดือนต้นฉบับ ให้ข้าม
        }

        // สร้างวันที่ใหม่ที่จะใช้ในการทำซ้ำ
        let newStartDate = dayjs()
          .year(targetYear)
          .month(monthIndex)
          .date(originalDay)
          .hour(originalHour)
          .minute(originalMinute);

        // ตรวจสอบว่าวันที่ถูกต้องหรือไม่ (เช่น 31 กุมภาพันธ์ไม่มี)
        if (newStartDate.date() !== originalDay) {
          // หากวันที่ไม่ตรง ให้ใช้วันสุดท้ายของเดือนนั้นแทน
          newStartDate = dayjs()
            .year(targetYear)
            .month(monthIndex)
            .endOf("month")
            .hour(originalHour)
            .minute(originalMinute);
        }

        // คำนวณเวลาสิ้นสุด
        const newEndDate = newStartDate.add(classDurationMinutes, "minute");

        // ส่งข้อมูลไปสร้างคลาสใหม่
        await classService.duplicateClass(currentEvent.id, {
          start_time: newStartDate.toISOString(),
          end_time: newEndDate.toISOString(),
        });
      }

      message.success(
        `Class duplicated to ${selectedMonths.length} selected months successfully!`
      );
      await handleCloseModal();
    } catch (error) {
      message.error("Error duplicating classes!");
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
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.color ? `#${event.color}` : "#789DBC",
                },
              })}
            />
          </div>
        </Content>
      </Layout>

      {/* Modal สำหรับเพิ่ม/แก้ไข/ทำซ้ำคลาส */}
      <Modal
        title={
          isDuplicating
            ? "ทำซ้ำคลาส"
            : currentEvent
            ? "Edit Class"
            : "Add Class"
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={[
          currentEvent && (
            <Button
              key="duplicate"
              onClick={() => setIsDuplicating(!isDuplicating)}
              icon={<CopyOutlined />}
            >
              {isDuplicating ? "กลับไปแก้ไข" : "ทำซ้ำคลาส"}
            </Button>
          ),
          currentEvent && !isDuplicating && (
            <Button key="delete" danger onClick={handleDeleteEvent}>
              Delete
            </Button>
          ),
          <Button key="cancel" onClick={handleCloseModal}>
            Cancel
          </Button>,
          isDuplicating ? (
            <Button
              key="duplicate-confirm"
              type="primary"
              onClick={handleDuplicateEvent}
              disabled={selectedMonths.length === 0}
            >
              ทำซ้ำคลาส
            </Button>
          ) : (
            <Button key="submit" type="primary" onClick={handleSubmit}>
              {currentEvent ? "Save" : "Add"}
            </Button>
          ),
        ]}
      >
        {isDuplicating && currentEvent ? (
          <div className="duplication-form">
            <div style={{ marginBottom: 20 }}>
              <Title level={5}>ทำซ้ำคลาส "{currentEvent.title}"</Title>
              <Text>
                วันที่ต้นฉบับ: {dayjs(currentEvent.start).format("DD/MM/YYYY")}
              </Text>
              <div style={{ marginTop: 10 }}>
                <Text type="secondary">
                  เลือกเดือนที่ต้องการสร้างคลาสซ้ำ (วันและเวลาจะเหมือนเดิม)
                </Text>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <Checkbox.Group
                onChange={onMonthChange}
                value={selectedMonths}
                style={{ width: "100%" }}
              >
                <Row gutter={[8, 16]}>
                  {thaiMonths.map((month, index) => (
                    <Col span={8} key={index}>
                      <Checkbox value={index}>{month}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </div>

            {selectedMonths.length > 0 && (
              <div
                style={{
                  marginTop: 20,
                  padding: 10,
                  background: "#f0f7ff",
                  borderRadius: 4,
                }}
              >
                <Text strong>จะทำซ้ำคลาส {selectedMonths.length} เดือน: </Text>
                <Text>
                  {selectedMonths.map((i) => thaiMonths[i]).join(", ")}
                </Text>
              </div>
            )}
          </div>
        ) : (
          <Form form={form} layout="vertical">
            {/* ส่วนเลือกประเภทอาจารย์ */}
            <Form.Item
              label="Instructor Type"
              name="instructor_type"
              rules={[
                { required: true, message: "Please select instructor type" },
              ]}
            >
              <Select
                placeholder="Select instructor type"
                onChange={(value) => {
                  setInstructorType(value);
                  form.setFieldsValue({ instructor: "" });
                }}
              >
                <Select.Option value="internal">Internal Teacher</Select.Option>
                <Select.Option value="guest">Guest Teacher</Select.Option>
              </Select>
            </Form.Item>

            {/* ส่วนเลือกอาจารย์ */}
            {instructorType === "internal" ? (
              <Form.Item
                label="Teacher"
                name="instructor"
                rules={[{ required: true, message: "Please select a teacher" }]}
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
            ) : instructorType === "guest" ? (
              <Form.Item
                label="Teacher"
                name="instructor"
                rules={[
                  {
                    required: true,
                    message: "Please enter a guest teacher name",
                  },
                ]}
              >
                <Input placeholder="Enter guest teacher's name" />
              </Form.Item>
            ) : null}

            {/* ส่วนอื่นๆ ของฟอร์ม */}
            <Form.Item
              label="Class Title"
              name="title"
              rules={[
                { required: true, message: "Please select a class title" },
              ]}
            >
              <Select
                placeholder="Select a class"
                onChange={(value) => {
                  const selectedCourse = courses.find(
                    (course) => course.course_name === value
                  );
                  if (selectedCourse) {
                    form.setFieldsValue({
                      description: selectedCourse.details,
                    });
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

            <Form.Item label="Description" name="description">
              <Input.TextArea rows={2} placeholder="Class description" />
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
            <Form.Item
              label="Color"
              name="color"
              getValueFromEvent={(color) =>
                color.toHexString().replace("#", "")
              }
            >
              <ColorPicker showText format="hex" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Layout>
  );
};

export default Schedule;

import { Layout, Modal, Input, Form, Button, Select } from "antd";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { useState } from "react";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import dayjs from "dayjs";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/Course.css";
import "../../styles/Calendar.css";

const { Sider, Content } = Layout;
const DragAndDropCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

const Schedule = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "MEDITATION YOGA",
      start: new Date(2025, 1, 12, 10, 0),
      end: new Date(2025, 1, 12, 12, 0),
      description: "โยคะสายสมาธิ คลายเครียด",
      roomNumber: "101",
      passcode: "YOGA2025",
      zoomLink: "https://zoom.us/meditation-yoga",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [form] = Form.useForm();

  const handleOpenModal = (event, start = null, end = null) => {
    if (event) {
      setCurrentEvent(event);
      form.setFieldsValue({
        ...event,
        start: formatDateTimeLocal(event.start),
        end: formatDateTimeLocal(event.end),
      });
    } else {
      setCurrentEvent(null);
      form.setFieldsValue({
        title: "",
        teacher: null,
        description: "",
        roomNumber: "",
        passcode: "",
        zoomLink: "",
        start: start ? formatDateTimeLocal(start) : null,
        end: end ? formatDateTimeLocal(end) : null,
      });
    }
    setIsModalOpen(true);
  };

  const formatDateTimeLocal = (date) => {
    return date ? dayjs(date).format("YYYY-MM-DDTHH:mm") : null;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const newValues = {
        ...values,
        start: values.start ? dayjs(values.start).toDate() : null,
        end: values.end ? dayjs(values.end).toDate() : null,
      };

      if (currentEvent) {
        setEvents((prev) =>
          prev.map((event) =>
            event.id === currentEvent.id ? { ...event, ...newValues } : event
          )
        );
      } else {
        const newEvent = {
          id: events.length + 1,
          ...newValues,
        };
        setEvents((prev) => [...prev, newEvent]);
      }
      handleCloseModal();
    });
  };

  const handleDeleteEvent = () => {
    setEvents((prev) => prev.filter((event) => event.id !== currentEvent.id));
    handleCloseModal();
  };

  const handleEventDrop = ({ event, start, end }) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, start, end } : e))
    );
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
        title={currentEvent ? "Edit Event" : "Add Event"}
        visible={isModalOpen}
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
            rules={[{ required: true, message: "Please enter event title" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Teacher"
            name="teacher"
            rules={[{ required: true, message: "Please select a teacher" }]}
          >
            <Select placeholder="Select a teacher">
              <Select.Option value="John Doe">John Doe</Select.Option>
              <Select.Option value="Jane Smith">Jane Smith</Select.Option>
              <Select.Option value="Michael Brown">Michael Brown</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="รายละเอียดของคลาส" />
          </Form.Item>

          <Form.Item label="📌 Room Number" name="roomNumber">
            <Input placeholder="Enter Room Number" />
          </Form.Item>

          <Form.Item label="🔑 Passcode" name="passcode">
            <Input placeholder="Enter Passcode" />
          </Form.Item>

          <Form.Item label="🔗 Zoom Link" name="zoomLink">
            <Input placeholder="Enter Zoom Link" />
          </Form.Item>

          <Form.Item
            label="Start Time"
            name="start"
            rules={[{ required: true, message: "Please select start time" }]}
          >
            <Input type="datetime-local" />
          </Form.Item>

          <Form.Item
            label="End Time"
            name="end"
            rules={[{ required: true, message: "Please select end time" }]}
          >
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Schedule;

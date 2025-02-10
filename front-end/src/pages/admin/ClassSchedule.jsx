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
      title: "Meeting with Team",
      start: new Date(2025, 0, 28, 10, 0),
      end: new Date(2025, 0, 28, 12, 0),
    },
    {
      id: 2,
      title: "Project Deadline",
      start: new Date(2025, 0, 30, 14, 0),
      end: new Date(2025, 0, 30, 15, 0),
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [form] = Form.useForm();
  // const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  // const [repeatFrequency, setRepeatFrequency] = useState(1);
  // const [repeatInterval, setRepeatInterval] = useState("week");
  // const [repeatOnDays, setRepeatOnDays] = useState([]);
  // const [repeatEnds, setRepeatEnds] = useState("never");
  // const [repeatEndDate, setRepeatEndDate] = useState(null);
  // const [repeatOccurrences, setRepeatOccurrences] = useState(null);
  // const [recurrenceDetails, setRecurrenceDetails] = useState("");

  // const generateRecurrenceDetails = () => {
  //   if (repeatInterval === "week") {
  //     return `Every ${repeatFrequency} week(s) on ${repeatOnDays.join(", ")} ${
  //       repeatEnds === "never"
  //         ? "forever"
  //         : repeatEnds === "onDate"
  //         ? `until ${repeatEndDate}`
  //         : `for ${repeatOccurrences} occurrences`
  //     }`;
  //   }

  //   return `Every ${repeatFrequency} ${repeatInterval}(s) ${
  //     repeatEnds === "never"
  //       ? "forever"
  //       : repeatEnds === "onDate"
  //       ? `until ${repeatEndDate}`
  //       : `for ${repeatOccurrences} occurrences`
  //   }`;
  // };

  // เปิด Modal สำหรับเพิ่ม/แก้ไขอีเวนต์
  const handleOpenModal = (event, start = null, end = null) => {
    if (event) {
      // กรณี Edit Event
      setCurrentEvent(event);
      form.setFieldsValue({
        ...event,
        start: event.start ? formatDateTimeLocal(event.start) : null,
        end: event.end ? formatDateTimeLocal(event.end) : null,
      });
    } else {
      // กรณี Add Event
      setCurrentEvent(null);
      form.setFieldsValue({
        title: "",
        Teacher: null,
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
        recurrence: {
          frequency: values.repeat,
          ends: values.repeatEnds,
          endDate: values.endDate ? dayjs(values.endDate).toDate() : null,
          occurrences: values.occurrences || null,
        },
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

  // ลบอีเวนต์
  const handleDeleteEvent = () => {
    setEvents((prev) => prev.filter((event) => event.id !== currentEvent.id));
    handleCloseModal();
  };
  // const generateRecurringEvents = (event) => {
  //   const { start, end, recurrence } = event;

  //   if (!recurrence || recurrence.frequency === "none") {
  //     return [event];
  //   }

  //   const events = [];
  //   let currentStart = dayjs(start);
  //   let currentEnd = dayjs(end);

  //   while (
  //     (!recurrence.endDate || currentStart.isBefore(recurrence.endDate)) &&
  //     (!recurrence.occurrences || events.length < recurrence.occurrences)
  //   ) {
  //     events.push({
  //       ...event,
  //       start: currentStart.toDate(),
  //       end: currentEnd.toDate(),
  //     });

  //     switch (recurrence.frequency) {
  //       case "daily":
  //         currentStart = currentStart.add(1, "day");
  //         currentEnd = currentEnd.add(1, "day");
  //         break;
  //       case "weekly":
  //         currentStart = currentStart.add(1, "week");
  //         currentEnd = currentEnd.add(1, "week");
  //         break;
  //       case "monthly":
  //         currentStart = currentStart.add(1, "month");
  //         currentEnd = currentEnd.add(1, "month");
  //         break;
  //       default:
  //         break;
  //     }
  //   }

  //   return events;
  // };

  // การลากและย้ายอีเวนต์
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
              onSelectEvent={(event) => handleOpenModal(event)} // สำหรับแก้ไข
              onSelectSlot={
                ({ start, end }) => handleOpenModal(null, start, end) // สำหรับเพิ่ม
              }
              onEventDrop={handleEventDrop}
            />
          </div>
        </Content>
      </Layout>

      {/* Modal สำหรับเพิ่ม/แก้ไขอีเวนต์ */}
      <Modal
        title={currentEvent ? "Edit Event" : "Add Event"} // ใช้ currentEvent เพื่อตัดสินใจ
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
            name="Teacher"
            rules={[{ required: true, message: "Please select a teacher" }]}
          >
            <Select placeholder="Select a teacher">
              <Select.Option value="John Doe">John Doe</Select.Option>
              <Select.Option value="Jane Smith">Jane Smith</Select.Option>
              <Select.Option value="Michael Brown">Michael Brown</Select.Option>
            </Select>
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
          {/* <Form.Item label="Repeat" name="repeatType" initialValue="none">
            <Select
              onChange={(value) => {
                if (value === "custom") {
                  setIsRecurringModalOpen(true); // เปิด Modal การตั้งค่าการทำซ้ำ
                }
              }}
            >
              <Select.Option value="none">No Repeat</Select.Option>
              <Select.Option value="custom">Custom Repeat</Select.Option>
            </Select>
          </Form.Item> */}

          {/* แสดงรายละเอียดการทำซ้ำ */}
          {/* {recurrenceDetails && (
            <div>
              <p>
                <strong>Repeat Details:</strong> {recurrenceDetails}
              </p>
            </div>
          )} */}
        </Form>
      </Modal>
      {/* <Modal
        title="Set Recurrence"
        visible={isRecurringModalOpen}
        onCancel={() => setIsRecurringModalOpen(false)}
        onOk={() => {
          setIsRecurringModalOpen(false);
          setRecurrenceDetails(generateRecurrenceDetails()); // แสดงรายละเอียดที่ตั้งค่า
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Repeat Every">
            <Input.Group compact>
              <Input
                style={{ width: "30%" }}
                placeholder="1"
                value={repeatFrequency}
                onChange={(e) => setRepeatFrequency(e.target.value)}
              />
              <Select
                style={{ width: "70%" }}
                value={repeatInterval}
                onChange={(value) => setRepeatInterval(value)}
              >
                <Select.Option value="day">Day(s)</Select.Option>
                <Select.Option value="week">Week(s)</Select.Option>
                <Select.Option value="month">Month(s)</Select.Option>
              </Select>
            </Input.Group>
          </Form.Item>

          <Form.Item label="Repeat On (for Weekly)">
            <Checkbox.Group
              options={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
              value={repeatOnDays}
              onChange={(checkedValues) => setRepeatOnDays(checkedValues)}
            />
          </Form.Item>

          <Form.Item label="Ends">
            <Radio.Group
              onChange={(e) => setRepeatEnds(e.target.value)}
              value={repeatEnds}
            >
              <Radio value="never">Never</Radio>
              <Radio value="onDate">
                On Date
                {repeatEnds === "onDate" && (
                  <Input
                    type="date"
                    style={{ marginLeft: 10 }}
                    value={repeatEndDate}
                    onChange={(e) => setRepeatEndDate(e.target.value)}
                  />
                )}
              </Radio>
              <Radio value="afterOccurrences">
                After
                {repeatEnds === "afterOccurrences" && (
                  <Input
                    type="number"
                    style={{ marginLeft: 10, width: "60px" }}
                    value={repeatOccurrences}
                    onChange={(e) => setRepeatOccurrences(e.target.value)}
                  />
                )}
                Occurrences
              </Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal> */}
    </Layout>
  );
};

export default Schedule;

import {
  Layout,
  Modal,
  Input,
  Form,
  Button,
  Select,
  message,
  ColorPicker,
  DatePicker,
  Space,
  Typography,
  Tag,
  Table,
  Popconfirm,
  Collapse,
  Tabs,
  Card,
} from "antd";
import { SearchOutlined, DownloadOutlined, CalendarOutlined } from "@ant-design/icons";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { useState, useEffect } from "react";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import dayjs from "dayjs";
import locale from "antd/es/date-picker/locale/th_TH";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/Course.css";
import "../../styles/Calendar.css";
import { getCourses } from "../../services/courseService";
import classService from "../../services/classService";
import reservationService from "../../services/reservationService";
import { getUsers } from "../../services/userService";
import {
  CopyOutlined,
  PlusOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const DragAndDropCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

const Schedule = () => {
  const [instructorType, setInstructorType] = useState(null);
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [form] = Form.useForm();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);

  // States for historical data
  const [dateRange, setDateRange] = useState(null);
  const [historicalSearchText, setHistoricalSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");

  // Get user role from localStorage for permission control
  const userRole = localStorage.getItem("role");

  // Define permissions based on role
  const canCreateClass = userRole === "SuperAdmin" || userRole === "Admin";
  const canEditClass = userRole === "SuperAdmin" || userRole === "Admin";
  const canDeleteClass = userRole === "SuperAdmin" || userRole === "Admin";
  const canDuplicateClass = userRole === "SuperAdmin" || userRole === "Admin";
  const canManageReservations = userRole === "SuperAdmin" || userRole === "Admin";
  const canViewOnly = userRole === "Accounting";
  // 📌 โหลดข้อมูลคอร์สและคลาสทั้งหมด
  useEffect(() => {
    fetchData();
    fetchReservations();
    fetchMembers();
  }, []);

  const fetchData = async () => {
    try {
      const courseData = await getCourses();
      setCourses(courseData.courses);

      const classData = await classService.getAllClasses();

      const userData = await getUsers();
      const instructors = userData.users.filter(
        (user) => user.role_id === "Instructor"
      );
      setUsers(instructors);

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
        participants: cls.participants || [],
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Fetch all reservations
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationService.getAllReservations();
      if (response && response.reservations) {
        setReservations(response.reservations);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      message.error("Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all members
  const fetchMembers = async () => {
    try {
      const userData = await getUsers();
      const memberUsers = userData.users.filter(
        (user) => user.role_id === "Member"
      );
      setMembers(memberUsers);
    } catch (error) {
      console.error("Error fetching members:", error);
      message.error("Failed to load members");
    }
  };

  // Handle opening reservation modal
  const handleOpenReservationModal = () => {
    if (!canManageReservations) {
      message.warning("You don't have permission to create reservations.");
      return;
    }
    setSelectedClass(null);
    setSelectedMember(null);
    setIsReservationModalOpen(true);
  };

  // Handle creating reservation
  const handleCreateReservation = async () => {
    if (!selectedClass || !selectedMember) {
      message.warning("Please select both a class and a member");
      return;
    }

    try {
      await reservationService.adminCreateReservation(
        selectedClass,
        selectedMember
      );
      message.success("Reservation created successfully!");
      setIsReservationModalOpen(false);
      setSelectedClass(null);
      setSelectedMember(null);
      // Refresh data
      fetchReservations();
      fetchData();
    } catch (error) {
      console.error("Error creating reservation:", error);
      message.error(
        error.message || "Failed to create reservation. Please try again."
      );
    }
  };

  // Handle reservation cancellation using the admin endpoint
  const handleCancelReservation = async (reservationId) => {
    if (!canManageReservations) {
      message.warning("You don't have permission to manage reservations.");
      return;
    }

    try {
      await reservationService.adminCancelReservation(reservationId);
      message.success("Reservation cancelled successfully");
      // Refresh data
      fetchReservations();
      fetchData();
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      message.error(
        "Failed to cancel reservation: " + (error.message || "Unknown error")
      );
    }
  };

  // 📌 เปิด Modal เพื่อเพิ่มหรือแก้ไขคลาส
  const handleOpenModal = (event = null, start = null, end = null) => {
    if (canViewOnly) {
      message.warning("You don't have permission to modify classes.");
      return;
    }

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
    setDuplicateDates([]); // รีเซ็ตวันที่ที่เลือกเมื่อเปิด Modal ใหม่
    setSelectedDate(null);
  };

  // 📌 ปิด Modal และโหลดข้อมูลใหม่
  const handleCloseModal = async () => {
    setIsModalOpen(false);
    await fetchData();
    form.resetFields();
    setIsDuplicating(false);
    setDuplicateDates([]);
    setSelectedDate(null);
  };

  // 📌 เพิ่มหรือแก้ไขคลาส
  const handleSubmit = async () => {
    if (!canCreateClass && !canEditClass) {
      message.warning("You don't have permission to modify classes.");
      return;
    }

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
        if (!canEditClass) {
          message.warning("You don't have permission to edit classes.");
          return;
        }
        await classService.updateClass(currentEvent.id, classData);
        message.success("Class updated successfully!");
      } else {
        if (!canCreateClass) {
          message.warning("You don't have permission to create classes.");
          return;
        }
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
    if (!canDeleteClass) {
      message.warning("You don't have permission to delete classes.");
      return;
    }

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
    if (!canEditClass) {
      message.warning("You don't have permission to reschedule classes.");
      return;
    }

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

  // เก็บข้อมูลวันที่ที่ต้องการทำซ้ำ
  const [duplicateDates, setDuplicateDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // 📌 เพิ่มวันที่ที่ต้องการทำซ้ำ
  const addDuplicateDate = () => {
    if (!selectedDate) {
      message.warning("กรุณาเลือกวันที่");
      return;
    }

    // ตรวจสอบว่าวันที่ซ้ำหรือไม่
    const dateString = selectedDate.format("YYYY-MM-DD");
    if (
      duplicateDates.some((date) => date.format("YYYY-MM-DD") === dateString)
    ) {
      message.warning("วันที่นี้ถูกเลือกไว้แล้ว");
      return;
    }

    setDuplicateDates([...duplicateDates, selectedDate]);
    setSelectedDate(null); // รีเซ็ตการเลือกวันที่
  };

  // 📌 ลบวันที่ที่ต้องการทำซ้ำ
  const removeDuplicateDate = (dateToRemove) => {
    setDuplicateDates(
      duplicateDates.filter(
        (date) =>
          date.format("YYYY-MM-DD") !== dateToRemove.format("YYYY-MM-DD")
      )
    );
  };

  // 📌 ทำซ้ำคลาสตามวันที่ที่เลือก
  const handleDuplicateEvent = async () => {
    if (!canDuplicateClass) {
      message.warning("You don't have permission to duplicate classes.");
      return;
    }

    try {
      if (!currentEvent || duplicateDates.length === 0) {
        message.warning("กรุณาเลือกวันที่สำหรับการทำซ้ำคลาสอย่างน้อย 1 วัน");
        return;
      }

      // เวลาของคลาสต้นฉบับ
      const originalDate = dayjs(currentEvent.start);
      const originalHour = originalDate.hour();
      const originalMinute = originalDate.minute();

      // คำนวณความยาวเวลาของคลาส (หน่วยเป็นนาที)
      const classDurationMinutes = dayjs(currentEvent.end).diff(
        originalDate,
        "minute"
      );

      // สร้างคลาสสำหรับแต่ละวันที่เลือก
      for (const date of duplicateDates) {
        // สร้างวันที่และเวลาใหม่
        const newStartDate = date.hour(originalHour).minute(originalMinute);

        // คำนวณเวลาสิ้นสุด
        const newEndDate = newStartDate.add(classDurationMinutes, "minute");

        // ส่งข้อมูลไปสร้างคลาสใหม่
        await classService.duplicateClass(currentEvent.id, {
          start_time: newStartDate.toISOString(),
          end_time: newEndDate.toISOString(),
        });
      }

      message.success(`ทำซ้ำคลาสสำเร็จ ${duplicateDates.length} วัน`);
      await handleCloseModal();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการทำซ้ำคลาส");
      console.error(error);
    }
  };

  // Generate data source for upcoming reservations table
  const getReservationsDataSource = () => {
    if (!reservations || reservations.length === 0) return [];

    const today = moment().startOf('day'); // วันปัจจุบันเวลา 00:00:00

    return reservations
      .filter((r) => r.status === "Reserved") // Only show active reservations
      .filter((r) => {
        // Filter only from today onwards
        if (r.class_id && r.class_id.start_time) {
          const classDate = moment(r.class_id.start_time);
          return classDate.isSameOrAfter(today);
        }
        return false;
      })
      .filter((r) => {
        // If there's search text, filter by name
        if (searchText && r.user_id && r.user_id.first_name) {
          return r.user_id.first_name
            .toLowerCase()
            .includes(searchText.toLowerCase());
        }
        return true;
      })
      .map((reservation, index) => {
        const classInfo = reservation.class_id;
        const userData = reservation.user_id || {};

        // Format date and time if class info exists
        let date = "N/A";
        let startTime = "N/A";
        let endTime = "N/A";

        if (classInfo && classInfo.start_time) {
          date = moment(classInfo.start_time).format("DD/MM/YYYY");
          startTime = moment(classInfo.start_time).format("HH:mm");
        }

        if (classInfo && classInfo.end_time) {
          endTime = moment(classInfo.end_time).format("HH:mm");
        }

        return {
          key: index,
          id: reservation._id,
          className: classInfo ? classInfo.title : "N/A",
          date: date,
          startTime: startTime,
          endTime: endTime,
          instructor: classInfo ? classInfo.instructor : "N/A",
          userName: userData.first_name || "Unknown",
          userId: userData._id,
          reservationId: reservation._id,
          status: reservation.status,
        };
      });
  };

  // Generate data source for historical attendance
  const getHistoricalAttendanceDataSource = () => {
    if (!reservations || reservations.length === 0) return [];

    const today = moment().startOf('day');

    return reservations
      .filter((r) => {
        // Filter past classes only
        if (r.class_id && r.class_id.start_time) {
          const classDate = moment(r.class_id.start_time);
          return classDate.isBefore(today);
        }
        return false;
      })
      .filter((r) => {
        // Filter by date range if selected
        if (dateRange && dateRange.length === 2 && r.class_id && r.class_id.start_time) {
          const classDate = moment(r.class_id.start_time);
          const startDate = moment(dateRange[0].toDate()).startOf('day');
          const endDate = moment(dateRange[1].toDate()).endOf('day');
          return classDate.isSameOrAfter(startDate) && classDate.isSameOrBefore(endDate);
        }
        return true;
      })
      .filter((r) => {
        // Filter by search text (member name)
        if (historicalSearchText && r.user_id && r.user_id.first_name) {
          return r.user_id.first_name
            .toLowerCase()
            .includes(historicalSearchText.toLowerCase());
        }
        return true;
      })
      .map((reservation, index) => {
        const classInfo = reservation.class_id;
        const userData = reservation.user_id || {};

        let date = "N/A";
        let startTime = "N/A";
        let endTime = "N/A";

        if (classInfo && classInfo.start_time) {
          date = moment(classInfo.start_time).format("DD/MM/YYYY");
          startTime = moment(classInfo.start_time).format("HH:mm");
        }

        if (classInfo && classInfo.end_time) {
          endTime = moment(classInfo.end_time).format("HH:mm");
        }

        return {
          key: index,
          id: reservation._id,
          className: classInfo ? classInfo.title : "N/A",
          date: date,
          startTime: startTime,
          endTime: endTime,
          instructor: classInfo ? classInfo.instructor : "N/A",
          userName: userData.first_name || "Unknown",
          userId: userData._id,
          reservationId: reservation._id,
          status: reservation.status,
        };
      });
  };

  // Export historical data to CSV
  const exportHistoricalData = () => {
    const data = getHistoricalAttendanceDataSource();

    if (data.length === 0) {
      message.warning("No data to export");
      return;
    }

    // Create CSV content
    const headers = ["Date", "Class", "Time", "Instructor", "Member", "Status"];
    const csvContent = [
      headers.join(","),
      ...data.map(row => [
        row.date,
        `"${row.className}"`,
        `${row.startTime} - ${row.endTime}`,
        `"${row.instructor}"`,
        `"${row.userName}"`,
        row.status
      ].join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_history_${moment().format("YYYY-MM-DD")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("Data exported successfully!");
  };

  const reservationsColumns = [
    {
      title: "Class",
      dataIndex: "className",
      key: "className",
      sorter: (a, b) => a.className.localeCompare(b.className),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => {
        if (a.date === "N/A" || b.date === "N/A") return 0;
        return moment(a.date, "DD/MM/YYYY").diff(moment(b.date, "DD/MM/YYYY"));
      },
    },
    {
      title: "Time",
      key: "time",
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: "Instructor",
      dataIndex: "instructor",
      key: "instructor",
      sorter: (a, b) => a.instructor.localeCompare(b.instructor),
    },
    {
      title: "Member",
      dataIndex: "userName",
      key: "userName",
      sorter: (a, b) => a.userName.localeCompare(b.userName),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Reserved" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) =>
        canManageReservations ? (
          <Popconfirm
            title="Cancel this reservation?"
            description="Are you sure you want to cancel this reservation? This will return the session to the member."
            icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
            onConfirm={() => handleCancelReservation(record.reservationId)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<CloseCircleOutlined />}
              disabled={record.status !== "Reserved"}
            >
              Cancel
            </Button>
          </Popconfirm>
        ) : (
          <Text type="secondary">View Only</Text>
        )
    },
  ];

  // Columns for historical attendance table
  const historicalColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => {
        if (a.date === "N/A" || b.date === "N/A") return 0;
        return moment(a.date, "DD/MM/YYYY").diff(moment(b.date, "DD/MM/YYYY"));
      },
      defaultSortOrder: "descend",
    },
    {
      title: "Class",
      dataIndex: "className",
      key: "className",
      sorter: (a, b) => a.className.localeCompare(b.className),
    },
    {
      title: "Time",
      key: "time",
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: "Instructor",
      dataIndex: "instructor",
      key: "instructor",
      sorter: (a, b) => a.instructor.localeCompare(b.instructor),
    },
    {
      title: "Member",
      dataIndex: "userName",
      key: "userName",
      sorter: (a, b) => a.userName.localeCompare(b.userName),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Reserved" ? "blue" : status === "Cancelled" ? "red" : "default"}>
          {status}
        </Tag>
      ),
    },
  ];

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
            {canViewOnly && (
              <div style={{ 
                marginTop: "8px", 
                padding: "8px 16px", 
                backgroundColor: "#fff3cd", 
                border: "1px solid #ffeaa7", 
                borderRadius: "4px",
                color: "#856404"
              }}>
                <Text>
                  <strong>Note:</strong> You have view-only access to this page. You can view class schedules and reservations but cannot make any modifications.
                </Text>
              </div>
            )}
          </div>
          <div style={{ padding: "16px" }}>
            <DragAndDropCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500, padding: "16px", borderRadius: "8px" }}
              selectable={!canViewOnly}
              resizable={!canViewOnly}
              onSelectEvent={(event) => {
                if (canViewOnly) {
                  // For Accounting, show event details in read-only mode
                  Modal.info({
                    title: `Class: ${event.title}`,
                    content: (
                      <div>
                        <p><strong>Instructor:</strong> {event.instructor}</p>
                        <p><strong>Room:</strong> {event.room_number}</p>
                        <p><strong>Start:</strong> {dayjs(event.start).format("DD/MM/YYYY HH:mm")}</p>
                        <p><strong>End:</strong> {dayjs(event.end).format("DD/MM/YYYY HH:mm")}</p>
                        <p><strong>Description:</strong> {event.description}</p>
                        {event.passcode && <p><strong>Passcode:</strong> {event.passcode}</p>}
                        {event.zoom_link && <p><strong>Zoom Link:</strong> {event.zoom_link}</p>}
                      </div>
                    ),
                    okText: "Close"
                  });
                } else {
                  handleOpenModal(event);
                }
              }}
              onSelectSlot={({ start, end }) => {
                if (!canViewOnly) {
                  handleOpenModal(null, start, end);
                }
              }}
              onEventDrop={canViewOnly ? undefined : handleEventDrop}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.color ? `#${event.color}` : "#789DBC",
                },
              })}
            />
          </div>

          {/* Reservations Management with Tabs */}
          <div style={{ padding: "16px", marginTop: "20px" }}>
            <Title level={4}>Reservation Management</Title>

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "upcoming",
                  label: (
                    <span>
                      <CalendarOutlined />
                      Upcoming Reservations
                    </span>
                  ),
                  children: (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <Input
                          placeholder="Search by member name"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          style={{ width: 300 }}
                          allowClear
                          prefix={<SearchOutlined />}
                        />
                        {canManageReservations && (
                          <Button
                            onClick={fetchReservations}
                            type="primary"
                            icon={<ReloadOutlined />}
                          >
                            Refresh
                          </Button>
                        )}
                      </div>
                      <Table
                        columns={reservationsColumns}
                        dataSource={getReservationsDataSource()}
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        size="middle"
                        scroll={{ x: "max-content" }}
                      />
                    </div>
                  ),
                },
                {
                  key: "history",
                  label: (
                    <span>
                      <CalendarOutlined />
                      Historical Attendance
                    </span>
                  ),
                  children: (
                    <div>
                      <Card style={{ marginBottom: "16px" }}>
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "12px",
                            }}
                          >
                            <Space wrap>
                              <RangePicker
                                value={dateRange}
                                onChange={setDateRange}
                                format="DD/MM/YYYY"
                                placeholder={["Start Date", "End Date"]}
                                style={{ width: 280 }}
                              />
                              <Input
                                placeholder="Search by member name"
                                value={historicalSearchText}
                                onChange={(e) => setHistoricalSearchText(e.target.value)}
                                style={{ width: 250 }}
                                allowClear
                                prefix={<SearchOutlined />}
                              />
                              <Button
                                onClick={() => {
                                  setDateRange(null);
                                  setHistoricalSearchText("");
                                }}
                              >
                                Clear Filters
                              </Button>
                            </Space>
                            <Button
                              type="primary"
                              icon={<DownloadOutlined />}
                              onClick={exportHistoricalData}
                            >
                              Export to CSV
                            </Button>
                          </div>
                          <Text type="secondary">
                            Showing {getHistoricalAttendanceDataSource().length} past attendance records
                          </Text>
                        </Space>
                      </Card>
                      <Table
                        columns={historicalColumns}
                        dataSource={getHistoricalAttendanceDataSource()}
                        loading={loading}
                        pagination={{
                          pageSize: 10,
                          showTotal: (total) => `Total ${total} records`,
                        }}
                        size="middle"
                        scroll={{ x: "max-content" }}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {/* Create Reservation Section */}
          {canManageReservations && (
            <div style={{ padding: "16px", marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <Title level={4}>Create Reservation for Member</Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenReservationModal}
                >
                  Create Reservation
                </Button>
              </div>
            </div>
          )}
        </Content>
      </Layout>

      {/* Modal for Creating Reservation */}
      <Modal
        title="Create Reservation for Member"
        open={isReservationModalOpen}
        onCancel={() => {
          setIsReservationModalOpen(false);
          setSelectedClass(null);
          setSelectedMember(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsReservationModalOpen(false);
              setSelectedClass(null);
              setSelectedMember(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleCreateReservation}
            disabled={!selectedClass || !selectedMember}
          >
            Create Reservation
          </Button>,
        ]}
      >
        <div style={{ marginBottom: "16px" }}>
          <Text type="secondary">
            Select a class and a member to create a reservation on their behalf.
            The member must have remaining sessions available.
          </Text>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <Title level={5}>Select Class</Title>
          <Select
            style={{ width: "100%" }}
            placeholder="Select a class"
            value={selectedClass}
            onChange={setSelectedClass}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={events
              .filter((event) => {
                // Only show future classes
                return new Date(event.start) > new Date();
              })
              .sort((a, b) => new Date(a.start) - new Date(b.start))
              .map((event) => ({
                label: `${event.title} - ${moment(event.start).format(
                  "DD/MM/YYYY HH:mm"
                )} (${event.instructor})`,
                value: event.id,
              }))}
          />
        </div>

        <div>
          <Title level={5}>Select Member</Title>
          <Select
            style={{ width: "100%" }}
            placeholder="Select a member"
            value={selectedMember}
            onChange={setSelectedMember}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={members
              .filter((member) => member.remaining_session > 0)
              .map((member) => ({
                label: `${
                  member.nickname
                    ? `${member.nickname} ${member.first_name}`
                    : member.first_name
                } ${member.last_name} (${member.remaining_session} sessions)`,
                value: member._id,
              }))}
          />
          {selectedMember && (
            <div style={{ marginTop: "8px" }}>
              <Text type="secondary">
                {(() => {
                  const member = members.find((m) => m._id === selectedMember);
                  if (member) {
                    return `Remaining sessions: ${member.remaining_session}${
                      member.sessions_expiry_date
                        ? ` | Expires: ${moment(
                            member.sessions_expiry_date
                          ).format("DD/MM/YYYY")}`
                        : ""
                    }`;
                  }
                  return "";
                })()}
              </Text>
            </div>
          )}
        </div>
      </Modal>

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
          currentEvent && canDuplicateClass && (
            <Button
              key="duplicate"
              onClick={() => setIsDuplicating(!isDuplicating)}
              icon={<CopyOutlined />}
            >
              {isDuplicating ? "กลับไปแก้ไข" : "ทำซ้ำคลาส"}
            </Button>
          ),
          currentEvent && !isDuplicating && canDeleteClass && (
            <Button key="delete" danger onClick={handleDeleteEvent}>
              Delete
            </Button>
          ),
          <Button key="cancel" onClick={handleCloseModal}>
            {canViewOnly ? "Close" : "Cancel"}
          </Button>,
          !canViewOnly && (isDuplicating ? (
            <Button
              key="duplicate-confirm"
              type="primary"
              onClick={handleDuplicateEvent}
              disabled={duplicateDates.length === 0}
            >
              ทำซ้ำคลาส
            </Button>
          ) : (
            <Button key="submit" type="primary" onClick={handleSubmit}>
              {currentEvent ? "Save" : "Add"}
            </Button>
          )),
        ].filter(Boolean)}
      >
        {isDuplicating && currentEvent ? (
          <div className="duplication-form">
            <div style={{ marginBottom: 20 }}>
              <Title level={5}>
                ทำซ้ำคลาส &quot;{currentEvent.title}&quot;
              </Title>
              <Text>
                วันที่ต้นฉบับ: {dayjs(currentEvent.start).format("DD/MM/YYYY")}
              </Text>
              <Text style={{ display: "block", marginTop: 5 }}>
                เวลา: {dayjs(currentEvent.start).format("HH:mm")} -{" "}
                {dayjs(currentEvent.end).format("HH:mm")} น.
              </Text>
            </div>

            <div style={{ marginTop: 20 }}>
              <Title level={5}>เลือกวันที่ต้องการทำซ้ำ</Title>

              <Space
                direction="vertical"
                style={{ width: "100%", marginBottom: 20 }}
              >
                <div style={{ display: "flex", gap: 10 }}>
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    locale={locale}
                    format="DD/MM/YYYY"
                    placeholder="เลือกวันที่"
                    style={{ width: "100%" }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={addDuplicateDate}
                    disabled={!selectedDate}
                  >
                    เพิ่ม
                  </Button>
                </div>
              </Space>

              {duplicateDates.length > 0 && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 10,
                    background: "#f0f7ff",
                    borderRadius: 4,
                    maxHeight: "150px",
                    overflowY: "auto",
                  }}
                >
                  <div style={{ marginBottom: 10 }}>
                    <Text strong>
                      วันที่ทำซ้ำ ({duplicateDates.length} วัน):
                    </Text>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {duplicateDates
                      .sort((a, b) => a.diff(b)) // เรียงลำดับตามวันที่
                      .map((date, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => removeDuplicateDate(date)}
                          style={{ margin: "4px 0" }}
                        >
                          {date.format("DD/MM/YYYY")}
                        </Tag>
                      ))}
                  </div>
                </div>
              )}
            </div>
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

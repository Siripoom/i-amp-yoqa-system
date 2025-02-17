import { Button, Card, Modal, Typography, message } from "antd";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { useState, useEffect } from "react";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const { Title } = Typography;
const localizer = momentLocalizer(moment);

const Myplane = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ข้อมูลคอร์สที่ถูกลงทะเบียนไว้
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "MEDITATION YOGA (M)",
      start: new Date(2025, 1, 12),
      end: new Date(2025, 1, 12),
      instructor: "John Doe",
      description:
        "โยคะสายปรับสมุดล สายสมาธิ คลายความเครียด ลดความกังวล กำหนดลมหายใจ ให้เวลาเรียนรู้ร่างกายเหมาะกับผู้ฝึกใหม่ขึ้นไป",
      reserved: false,
      zoomLink: "https://zoom.us/webinar/web-dev-basics",
    },
  ]);

  // สำหรับ Modal แสดงรายละเอียดคอร์ส
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ฟังก์ชันเปิด Modal พร้อมแสดงรายละเอียดคอร์ส
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // ฟังก์ชันปิด Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // ฟังก์ชันสำหรับจองคอร์ส
  const handleReserveCourse = () => {
    if (selectedEvent) {
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id ? { ...event, reserved: true } : event
        )
      );

      message.success("Reservation successful! ✅");

      // ปิด Modal และบังคับให้อัปเดต UI
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedEvent(null);
      }, 300);
    }
  };

  // กำหนดสีของอีเวนต์ตามสถานะ (จองแล้วหรือยังไม่จอง)
  const eventPropGetter = (event) => {
    const style = {
      backgroundColor: event.reserved ? "#52c41a" : "#1890ff", // สีเขียวเมื่อจองแล้ว
      color: "white",
      borderRadius: "4px",
      border: "none",
      padding: "4px",
    };
    return { style };
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b"
      style={{
        background:
          "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
      }}
    >
      {/* Navbar อยู่ด้านบน */}
      <Navbar />

      {/* Container หลัก */}
      <div className="flex-grow flex items-center justify-center mt-4 mb-4">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start justify-center">
          {/* Sidebar */}
          <Card className="w-full lg:w-1/4 p-6 rounded-2xl shadow-lg bg-white">
            <Title level={4} className="text-black font-semibold">
              Manage My Account
            </Title>
            <div className="mt-4 space-y-3 flex flex-col">
              <Link
                to="/profile"
                className=" text-gray-400  cursor-pointer block"
              >
                My Profile
              </Link>
              <Link
                to="/my-plane"
                className="text-purple-600 font-semibold cursor-pointer block"
              >
                My Plane
              </Link>
              <Link
                to="/my-orders"
                className="text-black font-bold cursor-pointer block"
              >
                My Orders
              </Link>
            </div>
          </Card>

          {/* Calendar ที่แสดงข้อมูลคอร์ส */}
          <Card className="w-full lg:w-3/4 p-8 lg:ml-6 mt-6 lg:mt-0 rounded-2xl shadow-md">
            <Title level={3} className="text-purple-700">
              My Course Schedule
            </Title>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500, padding: "10px", borderRadius: "8px" }}
              onSelectEvent={handleEventClick} // คลิกที่อีเวนต์เพื่อดูรายละเอียด
              eventPropGetter={eventPropGetter} // เปลี่ยนสีของอีเวนต์เมื่อจองแล้ว
            />
          </Card>
        </div>
      </div>

      {/* Modal แสดงรายละเอียดคอร์ส */}
      <Modal
        title="Course Details"
        visible={isModalOpen}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Close
          </Button>,
          !selectedEvent?.reserved && (
            <Button
              key="reserve"
              type="primary"
              className="bg-purple-600 text-white"
              onClick={handleReserveCourse}
            >
              Reserve Course
            </Button>
          ),
        ]}
      >
        {selectedEvent && (
          <div>
            <Title level={4}>{selectedEvent.title}</Title>
            <p>
              <strong>Instructor:</strong> {selectedEvent.instructor}
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {moment(selectedEvent.start).format("MMMM Do YYYY, h:mm A")} -{" "}
              {moment(selectedEvent.end).format("h:mm A")}
            </p>
            <p>
              <strong>Description:</strong> {selectedEvent.description}
            </p>

            {/* แสดงลิงก์เข้า Zoom ถ้าจองแล้ว */}
            {selectedEvent.reserved && (
              <p>
                <strong>Zoom Link:</strong>{" "}
                <a
                  href={selectedEvent.zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Join Zoom Class
                </a>
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Myplane;

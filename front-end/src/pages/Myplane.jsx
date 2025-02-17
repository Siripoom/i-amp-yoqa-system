import { Button, Card, Typography, message } from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const { Title } = Typography;

const Myplane = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ข้อมูลคอร์สที่ลงทะเบียนไว้
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "MEDITATION YOGA (M)",
      date: new Date(2025, 1, 12),
      instructor: "John Doe",
      description:
        "โยคะสายปรับสมดุล สายสมาธิ คลายความเครียด ลดความกังวล กำหนดลมหายใจ",
      reserved: false,
      zoomLink: "https://zoom.us/webinar/web-dev-basics",
      roomNumber: "101", // เพิ่มหมายเลขห้อง
      passcode: "YOGA2025", // เพิ่มรหัสผ่าน
    },
    {
      id: 2,
      title: "HATHA YOGA (H)",
      date: new Date(2025, 1, 15),
      instructor: "Jane Smith",
      description:
        "โยคะที่เหมาะสำหรับทุกคน เน้นการยืดเหยียดและความสมดุลของร่างกาย",
      reserved: false,
      zoomLink: "https://zoom.us/hatha-yoga-class",
      roomNumber: "203", // หมายเลขห้อง
      passcode: "HATHA2025", // รหัสผ่าน
    },
  ]);

  // ฟังก์ชันสำหรับจองคอร์ส
  const handleReserveCourse = (id) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === id ? { ...event, reserved: true } : event
      )
    );
    message.success("จองคอร์สสำเร็จ! ✅");
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b"
      style={{
        background:
          "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
      }}
    >
      {/* Navbar */}
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
                className=" text-gray-400 cursor-pointer block"
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
                className="text-gray-400 cursor-pointer block"
              >
                My Orders
              </Link>
            </div>
          </Card>

          {/* คอร์สที่ลงทะเบียน */}
          <div className="w-full lg:w-3/4 p-8 lg:ml-6 mt-6 lg:mt-0 rounded-2xl shadow-md bg-white">
            <Title level={3} className="text-purple-700">
              My Course Schedule
            </Title>

            {/* แสดงคอร์สในรูปแบบ Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="p-4 rounded-lg shadow-md"
                  title={event.title}
                  extra={
                    event.reserved ? (
                      <span className="text-green-500 font-semibold">
                        จองแล้ว ✅
                      </span>
                    ) : (
                      <Button
                        type="primary"
                        className="bg-purple-600 text-white"
                        onClick={() => handleReserveCourse(event.id)}
                      >
                        Reserve Course
                      </Button>
                    )
                  }
                >
                  <p>
                    <strong>Instructor:</strong> {event.instructor}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {moment(event.date).format("MMMM Do YYYY")}
                  </p>
                  <p>
                    <strong>Description:</strong> {event.description}
                  </p>

                  {/* แสดง Room Number และ Passcode ถ้าจองแล้ว */}
                  {event.reserved && (
                    <>
                      <p>
                        <strong>📌 Room Number:</strong>{" "}
                        <span className="text-purple-600">
                          {event.roomNumber}
                        </span>
                      </p>
                      <p>
                        <strong>🔑 Passcode:</strong>{" "}
                        <span className="text-purple-600">
                          {event.passcode}
                        </span>
                      </p>
                      <p>
                        <strong>🔗 Zoom Link:</strong>{" "}
                        <a
                          href={event.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Join Zoom Class
                        </a>
                      </p>
                    </>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Myplane;

import { Button, Card, Typography, message } from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import classService from "../services/classService";
import reservationService from "../services/reservationService";

const { Title } = Typography;

const Myplane = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("user_id"); // ✅ ดึง user_id จาก localStorage

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        // ✅ ดึงข้อมูลคอร์สทั้งหมด และข้อมูลการจองของผู้ใช้
        const [classResponse, reservationResponse] = await Promise.all([
          classService.getAllClasses(),
          userId
            ? reservationService.getUserReservations(userId)
            : Promise.resolve({ data: [] }),
        ]);

        if (classResponse.status === "success") {
          const reservedClassIds = new Set(
            reservationResponse.data.map((res) => res.class_id)
          );

          setEvents(
            classResponse.data.map((event) => ({
              id: event._id,
              title: event.title,
              date: new Date(event.start_time),
              instructor: event.instructor,
              description: event.description,
              reserved: reservedClassIds.has(event._id), // ✅ เช็คว่าคลาสถูกจองหรือไม่
              zoomLink: event.zoom_link,
              roomNumber: event.room_number,
              passcode: event.passcode,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        message.error("ไม่สามารถโหลดข้อมูลคอร์สได้ ❌");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [userId]);

  // ✅ ฟังก์ชันสำหรับจองคอร์ส
  const handleReserveCourse = async (classId) => {
    if (!userId) {
      message.error("กรุณาเข้าสู่ระบบก่อนทำการจอง ❌");
      return;
    }

    try {
      const reservationData = { user_id: userId, class_id: classId };
      const response = await reservationService.createReservation(
        reservationData
      );

      if (response) {
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === classId ? { ...event, reserved: true } : event
          )
        );
        message.success("✅ จองคอร์สสำเร็จ! ตรวจสอบรายละเอียดใน My Plane.");
      } else {
        message.error("❌ เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Error reserving class:", error);
      message.error("❌ จองคอร์สไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b"
      style={{
        background:
          "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
      }}
    >
      <Navbar />
      <div className="flex-grow flex items-center justify-center mt-4 mb-4">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start justify-center">
          <Card className="w-full lg:w-1/4 p-6 rounded-2xl shadow-lg bg-white">
            <Title level={4} className="text-black font-semibold">
              Manage My Account
            </Title>
            <div className="mt-4 space-y-3 flex flex-col">
              <Link
                to="/profile"
                className="text-gray-400 cursor-pointer block"
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

          <div className="w-full lg:w-3/4 p-8 lg:ml-6 mt-6 lg:mt-0 rounded-2xl shadow-md bg-white">
            <Title level={3} className="text-purple-700">
              My Course Schedule
            </Title>

            {loading ? (
              <p className="text-center text-gray-500">
                กำลังโหลดข้อมูลคอร์ส...
              </p>
            ) : events.length === 0 ? (
              <p className="text-center text-gray-500">
                ไม่มีคอร์สที่สามารถจองได้
              </p>
            ) : (
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

                    {event && (
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
                          <strong>🔗 Zoom Link:</strong>
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
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Myplane;

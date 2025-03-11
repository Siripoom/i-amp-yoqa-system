import { Button, Card, Typography, message } from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import reservationService from "../services/reservationService";
import classService from "../services/classService";

const { Title } = Typography;

const Booking = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("user_id"); // ดึง user_id จาก localStorage

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        console.log("📡 Fetching all classes...");
        const [classResponse, reservationResponse] = await Promise.all([
          classService.getAllClasses(),
          userId
            ? reservationService.getUserReservations(userId)
            : Promise.resolve({ data: [] }),
        ]);

        console.log("✅ Class Response:", classResponse);
        console.log("✅ Reservation Response:", reservationResponse);

        // ตรวจสอบว่ามี data จริงหรือไม่
        if (
          !classResponse ||
          !classResponse.data ||
          !Array.isArray(classResponse.data)
        ) {
          console.error("❌ API ไม่ส่งข้อมูลที่ถูกต้องกลับมา:", classResponse);
          message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลคอร์ส ❌");
          return;
        }

        const reservedClassIds = new Set(
          reservationResponse.data?.map((res) => res.class_id) || []
        );

        setEvents(
          classResponse.data
            .map((event) => ({
              id: event._id,
              title: event.title,
              date: new Date(event.start_time),
              endDate: new Date(event.end_time),
              instructor: event.instructor,
              description: event.description,
              reserved: reservedClassIds.has(event._id),
              zoomLink: event.zoom_link,
              roomNumber: event.room_number,
              passcode: event.passcode,
            }))
            .sort((a, b) => b.date - a.date)
        );
      } catch (error) {
        console.error("❌ Error fetching classes:", error);
        message.error("ไม่สามารถโหลดข้อมูลคอร์สได้ ❌");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [userId]);

  // ฟังก์ชันจองคอร์ส
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
        <div className="w-full max-w-5xl p-8 rounded-2xl shadow-md bg-white">
          <Title level={3} className="text-purple-700">
            Course Booking
          </Title>

          {loading ? (
            <p className="text-center text-gray-500">กำลังโหลดข้อมูลคอร์ส...</p>
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
                  // extra={
                  //   event.reserved ? (
                  //     <span className="text-green-500 font-semibold">
                  //       จองแล้ว ✅
                  //     </span>
                  //   ) : userId ? (
                  //     <Button
                  //       type="primary"
                  //       className="bg-purple-600 text-white"
                  //       onClick={() => handleReserveCourse(event.id)}
                  //     >
                  //       Reserve Course
                  //     </Button>
                  //   ) : (
                  //     <span className="text-gray-500 font-semibold">
                  //       {/* 🔒 ต้องเข้าสู่ระบบเพื่อจอง */}
                  //     </span>
                  //   )
                  // }
                >
                  <p>
                    <strong>Instructor:</strong> {event.instructor}
                  </p>
                  <p>
                    <strong>🕒 Start Time:</strong>{" "}
                    {moment(event.date).format("MMMM Do YYYY, HH:mm")}
                  </p>
                  <p>
                    <strong>⏳ End Time:</strong>{" "}
                    {moment(event.endDate).format("MMMM Do YYYY, HH:mm")}
                  </p>

                  <p>
                    <strong>Description:</strong> {event.description}
                  </p>
                  <p>
                    <strong>📌 Room Number:</strong>
                    <span className="text-purple-600"> {event.roomNumber}</span>
                  </p>
                  <p>
                    <strong>🔑 Passcode:</strong>
                    <span className="text-purple-600"> {event.passcode}</span>
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
                  {/* ✅ ขยับปุ่มลงมาไว้ล่างสุด */}
                  <div className="mt-4 text-center">
                    {event.reserved ? (
                      <span className="text-green-500 font-semibold">
                        จองแล้ว ✅
                      </span>
                    ) : userId ? (
                      <Button
                        type="primary"
                        className="bg-purple-600 text-white"
                        onClick={() => handleReserveCourse(event.id)}
                      >
                        Book now
                      </Button>
                    ) : (
                      <span className="text-gray-500 font-semibold">
                        🔒 ต้องเข้าสู่ระบบเพื่อจอง
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Booking;

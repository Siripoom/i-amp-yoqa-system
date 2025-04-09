import { Button, Card, Typography, message, Modal } from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import reservationService from "../services/reservationService";
import classService from "../services/classService";
import { jwtDecode } from "jwt-decode";

const { Title } = Typography;

const Booking = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState([]);
  const [reservations, setReservations] = useState([]); // เก็บข้อมูลการจองทั้งหมดของผู้ใช้
  const userId = localStorage.getItem("user_id");

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

        if (
          !classResponse ||
          !classResponse.data ||
          !Array.isArray(classResponse.data)
        ) {
          console.error("❌ API ไม่ส่งข้อมูลที่ถูกต้อง:", classResponse);
          message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลคอร์ส ❌");
          return;
        }

        // เก็บข้อมูลการจองทั้งหมดของผู้ใช้
        if (reservationResponse && reservationResponse.data) {
          setReservations(reservationResponse.data);
        }

        // สร้าง Set ของ class_id ที่ผู้ใช้จองแล้ว
        const reservedClassIds = new Set(
          reservationResponse.data?.map((res) => res.class_id) || []
        );

        // โหลดข้อมูลจาก LocalStorage เพื่อให้แน่ใจว่าแสดงสถานะการจองที่เก็บไว้
        const reservedClassesInLocalStorage =
          JSON.parse(localStorage.getItem("reservedClasses")) || [];

        // รวม class_id จากทั้ง API และ LocalStorage
        reservedClassesInLocalStorage.forEach((id) => reservedClassIds.add(id));

        setEvents(
          classResponse.data.map((event) => ({
            id: event._id,
            title: event.title,
            date: new Date(event.start_time),
            endDate: new Date(event.end_time),
            instructor: event.instructor,
            description: event.description,
            difficulty: event.difficulty,
            reserved: reservedClassIds.has(event._id),
            zoomLink: event.zoom_link,
            roomNumber: event.room_number,
            passcode: event.passcode,
            amount: event.amount,
            color: event.color,
            participants: event.participants,
          }))
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

  // ✅ ฟังก์ชันสำหรับจองคอร์ส
  const handleReserveCourse = async (classId) => {
    if (!userId) {
      message.error("กรุณาเข้าสู่ระบบก่อนทำการจอง ❌");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const fullName = `${decoded.first_name} ${decoded.last_name}`;

      const reservationData = { user_id: userId, class_id: classId };
      const response = await reservationService.createReservation(
        reservationData
      );

      if (response) {
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === classId
              ? {
                  ...event,
                  reserved: true,
                  amount: event.amount + 1,
                  participants: [...(event.participants || []), fullName],
                }
              : event
          )
        );

        const reservedClassIds =
          JSON.parse(localStorage.getItem("reservedClasses")) || [];
        localStorage.setItem(
          "reservedClasses",
          JSON.stringify([...reservedClassIds, classId])
        );

        setReservations((prev) => [
          ...prev,
          {
            _id: response._id || `temp-${Date.now()}`,
            user_id: userId,
            class_id: classId,
          },
        ]);

        handleShowDetails(classId);
        message.success("✅ จองคอร์สสำเร็จ!");
      } else {
        message.error("❌ เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Error reserving class:", error);
      message.error("❌ ไม่สามารถจองคลาสได้ กรุณาซื้อโปรโมชั่นก่อน");
    }
  };

  // ✅ ฟังก์ชันยกเลิกการจองคอร์ส
  const handleCancelReservation = async (classStartTime, classId) => {
    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);
    const fullName = `${decoded.first_name} ${decoded.last_name}`;

    try {
      const response = await reservationService.getUserReservations(
        decoded.userId
      );
      const reservations = response.reservations || [];

      const now = new Date();
      const fiveMinutesBeforeClass = new Date(classStartTime);
      fiveMinutesBeforeClass.setMinutes(
        fiveMinutesBeforeClass.getMinutes() - 5
      );

      if (now >= fiveMinutesBeforeClass) {
        Modal.error({
          title: "ไม่สามารถยกเลิกการจองได้",
          content: "เหลือน้อยกว่า 5 นาทีก่อนเริ่มคลาส",
        });
        return;
      }

      const reservation = reservations.find(
        (res) =>
          res.class_id &&
          res.class_id._id &&
          res.class_id._id.toString() === classId.toString()
      );

      if (!reservation || !reservation._id) {
        message.error("❌ ไม่พบข้อมูลการจอง");
        return;
      }

      await reservationService.cancelReservation(reservation._id);

      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === classId
            ? {
                ...event,
                reserved: false,
                amount: Math.max(0, event.amount - 1),
                participants: (event.participants || []).filter(
                  (name) => name !== fullName
                ),
              }
            : event
        )
      );

      const reservedClassIds =
        JSON.parse(localStorage.getItem("reservedClasses")) || [];
      localStorage.setItem(
        "reservedClasses",
        JSON.stringify(reservedClassIds.filter((id) => id !== classId))
      );

      setReservations((prev) =>
        prev.filter((res) => res.class_id && res.class_id._id !== classId)
      );

      setShowDetails((prev) => prev.filter((id) => id !== classId));

      message.success("✅ ยกเลิกการจองสำเร็จ");
    } catch (error) {
      console.error("❌ Error canceling reservation:", error);
      message.error("❌ เกิดข้อผิดพลาดในการยกเลิกการจอง");
    }
  };

  // ✅ ฟังก์ชันตรวจสอบว่าสามารถยกเลิกการจองได้หรือไม่ (เหลือเวลามากกว่า 5 นาทีก่อนเริ่มคลาส)
  const canCancelReservation = (classStartTime) => {
    const now = new Date();
    const fiveMinutesBeforeClass = new Date(classStartTime);
    fiveMinutesBeforeClass.setMinutes(fiveMinutesBeforeClass.getMinutes() - 5);
    return now < fiveMinutesBeforeClass;
  };

  // ✅ ฟังก์ชันแสดงรายละเอียดเมื่อกด "Book now"
  const handleShowDetails = (classId) => {
    setShowDetails((prev) =>
      prev.includes(classId) ? prev : [...prev, classId]
    );
  };

  // ✅ ฟังก์ชันตรวจสอบว่าควรแสดงรายละเอียดหรือไม่
  const shouldShowDetails = (event) => {
    return event.reserved || showDetails.includes(event.id);
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
            Class Booking
          </Title>
          ยกเลิกการจองคลาสได้ก่อนเริ่มคลาส 5 นาที
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
                  style={{
                    backgroundColor: event.color ? `#${event.color}` : "white",
                  }}
                >
                  <p>
                    <strong>ครูผู้สอน:</strong> {event.instructor}
                  </p>
                  <p>
                    <strong>🕒 เวลาเริ่มเรียน:</strong>{" "}
                    {moment(event.date)
                      .locale("th")
                      .format("DD MMMM YYYY, HH:mm")}
                  </p>
                  <p>
                    <strong>⏳ เวลาสิ้นสุด:</strong>{" "}
                    {moment(event.endDate)
                      .locale("th")
                      .format("DD MMMM YYYY, HH:mm")}
                  </p>
                  <p>
                    <strong>รายละเอียด:</strong> {event.description}
                  </p>
                  <p>
                    <strong>ระดับความยาก:</strong>{" "}
                    <span className="text-red-500 text-lg">
                      {"❤️".repeat(event.difficulty)}
                    </span>
                  </p>
                  <p>
                    <strong>จำนวนคนเข้าร่วม:</strong>{" "}
                    <span className="text-pink-500 text-lg">
                      {event.amount}
                    </span>
                  </p>
                  <p>
                    <strong>รายชื่อคนเข้าร่วม:</strong>{" "}
                    <span className="text-pink-500 text-sm">
                      {event.participants.join(", ")}
                    </span>
                  </p>

                  {/* ✅ แสดงข้อมูลเมื่อจองแล้วหรือกด Book now */}
                  {shouldShowDetails(event) && (
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

                  <div className="mt-4 text-center">
                    {event.reserved ? (
                      <div>
                        <span className="text-green-500 font-semibold block mb-2">
                          จองแล้ว ✅
                        </span>
                        {canCancelReservation(event.date, event.id) ? (
                          <Button
                            danger
                            onClick={() =>
                              handleCancelReservation(event.date, event.id)
                            }
                          >
                            ยกเลิกการจอง
                          </Button>
                        ) : (
                          <span className="text-red-500 text-sm block">
                            ไม่สามารถยกเลิกได้ (เหลือน้อยกว่า 5
                            นาทีก่อนเริ่มคลาส)
                          </span>
                        )}
                      </div>
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

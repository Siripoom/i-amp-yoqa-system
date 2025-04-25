import {
  Button,
  Card,
  Typography,
  message,
  Modal,
  Tag,
  Tooltip,
  Alert,
  Spin,
} from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "moment/locale/th"; // Import Thai locale
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import reservationService from "../services/reservationService";
import classService from "../services/classService";
import { getUserById } from "../services/userService";
import { jwtDecode } from "jwt-decode";
import { InfoCircleOutlined, LoadingOutlined, LoginOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const Booking = () => {
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const userId = localStorage.getItem("user_id");

  // ฟังก์ชันสำหรับดึงข้อมูลคลาสและการจอง
  // ฟังก์ชันสำหรับดึงข้อมูลคลาสและการจอง
  const fetchData = async () => {
    try {
      // ตรวจสอบว่ามี token หรือไม่
      const token = localStorage.getItem("token");
      if (!token || !userId) {
        setEvents([]);
        setReservations([]);
        setUserInfo(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // ดึงข้อมูลคลาส การจอง และข้อมูลผู้ใช้พร้อมกัน
      const [classResponse, reservationResponse, userResponse] =
        await Promise.all([
          classService.getAllClasses(),
          reservationService.getUserReservations(userId),
          getUserById(userId),
        ]);

      // ตรวจสอบว่ายังมีการล็อกอินอยู่หรือไม่ (อาจมีการล็อกเอาท์ระหว่างรอ API)
      if (!localStorage.getItem("token")) {
        setEvents([]);
        setReservations([]);
        setUserInfo(null);
        setLoading(false);
        return;
      }

      if (userResponse && userResponse.user) {
        setUserInfo(userResponse.user);
      } else {
        setUserInfo(null);
      }

      if (
        !classResponse ||
        !classResponse.data ||
        !Array.isArray(classResponse.data)
      ) {
        console.error("❌ API ไม่ส่งข้อมูลที่ถูกต้อง:", classResponse);
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูลคอร์ส ❌");
        setLoading(false);
        return;
      }

      // เก็บข้อมูลการจองทั้งหมด
      const userReservations = reservationResponse?.data || [];
      setReservations(userReservations);

      // สร้าง Set ของรหัสคลาสที่จองแล้ว (ใช้ข้อมูลจาก API เท่านั้น)
      const reservedClassIds = new Set(
        userReservations.map((res) => res.class_id) || []
      );

      // สร้างข้อมูลคลาสที่พร้อมแสดงผล
      setEvents(
        classResponse.data.map((event) => ({
          id: event._id,
          title: event.title,
          date: new Date(event.start_time),
          endDate: new Date(event.end_time),
          instructor: event.instructor,
          description: event.description,
          difficulty: event.difficulty,
          reserved: reservedClassIds.has(event._id), // ใช้ข้อมูลจาก API เท่านั้น
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

  // ดึงข้อมูลเมื่อ component โหลดหรือ userId เปลี่ยน
  useEffect(() => {
    if (userId) {
      fetchData();
    } else {
      // เมื่อไม่มี userId (ล็อกเอาท์แล้ว) ให้รีเซ็ตข้อมูลทั้งหมด
      setEvents([]);
      setReservations([]);
      setUserInfo(null);
      setShowDetails([]);
      setLoading(false);
    }
  }, [userId]);

  // ตรวจสอบว่าผู้ใช้สามารถจองคลาสได้หรือไม่
  const canBookClasses = () => {
    if (!userInfo) return false;

    const { remaining_session, sessions_expiry_date } = userInfo;

    // ตรวจสอบจำนวนการใช้งานที่เหลือ
    if (remaining_session <= 0) return false;

    // ตรวจสอบวันหมดอายุ
    if (
      sessions_expiry_date &&
      moment(sessions_expiry_date).isBefore(moment())
    ) {
      return false;
    }

    return true;
  };

  // แสดงวันหมดอายุแบบภาษาไทย
  const formatExpiryDate = (date) => {
    if (!date) return null;

    // ตั้งค่า moment ให้ใช้ภาษาไทย
    moment.locale("th");

    const expiryDate = moment(date).endOf("day");
    const now = moment().startOf("day");

    if (expiryDate.isBefore(now)) {
      return <Tag color="red">หมดอายุแล้ว</Tag>;
    }

    const daysLeft = expiryDate.diff(now, "days");

    // ใช้ปี พ.ศ. โดยเพิ่ม 543 เข้าไปในปี ค.ศ.
    const thaiDate =
      moment(date).format("D MMMM") +
      " " +
      (parseInt(moment(date).format("YYYY")) + 543);

    const text =
      daysLeft <= 7 ? `หมดอายุใน ${daysLeft} วัน` : `หมดอายุวันที่ ${thaiDate}`;

    return <Tag color={daysLeft <= 7 ? "warning" : "success"}>{text}</Tag>;
  };

  // แสดงข้อมูลคลาสที่เหลืออยู่
  const showSessionsInfo = () => {
    if (!userInfo) return null;

    let content = [];

    if (userInfo.remaining_session <= 0) {
      content.push(
        "You have no remaining sessions. Please purchase a new package."
      );
    } else {
      content.push(
        `You have ${userInfo.remaining_session} sessions remaining.`
      );
    }

    if (userInfo.sessions_expiry_date) {
      const expiryDate = moment(userInfo.sessions_expiry_date);
      const now = moment();

      if (expiryDate.isBefore(now)) {
        content.push(
          `Your sessions expired on ${expiryDate.format("DD MMM YYYY")}.`
        );
      } else {
        const daysLeft = expiryDate.diff(now, "days");
        content.push(
          `Your sessions will expire on ${expiryDate.format(
            "DD MMM YYYY"
          )} (${daysLeft} days left).`
        );
      }
    }

    Modal.info({
      title: "Your Session Information",
      content: (
        <div>
          {content.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </div>
      ),
      onOk() {},
    });
  };

  // จองคอร์ส
  const handleReserveCourse = async (classId) => {
    if (!userId) {
      message.error("กรุณาเข้าสู่ระบบก่อนทำการจอง ❌");
      return;
    }

    // ตรวจสอบว่าสามารถจองได้หรือไม่
    if (!canBookClasses()) {
      if (
        userInfo?.sessions_expiry_date &&
        moment(userInfo.sessions_expiry_date).isBefore(moment())
      ) {
        message.error("❌ คลาสของคุณหมดอายุแล้ว กรุณาซื้อโปรโมชั่นใหม่");
      } else if (userInfo?.remaining_session <= 0) {
        message.error("❌ คุณไม่มีจำนวนครั้งคงเหลือ กรุณาซื้อโปรโมชั่นใหม่");
      } else {
        message.error("❌ ไม่สามารถจองคลาสได้ กรุณาตรวจสอบสถานะการเป็นสมาชิก");
      }
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
        // อัปเดตสถานะคลาส
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

        // อัปเดตสถานะการจอง
        setReservations((prev) => [
          ...prev,
          {
            _id: response._id || `temp-${Date.now()}`,
            user_id: userId,
            class_id: classId,
          },
        ]);

        // รีเฟรชข้อมูลผู้ใช้เพื่อปรับปรุงจำนวนคลาสที่เหลือและวันหมดอายุ
        const userResponse = await getUserById(userId);
        if (userResponse && userResponse.user) {
          setUserInfo(userResponse.user);
        }

        handleShowDetails(classId);
        message.success("✅ จองคอร์สสำเร็จ!");
      } else {
        message.error("❌ เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Error reserving class:", error);

      // แสดงข้อความแจ้งเตือนที่เฉพาะเจาะจง
      if (error.message && error.message.includes("expired")) {
        message.error("❌ คลาสของคุณหมดอายุแล้ว กรุณาซื้อโปรโมชั่นใหม่");
      } else if (error.message && error.message.includes("session")) {
        message.error("❌ คุณไม่มีจำนวนครั้งคงเหลือ กรุณาซื้อโปรโมชั่นใหม่");
      } else {
        message.error("❌ ไม่สามารถจองคลาสได้ กรุณาลองใหม่");
      }
    }
  };

  // ยกเลิกการจอง
  const handleCancelReservation = async (classStartTime, classId) => {
    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);
    const fullName = `${decoded.first_name} ${decoded.last_name}`;

    try {
      // ดึงข้อมูลการจองจาก API
      const response = await reservationService.getUserReservations(
        decoded.userId
      );
      const reservations = response.reservations || [];

      const now = new Date();
      const fiveMinutesBeforeClass = new Date(classStartTime);
      fiveMinutesBeforeClass.setMinutes(
        fiveMinutesBeforeClass.getMinutes() - 5
      );

      // ตรวจสอบว่าสามารถยกเลิกการจองได้หรือไม่ (ก่อนเวลาเริ่มคลาส 5 นาที)
      if (now >= fiveMinutesBeforeClass) {
        Modal.error({
          title: "จองคลาสได้ตลอด",
          content:
            "สามารถยกเลิกการจองได้ก่อนเริ่มคลาส 5 นาที โซนเวลาเริ่มคลาสคำนวณจากประเทศไทยปรับเปลี่ยนไปตามโซนเวลาท้องถิ่นในแต่ละประเทศให้อัตโนมัติแล้วนะคะ",
        });
        return;
      }

      // หา reservation ที่ต้องการยกเลิก
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

      // ส่งคำขอยกเลิกการจองไปยัง API
      await reservationService.cancelReservation(reservation._id);

      // อัปเดตสถานะคลาส
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

      // อัปเดตสถานะการจอง
      setReservations((prev) =>
        prev.filter((res) => res.class_id && res.class_id._id !== classId)
      );

      // ปิดรายละเอียดคลาสที่ถูกยกเลิก
      setShowDetails((prev) => prev.filter((id) => id !== classId));

      // รีเฟรชข้อมูลผู้ใช้
      const userResponse = await getUserById(userId);
      if (userResponse && userResponse.user) {
        setUserInfo(userResponse.user);
      }

      message.success("✅ ยกเลิกการจองสำเร็จ");
    } catch (error) {
      console.error("❌ Error canceling reservation:", error);
      message.error("❌ เกิดข้อผิดพลาดในการยกเลิกการจอง");
    }
  };

  // ตรวจสอบว่าสามารถยกเลิกการจองได้หรือไม่
  const canCancelReservation = (classStartTime) => {
    const now = new Date();
    const fiveMinutesBeforeClass = new Date(classStartTime);
    fiveMinutesBeforeClass.setMinutes(fiveMinutesBeforeClass.getMinutes() - 5);
    return now < fiveMinutesBeforeClass;
  };

  // แสดงรายละเอียดเมื่อคลิก "จองคลาสนี้"
  const handleShowDetails = (classId) => {
    setShowDetails((prev) =>
      prev.includes(classId) ? prev : [...prev, classId]
    );
  };

  // ตรวจสอบว่าควรแสดงรายละเอียดหรือไม่
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
          <div className="flex justify-between items-center mb-4">
            <Title level={3} className="text-purple-700 mb-0">
              จองคลาสเรียน
            </Title>
          </div>

          {/* แบนเนอร์แสดงสถานะการหมดอายุ */}
          {userInfo && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Text>
                  คลาสคงเหลือ:{" "}
                  <strong>{userInfo.remaining_session || 0}</strong>
                </Text>
                {userInfo.sessions_expiry_date && (
                  <div className="ml-4">
                    {formatExpiryDate(userInfo.sessions_expiry_date)}
                  </div>
                )}
              </div>

              {userInfo.sessions_expiry_date &&
                moment(userInfo.sessions_expiry_date).isBefore(moment()) && (
                  <Alert
                    type="error"
                    message="คลาสของคุณหมดอายุแล้ว"
                    description="คุณไม่สามารถจองคลาสใหม่ได้จนกว่าจะซื้อแพ็คเกจใหม่"
                    showIcon
                  />
                )}

              {userInfo.sessions_expiry_date &&
                moment(userInfo.sessions_expiry_date).isAfter(moment()) &&
                moment(userInfo.sessions_expiry_date).diff(moment(), "days") <=
                  7 && (
                  <Alert
                    type="warning"
                    message="คลาสของคุณใกล้หมดอายุ"
                    description={`คลาสของคุณจะหมดอายุในวันที่ ${
                      moment(userInfo.sessions_expiry_date).format("D MMMM") +
                      " " +
                      (parseInt(
                        moment(userInfo.sessions_expiry_date).format("YYYY")
                      ) +
                        543)
                    }`}
                    showIcon
                  />
                )}

              {userInfo.remaining_session <= 0 && (
                <Alert
                  type="warning"
                  message="ไม่มีคลาสเหลือ"
                  description="คุณไม่มีคลาสคงเหลือ กรุณาซื้อแพ็คเกจใหม่"
                  showIcon
                />
              )}
            </div>
          )}

          <Text>
            จองคลาสได้ตลอด สามารถยกเลิกการจองได้ก่อนเริ่มคลาส 5 นาที
            &quot;โซนเวลาเริ่มคลาสคำนวณจากประเทศไทยปรับเปลี่ยนไปตามโซนเวลาท้องถิ่นในแต่ละประเทศให้อัตโนมัติแล้วนะคะ&quot;
          </Text>

          {loading ? (
            <div className="text-center py-8">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <p className="mt-2 text-gray-500">กำลังโหลดข้อมูลคอร์ส...</p>
            </div>
          ) : !userId ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg mt-4">
              <p className="text-gray-500 mb-4">กรุณาเข้าสู่ระบบเพื่อดูและจองคลาส</p>
              <Button type="primary" onClick={() => navigate("/auth/signin")}>
                เข้าสู่ระบบ
              </Button>
            </div>
          ) : events.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
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
                  <div className="mb-4 mt-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      {/* แสดงเวลาในรูปแบบ เวลาเริ่ม - เวลาจบ */}
                      <p className="text-xl font-bold text-purple-800 flex items-center justify-center mb-2">
                        <span className="text-2xl mr-2">🕒</span>
                        <span>
                          {moment(event.date).format("HH:mm")} -{" "}
                          {moment(event.endDate).format("HH:mm")} น.
                        </span>
                      </p>

                      {/* แสดงวันที่ในรูปแบบไทย */}
                      <p className="text-center text-pink-600 font-medium">
                        วันที่{" "}
                        {moment(event.date).locale("th").format("D MMMM ") +
                          (parseInt(moment(event.date).format("YYYY")) + 543)}
                      </p>
                    </div>
                  </div>
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
                      {event.participants && event.participants.length > 0
                        ? event.participants.join(", ")
                        : "ยังไม่มีผู้เข้าร่วม"}
                    </span>
                  </p>

                  {/* แสดงรายละเอียดเมื่อจองแล้วหรือหลังจากคลิก "จองคลาสนี้" */}
                  {shouldShowDetails(event) && (
                    <>
                      <p>
                        <strong>📌 ห้องเรียน:</strong>{" "}
                        <span className="text-purple-600">
                          {event.roomNumber}
                        </span>
                      </p>
                      <p>
                        <strong>🔑 รหัสผ่าน:</strong>{" "}
                        <span className="text-purple-600">
                          {event.passcode}
                        </span>
                      </p>
                      <p>
                        <strong>🔗 ลิงก์ Zoom:</strong>{" "}
                        <a
                          href={event.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          เข้าร่วมคลาสผ่าน Zoom
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
                        {canCancelReservation(event.date) ? (
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
                      <Tooltip
                        title={
                          !canBookClasses()
                            ? userInfo?.remaining_session <= 0
                              ? "คุณไม่มีจำนวนครั้งคงเหลือ กรุณาซื้อโปรโมชั่นใหม่"
                              : userInfo?.sessions_expiry_date &&
                                moment(userInfo.sessions_expiry_date).isBefore(
                                  moment()
                                )
                              ? "คลาสของคุณหมดอายุแล้ว กรุณาซื้อโปรโมชั่นใหม่"
                              : "ไม่สามารถจองคลาสได้"
                            : ""
                        }
                      >
                        <Button
                          type="primary"
                          className="bg-purple-600 text-white"
                          onClick={() => handleReserveCourse(event.id)}
                          disabled={!canBookClasses()}
                        >
                          จองคลาสนี้
                        </Button>
                      </Tooltip>
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
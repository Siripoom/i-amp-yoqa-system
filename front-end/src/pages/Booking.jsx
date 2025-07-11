import {
  Button,
  Card,
  Typography,
  message,
  Modal,
  Tag,
  Tooltip,
  Alert,
} from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "moment/locale/th";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import reservationService from "../services/reservationService";
import classService from "../services/classService";
import { getUserById } from "../services/userService";
import {
  validateAndGetUserFromToken,
  getUserFullName,
  isUserInParticipants,
} from "../utils/tokenUtils";
import { InfoCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const Booking = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // ตรวจสอบ token และดึงข้อมูลผู้ใช้
    const userFromToken = validateAndGetUserFromToken();
    if (userFromToken) {
      setCurrentUser(userFromToken);
      fetchData(userFromToken.userId);
    } else {
      // ยังไม่ล็อกอิน แต่ให้โหลดข้อมูลคลาสได้
      fetchData(null);
    }
  }, []);

  const fetchData = async (userId) => {
    try {
      setLoading(true);

      // ดึงข้อมูลคลาสและข้อมูลผู้ใช้พร้อมกัน
      const [classResponse, userResponse] = await Promise.all([
        classService.getAllClasses(),
        userId ? getUserById(userId) : Promise.resolve(null),
      ]);

      if (userResponse && userResponse.user) {
        setUserInfo(userResponse.user);
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

      // สร้างข้อมูลคลาสที่พร้อมแสดงผล
      const userFullName = getUserFullName();

      setEvents(
        classResponse.data.map((event) => {
          const participants = Array.isArray(event.participants)
            ? event.participants
            : [];

          // ใช้ฟังก์ชันใหม่ในการตรวจสอบ (เฉพาะเมื่อมี user)
          const isReserved = userFullName
            ? isUserInParticipants(participants, userFullName)
            : false;

          return {
            id: event._id,
            title: event.title,
            date: new Date(event.start_time),
            endDate: new Date(event.end_time),
            instructor: event.instructor,
            description: event.description,
            difficulty: event.difficulty,
            reserved: isReserved,
            zoomLink: event.zoom_link,
            roomNumber: event.room_number,
            passcode: event.passcode,
            amount: event.amount || 0,
            color: event.color,
            participants: participants,
          };
        })
      );
    } catch (error) {
      console.error("❌ Error fetching classes:", error);
      message.error("ไม่สามารถโหลดข้อมูลคอร์สได้ ❌");
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบว่าผู้ใช้สามารถจองคลาสได้หรือไม่
  const canBookClasses = () => {
    // ถ้าไม่ได้ล็อกอิน
    if (!userInfo || !currentUser) return false;

    const { remaining_session, sessions_expiry_date } = userInfo;

    if (remaining_session <= 0) return false;

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

    moment.locale("th");
    const expiryDate = moment(date).endOf("day");
    const now = moment().startOf("day");

    if (expiryDate.isBefore(now)) {
      return <Tag color="red">หมดอายุแล้ว</Tag>;
    }

    const daysLeft = expiryDate.diff(now, "days");
    const thaiDate =
      moment(date).format("D MMMM") +
      " " +
      (parseInt(moment(date).format("YYYY")) + 543);

    const text =
      daysLeft <= 7 ? `หมดอายุใน ${daysLeft} วัน` : `หมดอายุวันที่ ${thaiDate}`;

    return <Tag color={daysLeft <= 7 ? "warning" : "success"}>{text}</Tag>;
  };

  // แสดงคำแนะนำหลังจองสำเร็จ
  const showGuidelinesPopup = () => {
    Modal.success({
      title: "จองสำเร็จ! คำแนะนำในการเข้าฝึก 🧘🏻‍♀️",
      content: (
        <div style={{ maxHeight: "400px", overflow: "auto" }}>
          <p>👉🏻 ก่อนเริ่มคลาสงดการรับประทานอาหาร 1-2 ชั่วโมง</p>
          <p>
            👉🏻 ทุกครั้งที่เข้าฝึกหากมีโรคประจำตัว อาการบาดเจ็บ ประจำเดือน ผ่าตัด
            ฯลฯ โปรดระมัดระวังการเข้าฝึกและเปิดไมค์แจ้งครูในคลาสก่อนคลาสเริ่ม
          </p>
          <p>
            👉🏻 เตรียมอุปกรณ์ซัปพอร์ตช่วยการเข้าท่าให้พร้อม อาทิ เชือก บล็อค ฯลฯ
          </p>
          <p>
            👉🏻 โปรดระมัดระวังการเข้าท่า ไม่กดดันตัวเอง ไม่ฝืนร่างกายมากจนเกินไป
          </p>
          <p>👉🏻 ขณะฝึกไม่กลั้นลมหายใจ ให้ปรับลมหายใจเข้า หายใจออกตามปกติ</p>
          <p>
            👉🏻 ก่อนจบคลาสแนะนำให้นอนพักไม่นึกคิดถึงสิ่งใดๆ พักฟื้นร่างกาย 1-5
            นาที
          </p>
          <p>
            👉🏻 ประคบเย็นภายใน 24 ชั่วโมง บริเวณที่มีอาการปวด บาดเจ็บ ฯลฯ 5-10
            นาที ทำซ้ำบ่อยๆ และปรึกษาแพทย์ผู้เชี่ยวชาญ
          </p>
          <p>
            👉🏻 ประคบอุ่นหลัง 24 ชั่วโมง บริเวณที่มีอาการปวด บาดเจ็บ ฯลฯ 5-10
            นาที ทำซ้ำบ่อยๆ และปรึกษาแพทย์ผู้เชี่ยวชาญ
          </p>
          <p>
            👉🏻
            หลังฝึกเสร็จค่อยๆจิ๊บน้ำอุณหภูมิห้องจนกว่าร่างกายหายร้อยค่อยดื่มน้ำตามเยอะๆ
            ให้ขับสารพิษออกทางรูปแบบปัสสาวะ
          </p>
          <p>👉🏻 ตรวจเช็คสุขภาพเป็นประจำสม่ำเสมอ</p>
          <p>
            🙏🏻 ขอบคุณที่ใช้บริการไอแอมป์โยคะ ขอให้ทุกท่านสุขภาพร่างกายแข็งแรง
          </p>
          <p>
            🙏🏻 ขออนุญาตนำภาพบรรยากาศการฝึกลงเพจ I&apos;amp yoqa : ไอแอมป์โยคะ
            🖼️❤️
          </p>
        </div>
      ),
      okText: "เข้าใจแล้ว",
      width: 600,
    });
  };

  // จองคอร์ส - ปรับปรุงให้อัปเดต state ทันที
  const handleReserveCourse = async (classId) => {
    // ตรวจสอบ token ก่อนดำเนินการ
    const userFromToken = validateAndGetUserFromToken();
    if (!userFromToken) {
      message.error("กรุณาเข้าสู่ระบบก่อนทำการจอง ❌");
      return;
    }

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
      const fullName = getUserFullName();
      if (!fullName) {
        message.error("❌ ไม่สามารถระบุตัวตนได้ กรุณาล็อกอินใหม่");
        return;
      }

      const reservationData = {
        user_id: userFromToken.userId,
        class_id: classId,
      };

      const response = await reservationService.createReservation(
        reservationData
      );

      if (response) {
        // อัปเดตสถานะคลาสทันทีในหน้าเว็บ
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

        // อัปเดตข้อมูลผู้ใช้
        if (userInfo) {
          setUserInfo((prev) => ({
            ...prev,
            remaining_session: Math.max(0, (prev.remaining_session || 0) - 1),
          }));
        }

        handleShowDetails(classId);
        message.success("✅ จองคอร์สสำเร็จ!");
        showGuidelinesPopup();

        // รีเฟรชข้อมูลผู้ใช้
        try {
          const userResponse = await getUserById(userFromToken.userId);
          if (userResponse && userResponse.user) {
            setUserInfo(userResponse.user);
          }
        } catch (userError) {
          console.warn("Failed to refresh user data:", userError);
        }
      } else {
        message.error("❌ เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Error reserving class:", error);

      if (error.message && error.message.includes("expired")) {
        message.error("❌ คลาสของคุณหมดอายุแล้ว กรุณาซื้อโปรโมชั่นใหม่");
      } else if (error.message && error.message.includes("session")) {
        message.error("❌ คุณไม่มีจำนวนครั้งคงเหลือ กรุณาซื้อโปรโมชั่นใหม่");
      } else {
        message.error("❌ ไม่สามารถจองคลาสได้ กรุณาลองใหม่");
      }
    }
  };

  // ยกเลิกการจอง - แก้ไขปัญหาการยกเลิก
  const handleCancelReservation = async (classStartTime, classId) => {
    // ตรวจสอบ token ก่อนดำเนินการ
    const userFromToken = validateAndGetUserFromToken();
    if (!userFromToken) {
      message.error("❌ กรุณาเข้าสู่ระบบก่อนดำเนินการ");
      return;
    }

    const fullName = getUserFullName();
    if (!fullName) {
      message.error("❌ ไม่สามารถระบุตัวตนได้ กรุณาล็อกอินใหม่");
      return;
    }

    try {
      const now = new Date();
      const fiveMinutesBeforeClass = new Date(classStartTime);
      fiveMinutesBeforeClass.setMinutes(
        fiveMinutesBeforeClass.getMinutes() - 5
      );

      // ตรวจสอบเวลา
      if (now >= fiveMinutesBeforeClass) {
        Modal.error({
          title: "ไม่สามารถยกเลิกได้",
          content:
            "สามารถยกเลิกการจองได้ก่อนเริ่มคลาส 5 นาที โซนเวลาเริ่มคลาสคำนวณจากประเทศไทยปรับเปลี่ยนไปตามโซนเวลาท้องถิ่นในแต่ละประเทศให้อัตโนมัติแล้วนะคะ",
        });
        return;
      }

      // แสดง loading
      const hideLoading = message.loading("กำลังยกเลิกการจอง...", 0);

      try {
        // ดึงข้อมูลการจองจาก API
        const response = await reservationService.getUserReservations(
          userFromToken.userId
        );
        const reservations = response.reservations || [];

        console.log("User reservations:", reservations);
        console.log("Looking for class ID:", classId);
        console.log("User full name:", fullName);

        // หา reservation ที่ต้องการยกเลิก - ใช้หลายวิธีในการค้นหา
        let reservation = reservations.find(
          (res) =>
            res.class_id &&
            res.class_id._id &&
            res.class_id._id.toString() === classId.toString() &&
            res.status === "Reserved"
        );

        if (!reservation) {
          console.warn(
            "Reservation not found by class_id, trying alternative methods..."
          );

          // วิธีทางเลือก: หาจากชื่อคลาสและเวลา
          const targetEvent = events.find((e) => e.id === classId);
          if (targetEvent) {
            reservation = reservations.find(
              (res) =>
                res.class_id &&
                res.class_id.title === targetEvent.title &&
                moment(res.class_id.start_time).isSame(
                  moment(classStartTime)
                ) &&
                res.status === "Reserved"
            );
          }
        }

        hideLoading();

        if (!reservation || !reservation._id) {
          console.error("No reservation found:", {
            reservations,
            classId,
            fullName,
          });
          message.error("❌ ไม่พบข้อมูลการจอง หรือการจองถูกยกเลิกไปแล้ว");

          // รีเฟรชข้อมูลเพื่อให้แน่ใจว่าข้อมูลตรงกับเซิร์ฟเวอร์
          fetchData(userFromToken.userId);
          return;
        }

        console.log("Found reservation to cancel:", reservation);

        // ส่งคำขอยกเลิกการจองไปยัง API
        await reservationService.cancelReservation(reservation._id);

        // อัปเดตสถานะคลาสทันทีในหน้าเว็บ
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === classId
              ? {
                  ...event,
                  reserved: false,
                  amount: Math.max(0, event.amount - 1),
                  participants: (event.participants || []).filter((name) => {
                    const normalizedName = name.toLowerCase().trim();
                    const normalizedFullName = fullName.toLowerCase().trim();
                    return (
                      !normalizedName.includes(normalizedFullName) &&
                      !normalizedFullName.includes(normalizedName)
                    );
                  }),
                }
              : event
          )
        );

        // อัปเดตข้อมูลผู้ใช้
        if (userInfo) {
          setUserInfo((prev) => ({
            ...prev,
            remaining_session: (prev.remaining_session || 0) + 1,
          }));
        }

        // ปิดรายละเอียดคลาสที่ถูกยกเลิก
        setShowDetails((prev) => prev.filter((id) => id !== classId));

        message.success("✅ ยกเลิกการจองสำเร็จ");

        // รีเฟรชข้อมูลผู้ใช้
        try {
          const userResponse = await getUserById(userFromToken.userId);
          if (userResponse && userResponse.user) {
            setUserInfo(userResponse.user);
          }
        } catch (userError) {
          console.warn("Failed to refresh user data:", userError);
        }
      } catch (apiError) {
        hideLoading();
        throw apiError;
      }
    } catch (error) {
      console.error("❌ Error canceling reservation:", error);

      // แสดงข้อความแจ้งเตือนที่เฉพาะเจาะจง
      if (error.response && error.response.status === 404) {
        message.error("❌ ไม่พบข้อมูลการจอง กรุณารีเฟรชหน้าเว็บ");
        // รีเฟรชข้อมูลอัตโนมัติ
        fetchData(userFromToken.userId);
      } else if (error.response && error.response.status === 401) {
        message.error("❌ Session หมดอายุ กรุณาล็อกอินใหม่");
        // ลบ token และ redirect ไปหน้า login
        localStorage.clear();
        window.location.href = "/auth/signin";
      } else {
        message.error(
          "❌ เกิดข้อผิดพลาดในการยกเลิกการจอง กรุณาลองใหม่หรือติดต่อเจ้าหน้าที่"
        );
      }
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

  // ฟังก์ชันสำหรับกำหนด tooltip และ disabled status ของปุ่มจอง
  const getBookingButtonProps = () => {
    if (!currentUser) {
      return {
        disabled: true,
        tooltip: "กรุณาเข้าสู่ระบบเพื่อจองคลาส",
      };
    }

    if (!canBookClasses()) {
      if (userInfo?.remaining_session <= 0) {
        return {
          disabled: true,
          tooltip: "คุณไม่มีจำนวนครั้งคงเหลือ กรุณาซื้อโปรโมชั่นใหม่",
        };
      }
      if (
        userInfo?.sessions_expiry_date &&
        moment(userInfo.sessions_expiry_date).isBefore(moment())
      ) {
        return {
          disabled: true,
          tooltip: "คลาสของคุณหมดอายุแล้ว กรุณาซื้อโปรโมชั่นใหม่",
        };
      }
      return {
        disabled: true,
        tooltip: "ไม่สามารถจองคลาสได้",
      };
    }

    return {
      disabled: false,
      tooltip: "",
    };
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
            {currentUser && (
              <Button
                type="default"
                onClick={() => fetchData(currentUser.userId)}
                loading={loading}
              >
                รีเฟรชข้อมูล
              </Button>
            )}
          </div>

          {/* แบนเนอร์แสดงสถานะการหมดอายุ - เฉพาะเมื่อล็อกอินแล้ว */}
          {userInfo && currentUser && (
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

              {/* Alert messages สำหรับสถานะต่างๆ */}
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

          {/* แสดงข้อความแจ้งให้ล็อกอินเฉพาะเมื่อยังไม่ได้เข้าสู่ระบบ */}
          {!currentUser && (
            <Alert
              type="info"
              message="กรุณาเข้าสู่ระบบเพื่อจองคลาส"
              description="คุณสามารถดูข้อมูลคลาสได้ แต่ต้องเข้าสู่ระบบก่อนจึงจะสามารถจองได้"
              showIcon
              className="mb-6"
            />
          )}

          <Text>
            จองคลาสได้ตลอด สามารถยกเลิกการจองได้ก่อนเริ่มคลาส 5 นาที
            &quot;โซนเวลาเริ่มคลาสคำนวณจากประเทศไทยปรับเปลี่ยนไปตามโซนเวลาท้องถิ่นในแต่ละประเทศให้อัตโนมัติแล้วนะคะ&quot;
          </Text>

          {loading ? (
            <p className="text-center text-gray-500">กำลังโหลดข้อมูลคอร์ส...</p>
          ) : events.length === 0 ? (
            <p className="text-center text-gray-500">
              ไม่มีคอร์สที่สามารถจองได้
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {events.map((event) => {
                const bookingProps = getBookingButtonProps();

                return (
                  <Card
                    key={event.id}
                    className="p-4 rounded-lg shadow-md"
                    title={event.title}
                    style={{
                      backgroundColor: event.color
                        ? `#${event.color}`
                        : "white",
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

                    {/* แสดงรายละเอียดเมื่อจองแล้วหรือหลังจากคลิก "จองคลาสนี้" - เฉพาะเมื่อล็อกอินแล้ว */}
                    {currentUser && shouldShowDetails(event) && (
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
                      {event.reserved && currentUser ? (
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
                      ) : (
                        <Tooltip title={bookingProps.tooltip}>
                          <Button
                            type="primary"
                            className="bg-purple-600 text-white"
                            onClick={() => handleReserveCourse(event.id)}
                            disabled={bookingProps.disabled}
                          >
                            {!currentUser
                              ? "เข้าสู่ระบบเพื่อจอง"
                              : "จองคลาสนี้"}
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Booking;

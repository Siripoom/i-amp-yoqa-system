import { Button, Card, Typography, message, Alert, Tag } from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import reservationService from "../services/reservationService";
import { getUserById } from "../services/userService";

const { Title } = Typography;

const Myplane = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [bookedClasses, setBookedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const fetchUserAndBookedClasses = async () => {
      try {
        if (!userId) {
          setLoading(false);
          return;
        }

        // Fetch user info and reservations in parallel
        const [userResponse, reservationResponse] = await Promise.all([
          getUserById(userId),
          reservationService.getUserReservations(userId),
        ]);

        // Debug logs (ลบออกหลังจากทดสอบเสร็จ)
        console.log("User Response:", userResponse);
        console.log("Reservation Response:", reservationResponse);

        // Set user info
        if (userResponse && userResponse.user) {
          setUserInfo(userResponse.user);
        }

        // ดึงข้อมูลเฉพาะคลาสที่จองแล้ว
        const reservations = reservationResponse.reservations || [];
        console.log("Reservations:", reservations);

        // แปลงข้อมูล reservations เป็นรูปแบบที่ต้องการแสดงผล
        const bookedClassesData = reservations
          .filter((res) => res.status === "Reserved") // แสดงเฉพาะที่ยังจองอยู่
          .map((res) => {
            const classData = res.class_id;
            console.log("Class data from reservation:", classData);

            return {
              id: classData._id,
              reservationId: res._id,
              title: classData.title,
              instructor: classData.instructor,
              date: new Date(classData.start_time),
              description: classData.description,
              reserved: true, // เป็น true เสมอเพราะเป็นคลาสที่จองแล้ว
              zoomLink: classData.zoom_link,
              roomNumber: classData.room_number,
              passcode: classData.passcode,
              reservationDate: new Date(res.reservation_date),
            };
          });

        console.log("Booked classes data:", bookedClassesData);
        setBookedClasses(bookedClassesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("ไม่สามารถโหลดข้อมูลได้ ❌");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndBookedClasses();
  }, [userId]);

  // Format expiration date with relative time
  const formatExpiryDate = (date) => {
    if (!date) return "Not set";

    const expiryDate = moment(date);
    const now = moment();

    if (expiryDate.isBefore(now)) {
      return "Expired";
    }

    const daysLeft = expiryDate.diff(now, "days");
    if (daysLeft <= 7) {
      return (
        <span className="text-red-500 font-semibold">
          {expiryDate.format("MMMM Do YYYY")} ({daysLeft} days left)
        </span>
      );
    } else {
      return (
        <span>
          {expiryDate.format("MMMM Do YYYY")} ({daysLeft} days left)
        </span>
      );
    }
  };

  // Calculate subscription status
  const getSubscriptionStatus = () => {
    if (!userInfo) return null;

    const { remaining_session, sessions_expiry_date } = userInfo;

    if (remaining_session <= 0) {
      return <Tag color="red">Inactive</Tag>;
    }

    if (!sessions_expiry_date) {
      return <Tag color="green">Active</Tag>;
    }

    const expiryDate = moment(sessions_expiry_date);
    const now = moment();

    if (expiryDate.isBefore(now)) {
      return <Tag color="red">Expired</Tag>;
    } else {
      return <Tag color="green">Active</Tag>;
    }
  };

  // Handle cancel reservation
  const handleCancelReservation = async (reservationId, classTitle) => {
    try {
      const confirmed = window.confirm(
        `คุณต้องการยกเลิกการจอง "${classTitle}" หรือไม่?`
      );

      if (!confirmed) return;

      await reservationService.cancelReservation(reservationId);

      // Remove the cancelled class from the list
      setBookedClasses((prevClasses) =>
        prevClasses.filter((cls) => cls.reservationId !== reservationId)
      );

      // Refresh user info to get updated session count
      const userResponse = await getUserById(userId);
      if (userResponse && userResponse.user) {
        setUserInfo(userResponse.user);
      }

      message.success("✅ ยกเลิกการจองสำเร็จ!");
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      message.error("❌ ไม่สามารถยกเลิกการจองได้");
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
            {userInfo && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <Title level={4} className="mb-0">
                    Subscription Status
                  </Title>
                  {getSubscriptionStatus()}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>Remaining Sessions:</strong>{" "}
                      {userInfo.remaining_session || 0}
                    </p>
                    <p>
                      <strong>Expiration Date:</strong>{" "}
                      {formatExpiryDate(userInfo.sessions_expiry_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Link to="/course">
                      <Button type="primary" className="bg-purple-600">
                        Buy More Sessions
                      </Button>
                    </Link>
                  </div>
                </div>

                {userInfo.sessions_expiry_date &&
                  moment(userInfo.sessions_expiry_date).diff(
                    moment(),
                    "days"
                  ) <= 7 && (
                    <Alert
                      message="Expiration Warning"
                      description="Your sessions will expire soon. Please consider purchasing a new package."
                      type="warning"
                      showIcon
                      className="mt-3"
                    />
                  )}

                {userInfo.sessions_expiry_date &&
                  moment(userInfo.sessions_expiry_date).isBefore(moment()) && (
                    <Alert
                      message="Sessions Expired"
                      description="Your sessions have expired. Please purchase a new package to continue booking classes."
                      type="error"
                      showIcon
                      className="mt-3"
                    />
                  )}
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <Title level={3} className="text-purple-700 mb-0">
                My Booked Classes
              </Title>
              <Link to="/booking">
                <Button type="primary" className="bg-purple-600">
                  Book More Classes
                </Button>
              </Link>
            </div>

            {loading ? (
              <p className="text-center text-gray-500">
                กำลังโหลดข้อมูลคอร์ส...
              </p>
            ) : !userId ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  กรุณาเข้าสู่ระบบเพื่อดูคลาสที่จองไว้
                </p>
                <Link to="/auth/signin">
                  <Button type="primary" className="bg-purple-600">
                    เข้าสู่ระบบ
                  </Button>
                </Link>
              </div>
            ) : bookedClasses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">คุณยังไม่มีคลาสที่จองไว้</p>
                <Link to="/booking">
                  <Button type="primary" className="bg-purple-600">
                    จองคลาสเลย
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {bookedClasses.map((classItem) => (
                  <div key={classItem.reservationId} className="relative">
                    <Link to="/booking" className="block">
                      <Card
                        className="p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        title={classItem.title}
                        extra={
                          <div className="flex items-center gap-2">
                            <span className="text-green-500 font-semibold">
                              จองแล้ว ✅
                            </span>
                          </div>
                        }
                      >
                        <p>
                          <strong>Instructor:</strong> {classItem.instructor}
                        </p>
                        <p>
                          <strong>Class Date:</strong>{" "}
                          {moment(classItem.date).format("MMMM Do YYYY, h:mm a")}
                        </p>
                        <p>
                          <strong>Booked Date:</strong>{" "}
                          {moment(classItem.reservationDate).format("MMMM Do YYYY")}
                        </p>
                        {classItem.zoomLink && (
                          <p>
                            <strong>Zoom Link:</strong>{" "}
                            <a 
                              href={classItem.zoomLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:text-blue-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Join Class
                            </a>
                          </p>
                        )}
                        {classItem.roomNumber && (
                          <p>
                            <strong>Room:</strong> {classItem.roomNumber}
                          </p>
                        )}
                        {/* <div className="mt-4">
                          <Button
                            danger
                            onClick={(e) => {
                              e.preventDefault();
                              handleCancelReservation(classItem.reservationId, classItem.title);
                            }}
                          >
                            Cancel Reservation
                          </Button>
                        </div> */}
                      </Card>
                    </Link>
                  </div>
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

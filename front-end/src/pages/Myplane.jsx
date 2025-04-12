import { Button, Card, Typography, message, Alert, Tag } from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import classService from "../services/classService";
import reservationService from "../services/reservationService";
import { getUserById } from "../services/userService";

const { Title } = Typography;

const Myplane = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const fetchUserAndClasses = async () => {
      try {
        // Fetch user info and class data in parallel
        const [userResponse, classResponse, reservationResponse] =
          await Promise.all([
            userId ? getUserById(userId) : Promise.resolve(null),
            classService.getAllClasses(),
            userId
              ? reservationService.getUserReservations(userId)
              : Promise.resolve({ data: [] }),
          ]);

        // Set user info
        if (userResponse && userResponse.user) {
          setUserInfo(userResponse.user);
        }

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
              reserved: reservedClassIds.has(event._id),
              zoomLink: event.zoom_link,
              roomNumber: event.room_number,
              passcode: event.passcode,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("ไม่สามารถโหลดข้อมูลได้ ❌");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndClasses();
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

  // Handle reserve course
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
        // Update events state
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === classId ? { ...event, reserved: true } : event
          )
        );

        // Refresh user info to get updated session count and expiry date
        const userResponse = await getUserById(userId);
        if (userResponse && userResponse.user) {
          setUserInfo(userResponse.user);
        }

        message.success("✅ จองคอร์สสำเร็จ! ตรวจสอบรายละเอียดใน My Plane.");
      } else {
        message.error("❌ เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Error reserving class:", error);

      // More specific error messages based on the error
      if (error.message && error.message.includes("expired")) {
        message.error("❌ คลาสของคุณหมดอายุแล้ว กรุณาซื้อโปรโมชั่นใหม่");
      } else {
        message.error("❌ จองคอร์สไม่สำเร็จ กรุณาลองใหม่");
      }
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
                          disabled={
                            !userInfo ||
                            userInfo.remaining_session <= 0 ||
                            (userInfo.sessions_expiry_date &&
                              moment(userInfo.sessions_expiry_date).isBefore(
                                moment()
                              ))
                          }
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

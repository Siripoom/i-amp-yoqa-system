import { Button, Card, Typography, message, Modal } from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const { Title } = Typography;

const MyOrders = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ข้อมูลประวัติการซื้อ session
  const [purchaseHistory, setPurchaseHistory] = useState([
    {
      id: 1,
      purchaseDate: new Date(2025, 1, 5),
      totalSessions: 10,
      usedSessions: 4,
      expirationDate: new Date(2025, 3, 5),
    },
    {
      id: 2,
      purchaseDate: new Date(2025, 1, 10),
      totalSessions: 5,
      usedSessions: 2,
      expirationDate: new Date(2025, 4, 10),
    },
  ]);

  // ข้อมูล Mockup ของประวัติการใช้ Session
  const sessionHistoryMockup = [
    { date: "2025-02-01", status: "ใช้แล้ว ✅", note: "คลาสปกติ" },
    { date: "2025-02-05", status: "ใช้แล้ว ✅", note: "โยคะตอนเช้า" },
    { date: "2025-02-10", status: "ยังไม่ได้ใช้ ❌", note: "-" },
    { date: "2025-02-15", status: "ยังไม่ได้ใช้ ❌", note: "-" },
  ];

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);

  // เปิด Modal และตั้งค่าข้อมูลที่จะแสดง
  const showModal = () => {
    setSelectedHistory(sessionHistoryMockup);
    setIsModalVisible(true);
  };

  // ปิด Modal
  const handleCancel = () => {
    setIsModalVisible(false);
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
              <a href="/profile" className="text-gray-400 cursor-pointer block">
                My Profile
              </a>
              <a
                href="/my-plane"
                className="text-gray-400 cursor-pointer block"
              >
                My Plane
              </a>
              <a
                href="/my-orders"
                className="text-purple-600 font-semibold cursor-pointer block"
              >
                My Orders
              </a>
            </div>
          </Card>

          {/* ประวัติการซื้อ Session */}
          <div className="w-full lg:w-3/4 p-8 lg:ml-6 mt-6 lg:mt-0 rounded-2xl shadow-md bg-white">
            <Title level={3} className="text-purple-700">
              My Purchased Sessions
            </Title>

            {/* แสดง session ที่ซื้อเป็น Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {purchaseHistory.map((course) => (
                <Card key={course.id} className="p-4 rounded-lg shadow-md">
                  <p>
                    <strong>จำนวน Session:</strong> {course.totalSessions}
                  </p>
                  <p>
                    <strong>ใช้ไปแล้ว:</strong> {course.usedSessions} /{" "}
                    {course.totalSessions}
                  </p>
                  <p>
                    <strong>หมดอายุ:</strong>{" "}
                    {moment(course.expirationDate).format("MMMM Do YYYY")}
                  </p>

                  {/* ปุ่มดูรายละเอียด */}
                  <Button className="mt-2" onClick={showModal}>
                    ดูรายละเอียด
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal สำหรับแสดงประวัติการใช้ Session */}
      <Modal
        title="ประวัติการใช้ Session"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel}>
            ปิด
          </Button>,
        ]}
      >
        <div className="space-y-3">
          {selectedHistory.map((session, index) => (
            <div key={index} className="p-2 border rounded-md shadow-sm">
              <p>
                <strong>วันที่:</strong>{" "}
                {moment(session.date).format("DD MMM YYYY")}
              </p>
              <p>
                <strong>สถานะ:</strong>{" "}
                <span className="text-green-500">{session.status}</span>
              </p>
              <p>
                <strong>หมายเหตุ:</strong> {session.note}
              </p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MyOrders;

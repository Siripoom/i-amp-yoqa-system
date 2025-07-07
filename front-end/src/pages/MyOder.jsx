import { Button, Card, Typography, message, Modal, Badge, Tag } from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import orderService from "../services/orderService";
import { Link } from "react-router-dom";
const { Title, Text } = Typography;
import dayjs from "dayjs";
const MyOrders = () => {
  const [orders, setOrders] = useState([]); // เก็บรายการ Order จริง
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        message.error("Please log in to view your orders.");
        return;
      }

      const response = await orderService.getOrdersByUserId(userId);

      if (response.data && Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      message.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  // เปิด Modal และตั้งค่าข้อมูลที่จะแสดง
  const showModal = (order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  // ปิด Modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // ฟังก์ชันสำหรับแสดงสถานะด้วยสีที่แตกต่างกัน
  const getStatusTag = (status) => {
    let color = "";
    switch (status) {
      case "อนุมัติ":
        color = "success";
        break;
      case "รออนุมัติ":
        color = "warning";
        break;
      case "ยกเลิก":
        color = "error";
        break;
      default:
        color = "default";
    }
    return <Tag color={color}>{status}</Tag>;
  };

  // คำนวณจำนวนครั้งและระยะเวลาทั้งหมด
  const calculateTotals = (order) => {
    // ใช้ค่าจาก API โดยตรงถ้ามี
    if (order.total_sessions && order.total_duration && order.total_price) {
      return {
        totalSessions: order.total_sessions,
        totalDuration: order.total_duration,
        totalPrice: order.total_price,
        quantity: order.quantity || 1,
      };
    }

    // คำนวณเองถ้าไม่มีค่าจาก API
    const quantity = order.quantity || 1;
    const sessionsPerUnit = order.product_id?.sessions || 0;
    const durationPerUnit = order.product_id?.duration || 0;
    const pricePerUnit = order.product_id?.price || 0;

    return {
      totalSessions: sessionsPerUnit * quantity,
      totalDuration: durationPerUnit * quantity,
      totalPrice: pricePerUnit * quantity,
      quantity,
    };
  };

  // แก้ไขการคำนวณวันที่เหลือใช้งาน
  const calculateRemainingDays = (date) => {
    if (!date) return { text: "Not set", daysLeft: null };

    const expiryDate = moment(date).endOf("day");
    const now = moment().startOf("day");

    if (expiryDate.isBefore(now)) {
      return { text: "Expired", daysLeft: 0, status: "error" };
    }

    const daysLeft = expiryDate.diff(now, "days");
    return {
      text: expiryDate.format("YYYY-MM-DD"),
      daysLeft,
      status: daysLeft <= 7 ? "warning" : "success",
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
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start justify-center">
          {/* Sidebar */}
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
                className="text-gray-400 cursor-pointer block"
              >
                My Plane
              </Link>
              <Link
                to="/my-orders"
                className="text-purple-600 font-semibold cursor-pointer block"
              >
                My Orders
              </Link>
            </div>
          </Card>

          {/* ประวัติการซื้อ Session */}
          <div className="w-full lg:w-3/4 p-8 lg:ml-6 mt-6 lg:mt-0 rounded-2xl shadow-md bg-white">
            <Title level={3} className="text-purple-700">
              My Purchased Sessions
            </Title>

            {/* แสดง Loading */}
            {loading ? (
              <div className="text-center text-blue-500 font-semibold">
                Loading orders...
              </div>
            ) : orders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {orders.map((order) => {
                  const { totalSessions, totalDuration, totalPrice, quantity } =
                    calculateTotals(order);

                  return (
                    <Card key={order._id} className="p-4 rounded-lg shadow-md">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-gray-700">
                          {order.product_id?.sessions || "N/A"} Sessions
                        </p>
                        {getStatusTag(order.status)}
                      </div>

                      <div className="mt-2">
                        <p>
                          <strong>Order Date:</strong>{" "}
                          {moment(order.order_date).format("DD MMM YYYY")}
                        </p>

                        {quantity > 1 && (
                          <p>
                            <strong>Quantity:</strong> {quantity} รายการ
                          </p>
                        )}

                        <p>
                          <strong>Total Sessions:</strong> {totalSessions} ครั้ง
                        </p>

                        {totalDuration > 0 && (
                          <p>
                            <strong>Duration:</strong> {totalDuration} วัน
                          </p>
                        )}

                        <p>
                          <strong>Price:</strong> {totalPrice} THB
                        </p>
                      </div>

                      {/* ปุ่มดูรายละเอียด */}
                      <Button
                        className="mt-3 bg-pink-100 text-pink-600 hover:bg-pink-200 border-pink-300"
                        onClick={() => showModal(order)}
                      >
                        ดูรายละเอียด
                      </Button>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-4">คุณยังไม่มีประวัติการสั่งซื้อ</p>
                <Link to="/product">
                  <Button type="primary" className="bg-pink-500">
                    ซื้อ Session
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal สำหรับแสดงรายละเอียดคำสั่งซื้อ */}
      <Modal
        title="รายละเอียดคำสั่งซื้อ"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel}>
            ปิด
          </Button>,
        ]}
      >
        {selectedOrder && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p>
                <strong>Order ID:</strong> {selectedOrder._id}
              </p>
              {getStatusTag(selectedOrder.status)}
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-2 gap-2">
                <p>
                  <strong>จำนวนต่อชิ้น:</strong>{" "}
                  {selectedOrder?.product_id?.sessions || "N/A"} ครั้ง
                </p>
                <p>
                  <strong>ราคาต่อชิ้น:</strong>{" "}
                  {selectedOrder?.product_id?.price || "N/A"} THB
                </p>
                <p>
                  <strong>ระยะเวลาต่อชิ้น:</strong>{" "}
                  {selectedOrder?.product_id?.duration || "N/A"} วัน
                </p>
                <p>
                  <strong>จำนวนที่ซื้อ:</strong> {selectedOrder.quantity || 1}{" "}
                  ชิ้น
                </p>
              </div>

              <div className="border-t border-gray-200 my-3"></div>

              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  const { totalSessions, totalDuration, totalPrice } =
                    calculateTotals(selectedOrder);

                  return (
                    <>
                      <p>
                        <strong>รวมจำนวนครั้ง:</strong> {totalSessions} ครั้ง
                      </p>
                      <p>
                        <strong>รวมระยะเวลา:</strong> {totalDuration} วัน
                      </p>
                      <p>
                        <strong>ราคาสุทธิ:</strong>{" "}
                        <span className="text-red-600 font-bold">
                          {totalPrice} THB
                        </span>
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            <p>
              <strong>วันที่สั่งซื้อ:</strong>{" "}
              {moment(selectedOrder?.order_date).format("DD MMM YYYY HH:mm")}
            </p>

            {selectedOrder.approval_date && (
              <p>
                <strong>วันที่อนุมัติ:</strong>{" "}
                {moment(selectedOrder.approval_date).format(
                  "DD MMM YYYY HH:mm"
                )}
              </p>
            )}

            {selectedOrder.first_used_date && (
              <>
                <p>
                  <strong>วันที่เริ่มใช้งาน:</strong>{" "}
                  {moment(selectedOrder.first_used_date).format(
                    "DD MMM YYYY HH:mm"
                  )}
                </p>

                {/* หากมีวันที่เริ่มใช้งานและวันหมดอายุ แสดงวันที่เหลือ */}
                {selectedOrder.sessions_expiry_date && (
                  <p>
                    <strong>วันที่เหลือ:</strong>{" "}
                    {calculateRemainingDays(selectedOrder.sessions_expiry_date)}{" "}
                    วัน (หมดอายุวันที่{" "}
                    {moment(selectedOrder.sessions_expiry_date).format(
                      "DD MMM YYYY"
                    )}
                    )
                  </p>
                )}
              </>
            )}

            {selectedOrder.invoice_number && (
              <p>
                <strong>เลขที่ใบเสร็จ:</strong> {selectedOrder.invoice_number}
              </p>
            )}

            {/* แสดงภาพใบเสร็จถ้ามี */}
            {selectedOrder?.image ? (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <p>
                  <strong>หลักฐานการชำระเงิน:</strong>
                </p>
                <img
                  src={selectedOrder.image}
                  alt="Payment Slip"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "8px",
                    marginTop: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                />
              </div>
            ) : (
              <p style={{ color: "gray", textAlign: "center" }}>
                No payment slip uploaded
              </p>
            )}

            {selectedOrder.status === "อนุมัติ" && (
              <div className="bg-green-50 p-3 rounded-md border border-green-200 mt-4">
                <Text className="text-green-700">
                  การสั่งซื้อนี้ได้รับการอนุมัติแล้ว คุณสามารถใช้บริการได้ทันที
                </Text>
              </div>
            )}

            {selectedOrder.status === "รออนุมัติ" && (
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-4">
                <Text className="text-yellow-700">
                  การสั่งซื้อนี้อยู่ระหว่างการตรวจสอบ
                  กรุณารอการยืนยันจากเจ้าหน้าที่
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
};

export default MyOrders;

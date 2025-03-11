import { Button, Card, Typography, message, Modal } from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import orderService from "../services/orderService";
import { Link } from "react-router-dom";
const { Title } = Typography;

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
      console.log("Orders Response:", response); // ✅ Debug API Response

      if (response.orders && Array.isArray(response.orders)) {
        setOrders(response.orders);
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
              {/* <a
                href="/my-plane"
                className="text-gray-400 cursor-pointer block"
              >
                My Plane
              </a> */}
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
                {orders.map((order) => (
                  <Card key={order._id} className="p-4 rounded-lg shadow-md">
                    <p>
                      <strong>Order ID:</strong> {order._id}
                    </p>
                    <p>
                      <strong>Session:</strong>{" "}
                      {order.product_id?.sessions || "N/A"} ครั้ง
                    </p>
                    <p>
                      <strong>Price:</strong> {order.product_id?.price || "N/A"}{" "}
                      THB
                    </p>
                    <p>
                      <strong>Order Date:</strong>{" "}
                      {moment(order.order_date).format("DD MMM YYYY")}
                    </p>
                    <p>
                      <strong>Status:</strong> {order.status || "N/A"}
                    </p>

                    {/* ปุ่มดูรายละเอียด */}
                    <Button className="mt-2" onClick={() => showModal(order)}>
                      ดูรายละเอียด
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">No orders found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal สำหรับแสดงรายละเอียดคำสั่งซื้อ */}
      {/* Modal สำหรับแสดงรายละเอียดคำสั่งซื้อ */}
      <Modal
        title="รายละเอียดคำสั่งซื้อ"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel}>
            ปิด
          </Button>,
        ]}
      >
        {selectedOrder && (
          <div className="space-y-3">
            <p>
              <strong>Order ID:</strong> {selectedOrder._id}
            </p>
            <p>
              <strong>Product Name:</strong>{" "}
              {selectedOrder?.product_id?._id || "N/A"}
            </p>
            <p>
              <strong>Sessions:</strong>{" "}
              {selectedOrder?.product_id?.sessions || "N/A"} ครั้ง
            </p>
            <p>
              <strong>Price:</strong>{" "}
              {selectedOrder?.product_id?.price || "N/A"} THB
            </p>
            <p>
              <strong>Order Date:</strong>{" "}
              {moment(selectedOrder?.order_date).format("DD MMM YYYY")}
            </p>
            <p>
              <strong>Status:</strong> {selectedOrder?.status || "N/A"}
            </p>

            {/* ✅ แสดงภาพใบเสร็จถ้ามี */}
            {selectedOrder?.image ? (
              <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <p>
                  <strong>Payment Slip:</strong>
                </p>
                <img
                  src={`http://localhost:5000${selectedOrder.image}`}
                  alt="Payment Slip"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "8px",
                  }}
                />
              </div>
            ) : (
              <p style={{ color: "gray", textAlign: "center" }}>
                No payment slip uploaded
              </p>
            )}
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
};

export default MyOrders;

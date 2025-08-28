import { Button, Card, Typography, message, Modal, Badge, Tag, Tooltip, Divider } from "antd";
import { useState, useEffect } from "react";
import moment from "moment";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import orderService from "../services/orderService";
import receiptService from "../services/receiptService";
import { Link } from "react-router-dom";
import { FilePdfOutlined, EyeOutlined, ShoppingOutlined, BookOutlined } from "@ant-design/icons";
const { Title, Text } = Typography;
import dayjs from "dayjs";

const MyOrders = () => {
  const [orders, setOrders] = useState([]); // เก็บรายการ Order จริง
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receipts, setReceipts] = useState({}); // เก็บใบเสร็จตาม order ID
  const [receiptLoading, setReceiptLoading] = useState({}); // loading state สำหรับแต่ละใบเสร็จ

  useEffect(() => {
    window.scrollTo(0, 0);

    // ตรวจสอบ token ก่อนเรียก API
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      message.error("กรุณาเข้าสู่ระบบ");
      return;
    }

    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("token");

      console.log('📱 Debug fetchOrders in MyOder.jsx:');
      console.log('  - User ID from localStorage:', userId);
      console.log('  - Token exists:', !!token);

      if (!userId) {
        console.log('❌ No user ID found');
        message.error("Please log in to view your orders.");
        return;
      }

      if (!token) {
        console.log('❌ No token found');
        message.error("Authentication token not found. Please log in again.");
        return;
      }

      console.log('🚀 Calling orderService.getOrdersByUserId...');
      const response = await orderService.getOrdersByUserId(userId);

      console.log('📦 Response received:', response);

      if (response.status === "success" && response.data && Array.isArray(response.data)) {
        console.log('✅ Setting orders from response.data:', response.data.length, 'orders');
        setOrders(response.data);
      } else if (response.data && Array.isArray(response.data)) {
        console.log('✅ Setting orders from response.data (fallback):', response.data.length, 'orders');
        setOrders(response.data);
      } else {
        console.log('⚠️ No orders found, setting empty array');
        setOrders([]);
      }
    } catch (error) {
      console.error("❌ Fetch orders error:", error);

      if (error.message && error.message.includes("No orders found")) {
        setOrders([]);
        message.info("คุณยังไม่มีประวัติการสั่งซื้อ");
      } else if (error.message && error.message.includes("401")) {
        message.error("กรุณาเข้าสู่ระบบใหม่");
      } else if (error.message && error.message.includes("403")) {
        message.error("ไม่มีสิทธิ์เข้าถึงข้อมูล");
      } else if (error.message && error.message.includes("Access denied")) {
        message.error("ไม่มีสิทธิ์เข้าถึงข้อมูล");
      } else {
        message.error("Failed to load orders. Please try again.");
      }
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

  // ดึงใบเสร็จตาม order ID
  const fetchReceiptForOrder = async (orderId) => {
    if (receipts[orderId]) return; // ถ้ามีแล้วไม่ต้องดึงซ้ำ

    setReceiptLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await receiptService.getReceiptByOrderId(orderId);
      if (response.success && response.data) {
        setReceipts(prev => ({ ...prev, [orderId]: response.data }));
      }
    } catch (error) {
      console.error('Error fetching receipt for order:', error);
      // ไม่แสดง error message เพราะอาจไม่มีใบเสร็จสำหรับ order นี้
    } finally {
      setReceiptLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // ดาวน์โหลดใบเสร็จ PDF
  const downloadReceiptPDF = async (receiptId, receiptNumber) => {
    try {
      const blob = await receiptService.downloadReceiptPDF(receiptId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receiptNumber}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('ดาวน์โหลดใบเสร็จ PDF สำเร็จ');
    } catch (error) {
      console.error('Error downloading receipt PDF:', error);
      message.error('ไม่สามารถดาวน์โหลดใบเสร็จได้');
    }
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

  // ฟังก์ชันสำหรับแสดงข้อมูลสินค้าตามประเภท
  const getOrderDisplayInfo = (order) => {
    const isProduct = order.order_type === "product";
    const isGoods = order.order_type === "goods";

    if (isProduct) {
      // สำหรับสินค้าประเภท product (คอร์สออนไลน์)
      const { totalSessions, totalDuration, totalPrice, quantity } = calculateTotals(order);
      return {
        title: `${order.product_id?.sessions || "N/A"} Sessions`,
        icon: <BookOutlined className="text-blue-500" />,
        type: "คอร์สออนไลน์",
        details: [
          { label: "จำนวนครั้ง", value: `${totalSessions} ครั้ง` },
          { label: "ระยะเวลา", value: `${totalDuration} วัน` },
          { label: "ราคา", value: `${totalPrice} THB` }
        ],
        quantity: quantity
      };
    } else if (isGoods) {
      // สำหรับสินค้าประเภท goods (สินค้าที่จับต้องได้)
      const item = order.goods_id;
      const totalPrice = (item?.price || 0) * (order.quantity || 1);
      return {
        title: item?.goods || "สินค้า",
        icon: <ShoppingOutlined className="text-green-500" />,
        type: "สินค้าที่จับต้องได้",
        details: [
          { label: "รหัสสินค้า", value: item?.code || "N/A" },
          { label: "รายละเอียด", value: item?.detail || "N/A" },
          { label: "ขนาด", value: order.size || "N/A" },
          { label: "สี", value: order.color || "N/A" },
          { label: "ราคา", value: `${totalPrice} THB` }
        ],
        quantity: order.quantity || 1
      };
    }

    return {
      title: "สินค้าไม่ระบุประเภท",
      icon: <ShoppingOutlined />,
      type: "ไม่ระบุ",
      details: [],
      quantity: 1
    };
  };

  // คำนวณจำนวนครั้งและระยะเวลาทั้งหมด (สำหรับ product เท่านั้น)
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

          {/* ประวัติการสั่งซื้อ */}
          <div className="w-full lg:w-3/4 p-8 lg:ml-6 mt-6 lg:mt-0 rounded-2xl shadow-md bg-white">
            <Title level={3} className="text-purple-700">
              ประวัติการสั่งซื้อของฉัน
            </Title>

            {/* แสดง Loading */}
            {loading ? (
              <div className="text-center text-blue-500 font-semibold">
                Loading orders...
              </div>
            ) : orders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {orders.map((order) => {
                  const orderInfo = getOrderDisplayInfo(order);

                  return (
                    <Card key={order._id} className="p-4 rounded-lg shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {orderInfo.icon}
                          <div>
                            <p className="font-bold text-gray-700">
                              {orderInfo.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {orderInfo.type}
                            </p>
                          </div>
                        </div>
                        {getStatusTag(order.status)}
                      </div>

                      <div className="mt-2 space-y-1">
                        <p>
                          <strong>วันที่สั่งซื้อ:</strong>{" "}
                          {moment(order.order_date).format("DD MMM YYYY")}
                        </p>

                        {orderInfo.quantity > 1 && (
                          <p>
                            <strong>จำนวน:</strong> {orderInfo.quantity} รายการ
                          </p>
                        )}

                        {orderInfo.details.map((detail, index) => (
                          <p key={index}>
                            <strong>{detail.label}:</strong> {detail.value}
                          </p>
                        ))}
                      </div>

                      {/* ปุ่มดูรายละเอียดและใบเสร็จ */}
                      <div className="mt-3 space-y-2">
                        <Button
                          className="w-full bg-pink-100 text-pink-600 hover:bg-pink-200 border-pink-300"
                          onClick={() => showModal(order)}
                        >
                          ดูรายละเอียด
                        </Button>

                        {/* ปุ่มดึงใบเสร็จ */}
                        <Button
                          className="w-full bg-blue-100 text-blue-600 hover:bg-blue-200 border-blue-300"
                          loading={receiptLoading[order._id]}
                          onClick={() => fetchReceiptForOrder(order._id)}
                        >
                          <EyeOutlined /> ดูใบเสร็จ
                        </Button>

                        {/* แสดงปุ่มดาวน์โหลดใบเสร็จถ้ามี */}
                        {receipts[order._id] && (
                          <Tooltip title="ดาวน์โหลด PDF">
                            <Button
                              size="small"
                              icon={<FilePdfOutlined />}
                              onClick={() => downloadReceiptPDF(receipts[order._id]._id, receipts[order._id].receiptNumber)}
                              className="w-full bg-green-100 text-green-600 hover:bg-green-200 border-green-300"
                            >
                              ดาวน์โหลด PDF
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-4">คุณยังไม่มีประวัติการสั่งซื้อ</p>
                <div className="space-x-4">
                  <Link to="/course">
                    <Button type="primary" className="bg-pink-500">
                      ซื้อคอร์สออนไลน์
                    </Button>
                  </Link>
                </div>
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
        width={600}
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
              {selectedOrder.order_type === "product" ? (
                // แสดงข้อมูลสำหรับ product (คอร์สออนไลน์)
                <div>
                  <h4 className="font-semibold text-blue-600 mb-3">
                    <BookOutlined /> ข้อมูลคอร์สออนไลน์
                  </h4>
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
              ) : selectedOrder.order_type === "goods" ? (
                // แสดงข้อมูลสำหรับ goods (สินค้าที่จับต้องได้)
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">
                    <ShoppingOutlined /> ข้อมูลสินค้า
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      <strong>ชื่อสินค้า:</strong>{" "}
                      {selectedOrder?.goods_id?.goods || "N/A"}
                    </p>
                    <p>
                      <strong>รหัสสินค้า:</strong>{" "}
                      {selectedOrder?.goods_id?.code || "N/A"}
                    </p>
                    <p>
                      <strong>รายละเอียด:</strong>{" "}
                      {selectedOrder?.goods_id?.detail || "N/A"}
                    </p>
                    <p>
                      <strong>ราคาต่อชิ้น:</strong>{" "}
                      {selectedOrder?.goods_id?.price || "N/A"} THB
                    </p>
                    <p>
                      <strong>ขนาด:</strong>{" "}
                      {selectedOrder.size || "N/A"}
                    </p>
                    <p>
                      <strong>สี:</strong>{" "}
                      {selectedOrder.color || "N/A"}
                    </p>
                    <p>
                      <strong>จำนวนที่ซื้อ:</strong> {selectedOrder.quantity || 1}{" "}
                      ชิ้น
                    </p>
                    <p>
                      <strong>ราคาสุทธิ:</strong>{" "}
                      <span className="text-red-600 font-bold">
                        {(selectedOrder?.goods_id?.price || 0) * (selectedOrder.quantity || 1)} THB
                      </span>
                    </p>
                  </div>

                  {/* ข้อมูลการจัดส่งสำหรับ goods */}
                  {selectedOrder.address && (
                    <div className="border-t border-gray-200 my-3 pt-3">
                      <h5 className="font-semibold mb-2">ข้อมูลการจัดส่ง</h5>
                      <p><strong>ที่อยู่:</strong> {selectedOrder.address}</p>
                      {selectedOrder.phone_number && (
                        <p><strong>เบอร์โทร:</strong> {selectedOrder.phone_number}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p>ไม่สามารถแสดงข้อมูลสินค้าได้</p>
              )}
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

            {/* ส่วนแสดงข้อมูลใบเสร็จ */}
            <Divider />
            <div className="bg-blue-50 p-4 rounded-md">
              <Title level={5} className="text-blue-700 mb-3">
                ข้อมูลใบเสร็จ
              </Title>

              {receipts[selectedOrder._id] ? (
                <div className="space-y-2">
                  <p><strong>เลขที่ใบเสร็จ:</strong> {receipts[selectedOrder._id].receiptNumber}</p>
                  <p><strong>วันที่สร้าง:</strong> {moment(receipts[selectedOrder._id].createdAt).format('DD/MM/YYYY HH:mm')}</p>
                  <p><strong>ยอดรวม:</strong> ฿{receipts[selectedOrder._id].totalAmount?.toLocaleString()}</p>

                  <div className="mt-3">
                    <Tooltip title="ดาวน์โหลด PDF">
                      <Button
                        icon={<FilePdfOutlined />}
                        onClick={() => downloadReceiptPDF(receipts[selectedOrder._id]._id, receipts[selectedOrder._id].receiptNumber)}
                        className="bg-green-100 text-green-600 hover:bg-green-200 border-green-300"
                      >
                        ดาวน์โหลด PDF
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-500 mb-2">ยังไม่มีใบเสร็จสำหรับคำสั่งซื้อนี้</p>
                  <Button
                    type="primary"
                    loading={receiptLoading[selectedOrder._id]}
                    onClick={() => fetchReceiptForOrder(selectedOrder._id)}
                    className="bg-blue-600"
                  >
                    <EyeOutlined /> ดูใบเสร็จ
                  </Button>
                </div>
              )}
            </div>

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
                  การสั่งซื้อนี้ได้รับการอนุมัติแล้ว {selectedOrder.order_type === "product" ? "คุณสามารถใช้บริการได้ทันที" : "สินค้าจะถูกจัดส่งให้คุณ"}
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
